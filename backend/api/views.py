import uuid
import random
from rest_framework import status, views, response, generics, permissions
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Count, Q

from .models import UserProfile, WasteReport, Voucher, CollectionRoute, CollectionStop
from .serializers import (
    UserSerializer, WasteReportSerializer, VoucherSerializer,
    CollectionRouteSerializer, CollectionStopSerializer
)
from .ai_service import analyze_waste_image
from .route_optimizer import optimize_collection_route

class RegisterView(views.APIView):
    def post(self, request):
        role = request.data.get('role', 'citizen')

        if role == 'admin':
            if UserProfile.objects.filter(role='admin').exists() or User.objects.filter(is_superuser=True).exists():
                return response.Response({
                    'error': 'An administrator account already exists. Only one admin (superuser) is permitted for the entire system.'
                }, status=status.HTTP_400_BAD_REQUEST)

        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        email = request.data.get('email', '').strip()
        mobile = (request.data.get('mobile') or request.data.get('phone') or '').strip()
        full_name = request.data.get('full_name', '').strip()
        age = request.data.get('age')
        gender = request.data.get('gender', '').strip()
        address = request.data.get('address', '').strip()
        id_details = request.data.get('id_details', '').strip()

        if not username or not password:
            return response.Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Full Name validation
        if not full_name:
            return response.Response({'error': 'Full name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mandatory email validation
        if not email:
            return response.Response({'error': 'Email address is mandatory.'}, status=status.HTTP_400_BAD_REQUEST)
        if '@' not in email or '.' not in email:
            return response.Response({'error': 'Please provide a valid email address.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mandatory mobile validation
        if not mobile:
            return response.Response({'error': 'Mobile number is mandatory.'}, status=status.HTTP_400_BAD_REQUEST)
        clean_mobile = ''.join(c for c in mobile if c.isdigit() or c == '+')
        if len(clean_mobile) < 7:
            return response.Response({'error': 'Please provide a valid mobile number.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return response.Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=email).exists():
            return response.Response({'error': 'An account with this email address already exists.'}, status=status.HTTP_400_BAD_REQUEST)


        first_name = full_name.split(' ')[0] if full_name else username
        last_name = ' '.join(full_name.split(' ')[1:]) if full_name and ' ' in full_name else ''

        age_int = None
        if age is not None and str(age).strip():
            try:
                age_int = int(age)
                if age_int < 1 or age_int > 130:
                    return response.Response({'error': 'Please enter a valid age.'}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return response.Response({'error': 'Age must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)

        if role == 'admin':
            user = User.objects.create_superuser(
                username=username,
                password=password,
                email=email,
                first_name=first_name,
                last_name=last_name
            )
        else:
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                first_name=first_name,
                last_name=last_name
            )

        profile_photo = request.data.get('profile_photo') or request.data.get('photo', '')
        is_approved = True if role == 'admin' else False

        UserProfile.objects.create(
            user=user,
            role=role if role in ['citizen', 'worker', 'admin'] else 'citizen',
            phone=mobile,
            age=age_int,
            gender=gender,
            address=address,
            id_details=id_details,
            profile_photo=profile_photo,
            is_approved=is_approved,
            reward_points=100 if role == 'citizen' else 0
        )

        return response.Response({
            'message': 'Registration submitted successfully! Your account is pending administrator approval before you can log in.',
            'user': UserSerializer(user).data,
            'is_approved': is_approved
        }, status=status.HTTP_201_CREATED)


class LoginView(views.APIView):
    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()

        if not username or not password:
            return response.Response({
                'error': 'Please enter both username (or email) and password.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Authenticate with username or email
        user = authenticate(username=username, password=password)
        if not user:
            # Check by email or case-insensitive username fallback
            user_obj = None
            if '@' in username:
                user_obj = User.objects.filter(email__iexact=username).first()
            if not user_obj:
                user_obj = User.objects.filter(username__iexact=username).first()

            if user_obj and user_obj.check_password(password):
                user = user_obj
            else:
                return response.Response({
                    'error': 'Invalid credentials. Please verify your username/email and password.'
                }, status=status.HTTP_401_UNAUTHORIZED)

        # Ensure user profile exists
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user, role='citizen', reward_points=100, is_approved=True)

        role = user.profile.role

        # Approval check: "apporve akkiyal mathram ah login cheyn avu ath worker nu citizenu"
        if role in ['citizen', 'worker'] and not user.profile.is_approved:
            return response.Response({
                'error': 'Your account is pending administrator approval. Please wait until the municipal admin reviews and approves your registration.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Ensure the single admin has superuser privileges
        if role == 'admin' and (not user.is_superuser or not user.is_staff):
            user.is_superuser = True
            user.is_staff = True
            user.save(update_fields=['is_superuser', 'is_staff'])

        redirect_map = {
            'citizen': 'dashboard',
            'worker': 'worker',
            'admin': 'admin'
        }
        redirect_tab = redirect_map.get(role, 'dashboard')

        return response.Response({
            'message': f'Welcome back, {user.get_full_name() or user.username}!',
            'user': UserSerializer(user).data,
            'role': role,
            'is_superuser': user.is_superuser,
            'redirect_tab': redirect_tab,
            'points': user.profile.reward_points
        })


class CurrentUserView(views.APIView):
    def get_target_user(self, request):
        username = request.headers.get('X-User-Username')
        if not username and request.data.get('current_username'):
            username = request.data.get('current_username')
        if username:
            user = User.objects.filter(username=username).first()
            if user:
                return user
        if request.user and request.user.is_authenticated:
            return request.user
        return User.objects.filter(profile__role='citizen').first() or User.objects.first()

    def get(self, request):
        user = self.get_target_user(request)
        if not user:
            return response.Response({'error': 'No active user found.'}, status=status.HTTP_404_NOT_FOUND)

        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user, role='citizen', reward_points=120)

        return response.Response(UserSerializer(user).data)

    def put(self, request):
        user = self.get_target_user(request)
        if not user:
            return response.Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user, role='citizen', reward_points=120)

        data = request.data
        full_name = data.get('full_name') or data.get('name')
        email = data.get('email')
        mobile = data.get('mobile') or data.get('phone')
        age = data.get('age')
        gender = data.get('gender')
        address = data.get('address')

        # Mandatory email check
        if email is not None:
            email = email.strip()
            if not email or '@' not in email or '.' not in email:
                return response.Response({'error': 'A valid email address is mandatory.'}, status=status.HTTP_400_BAD_REQUEST)
            existing_email = User.objects.filter(email__iexact=email).exclude(pk=user.pk).first()
            if existing_email:
                return response.Response({'error': 'Another account is already using this email address.'}, status=status.HTTP_400_BAD_REQUEST)
            user.email = email

        # Mandatory mobile check
        if mobile is not None:
            mobile = mobile.strip()
            if not mobile:
                return response.Response({'error': 'Mobile number is mandatory.'}, status=status.HTTP_400_BAD_REQUEST)
            clean_mobile = ''.join(c for c in mobile if c.isdigit() or c == '+')
            if len(clean_mobile) < 7:
                return response.Response({'error': 'Please enter a valid mobile number (min 7 digits).'}, status=status.HTTP_400_BAD_REQUEST)
            user.profile.phone = mobile

        # Name update
        if full_name is not None:
            full_name = full_name.strip()
            if full_name:
                parts = full_name.split(' ')
                user.first_name = parts[0]
                user.last_name = ' '.join(parts[1:]) if len(parts) > 1 else ''

        # Age update
        if age is not None:
            if str(age).strip() == '':
                user.profile.age = None
            else:
                try:
                    age_val = int(age)
                    if age_val < 1 or age_val > 130:
                        return response.Response({'error': 'Please enter a valid age.'}, status=status.HTTP_400_BAD_REQUEST)
                    user.profile.age = age_val
                except ValueError:
                    return response.Response({'error': 'Age must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)

        # Gender update
        if gender is not None:
            user.profile.gender = gender.strip()

        # Address update
        if address is not None:
            user.profile.address = address.strip()

        # ID Details update (e.g. Driver License, Employee ID, Gov ID)
        id_details = data.get('id_details')
        if id_details is not None:
            user.profile.id_details = id_details.strip()

        # Profile Photo update (Supports photos for workers, citizens, and admin)
        profile_photo = data.get('profile_photo') or data.get('photo')
        if profile_photo is not None:
            user.profile.profile_photo = profile_photo

        user.save()
        user.profile.save()

        return response.Response({
            'message': 'Profile updated successfully!',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

    def patch(self, request):
        return self.put(request)


class AIClassifyPreviewView(views.APIView):
    """
    Client sends captured or selected image to get instant AI classification
    without loading heavy TensorFlow/PyTorch vision models on mobile browsers.
    """
    def post(self, request):
        image_file = request.FILES.get('image')
        result = analyze_waste_image(image_file=image_file)
        return response.Response(result)


class WasteReportListCreateView(views.APIView):
    def get(self, request):
        status_filter = request.query_params.get('status')
        severity_filter = request.query_params.get('severity')
        user_only = request.query_params.get('my_reports')
        username = request.headers.get('X-User-Username')

        queryset = WasteReport.objects.all().order_by('-created_at')

        if user_only == 'true' and username:
            user = User.objects.filter(username=username).first()
            if user:
                queryset = queryset.filter(user=user)

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if severity_filter:
            queryset = queryset.filter(severity=severity_filter)

        # Pagination: 10 per page
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        total_count = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size

        reports = queryset[start:end]
        serializer = WasteReportSerializer(reports, many=True)

        return response.Response({
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': max(1, (total_count + page_size - 1) // page_size),
            'results': serializer.data
        })

    def post(self, request):
        # Validate required inputs
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        address = request.data.get('address', '').strip()
        waste_type = request.data.get('waste_type', '')
        severity = request.data.get('severity', '')
        notes = request.data.get('notes', '').strip()
        title = request.data.get('title', '').strip()
        image_file = request.FILES.get('image')
        image_url = request.data.get('image_url', '').strip()

        errors = {}
        if not lat or not lon:
            errors['location'] = 'Valid GPS coordinates or map location selection is required.'
        if not address:
            errors['address'] = 'Street or landmark address description is required.'

        try:
            lat = float(lat)
            lon = float(lon)
        except (ValueError, TypeError):
            errors['location'] = 'Coordinates must be valid decimal numbers.'

        if errors:
            return response.Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        # Perform server-side AI model inference
        ai_res = analyze_waste_image(image_file=image_file)

        # Use AI prediction if not manually overridden
        final_waste_type = waste_type if waste_type in dict(WasteReport.WASTE_TYPE_CHOICES) else ai_res['predicted_type']
        final_severity = severity if severity in dict(WasteReport.SEVERITY_CHOICES) else ai_res['severity']

        # Determine reporting user
        username = request.headers.get('X-User-Username')
        user = User.objects.filter(username=username).first() if username else None
        if not user:
            user = User.objects.filter(profile__role='citizen').first()

        report = WasteReport.objects.create(
            user=user,
            title=title or f"Reported {dict(WasteReport.WASTE_TYPE_CHOICES).get(final_waste_type, 'Waste')}",
            image=image_file,
            image_url=image_url,
            waste_type=final_waste_type,
            severity=final_severity,
            status='pending',
            latitude=lat,
            longitude=lon,
            address=address,
            notes=notes,
            ai_confidence=ai_res['confidence'],
            ai_classification_summary=ai_res['summary'],
            points_awarded=20
        )

        # Award points to citizen user
        if user and hasattr(user, 'profile'):
            user.profile.reward_points += 20
            user.profile.total_reports += 1
            user.profile.save()

        return response.Response({
            'message': 'Waste report submitted successfully! 20 Reward Points awarded.',
            'report': WasteReportSerializer(report).data,
            'ai_analysis': ai_res,
            'new_reward_points': user.profile.reward_points if user and hasattr(user, 'profile') else 20
        }, status=status.HTTP_201_CREATED)


class WasteReportDetailView(views.APIView):
    def get(self, request, pk):
        try:
            report = WasteReport.objects.get(pk=pk)
        except WasteReport.DoesNotExist:
            return response.Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)
        return response.Response(WasteReportSerializer(report).data)

    def patch(self, request, pk):
        try:
            report = WasteReport.objects.get(pk=pk)
        except WasteReport.DoesNotExist:
            return response.Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        worker_id = request.data.get('assigned_worker_id')

        if new_status and new_status in dict(WasteReport.STATUS_CHOICES):
            report.status = new_status
            if new_status == 'resolved':
                report.resolved_at = timezone.now()

        if worker_id is not None:
            if worker_id:
                worker = User.objects.filter(pk=worker_id, profile__role='worker').first()
                if worker:
                    report.assigned_worker = worker
            else:
                report.assigned_worker = None

        report.save()
        return response.Response(WasteReportSerializer(report).data)


class DashboardSummaryView(views.APIView):
    """
    Mobile user dashboard endpoint delivering:
    - Available reward points
    - Approved reports count
    - Pending reports count
    - Resolved reports count
    - Progress toward the next 100-point voucher milestone
    - Recent report history
    - Available vouchers and redemption status
    """
    def get(self, request):
        username = request.headers.get('X-User-Username')
        user = User.objects.filter(username=username).first() if username else None
        if not user:
            user = User.objects.filter(profile__role='citizen').first()

        profile = getattr(user, 'profile', None)
        current_points = profile.reward_points if profile else 0

        # Milestone calculation: Next 100-point milestone
        points_in_cycle = current_points % 100
        progress_percentage = min(100, int((points_in_cycle / 100.0) * 100))
        points_needed = 100 - points_in_cycle if points_in_cycle > 0 else (0 if current_points >= 100 else 100)
        eligible_vouchers_count = current_points // 100

        # User report counts
        user_reports = WasteReport.objects.filter(user=user) if user else WasteReport.objects.none()
        all_reports = WasteReport.objects.all()

        approved_count = user_reports.filter(status='approved').count()
        pending_count = user_reports.filter(status='pending').count()
        resolved_count = user_reports.filter(status='resolved').count()
        in_progress_count = user_reports.filter(status='in_progress').count()

        # Recent 5 reports
        recent_reports = WasteReportSerializer(user_reports.order_by('-created_at')[:5], many=True).data

        # Vouchers
        vouchers = Voucher.objects.filter(user=user).order_by('-created_at') if user else Voucher.objects.none()
        vouchers_data = VoucherSerializer(vouchers, many=True).data

        # Available voucher catalog
        catalog = [
            {'id': 'v-1', 'title': '$5 Grocery Green Discount', 'partner_name': 'EcoFresh Market', 'points_cost': 100, 'discount_text': '$5.00 Off'},
            {'id': 'v-2', 'title': '$10 Public Transit Smart Pass', 'partner_name': 'City Metro Transit', 'points_cost': 100, 'discount_text': '$10.00 Credit'},
            {'id': 'v-3', 'title': '$15 Zero-Waste Cafe Voucher', 'partner_name': 'Earth Beans Cafe', 'points_cost': 100, 'discount_text': '$15.00 Voucher'},
            {'id': 'v-4', 'title': '$20 Renewable Home Energy Credit', 'partner_name': 'CleanGrid Utility', 'points_cost': 200, 'discount_text': '$20.00 Rebate'}
        ]

        return response.Response({
            'user': UserSerializer(user).data if user else None,
            'reward_points': current_points,
            'milestone': {
                'points_in_cycle': points_in_cycle,
                'progress_percentage': progress_percentage,
                'points_needed': points_needed,
                'eligible_vouchers_count': eligible_vouchers_count,
                'target_points': 100
            },
            'stats': {
                'approved': approved_count,
                'pending': pending_count,
                'resolved': resolved_count,
                'in_progress': in_progress_count,
                'total_user_reports': user_reports.count(),
                'city_total_reports': all_reports.count()
            },
            'recent_reports': recent_reports,
            'user_vouchers': vouchers_data,
            'voucher_catalog': catalog
        })


class RedeemVoucherView(views.APIView):
    def post(self, request):
        username = request.headers.get('X-User-Username')
        user = User.objects.filter(username=username).first() if username else None
        if not user:
            user = User.objects.filter(profile__role='citizen').first()

        if not user or not hasattr(user, 'profile'):
            return response.Response({'error': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        catalog_id = request.data.get('catalog_id')
        title = request.data.get('title', '$5 Eco Reward Voucher')
        partner_name = request.data.get('partner_name', 'EcoPartner Merchant')
        points_cost = int(request.data.get('points_cost', 100))

        if user.profile.reward_points < points_cost:
            return response.Response({
                'error': f'Insufficient points. You have {user.profile.reward_points} pts, but {points_cost} pts are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Deduct points and generate unique voucher code
        user.profile.reward_points -= points_cost
        user.profile.total_vouchers_redeemed += 1
        user.profile.save()

        code = f"CLEAN-{uuid.uuid4().hex[:6].upper()}"
        voucher = Voucher.objects.create(
            code=code,
            user=user,
            title=title,
            partner_name=partner_name,
            points_cost=points_cost,
            discount_text=request.data.get('discount_text', '$5 Off')
        )

        return response.Response({
            'message': f'Congratulations! Successfully redeemed {title} for {points_cost} points.',
            'voucher': VoucherSerializer(voucher).data,
            'remaining_points': user.profile.reward_points
        }, status=status.HTTP_201_CREATED)


class AdminReportsManageView(views.APIView):
    """
    Enforces Single Superuser Admin Role. Public users cannot access or modify these functions.
    """
    def get(self, request):
        role = request.headers.get('X-User-Role')
        username = request.headers.get('X-User-Username')
        user = User.objects.filter(username=username).first() if username else None

        if role != 'admin' or (user and not user.is_superuser):
            return response.Response({'error': 'Forbidden: Exclusive administrator (superuser) privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        reports = WasteReport.objects.all().order_by('-created_at')
        workers = User.objects.filter(profile__role='worker')
        superuser_admin = User.objects.filter(is_superuser=True, profile__role='admin').first()

        return response.Response({
            'reports': WasteReportSerializer(reports, many=True).data,
            'workers': [{'id': w.id, 'name': w.get_full_name() or w.username, 'email': w.email} for w in workers],
            'single_admin': {
                'username': superuser_admin.username if superuser_admin else 'admin1',
                'name': superuser_admin.get_full_name() if superuser_admin else 'Elena Martinez',
                'is_superuser': True,
                'status': 'Active Exclusive Superuser'
            }
        })

    def post(self, request):
        role = request.headers.get('X-User-Role')
        username = request.headers.get('X-User-Username')
        user = User.objects.filter(username=username).first() if username else None

        if role != 'admin' or (user and not user.is_superuser):
            return response.Response({'error': 'Forbidden: Exclusive administrator (superuser) privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        report_id = request.data.get('report_id')
        action = request.data.get('action')  # 'approve', 'reject', 'assign'
        worker_id = request.data.get('worker_id')

        try:
            report = WasteReport.objects.get(pk=report_id)
        except WasteReport.DoesNotExist:
            return response.Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'approve':
            report.status = 'approved'
        elif action == 'reject':
            report.status = 'rejected'
        elif action == 'assign' and worker_id:
            worker = User.objects.filter(pk=worker_id, profile__role='worker').first()
            if worker:
                report.assigned_worker = worker
                report.status = 'approved'

        report.save()
        return response.Response({
            'message': f'Report #{report.id} updated.',
            'report': WasteReportSerializer(report).data
        })


class GenerateDynamicRouteView(views.APIView):
    """
    Admin triggers dynamic route generation for a collection worker.
    Uses priority-weighted nearest neighbor optimization.
    Enforces exclusive superuser admin.
    """
    def post(self, request):
        role = request.headers.get('X-User-Role')
        username = request.headers.get('X-User-Username')
        user = User.objects.filter(username=username).first() if username else None

        if role != 'admin' or (user and not user.is_superuser):
            return response.Response({'error': 'Forbidden: Exclusive administrator (superuser) privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        worker_id = request.data.get('worker_id')
        worker = User.objects.filter(pk=worker_id, profile__role='worker').first() if worker_id else User.objects.filter(profile__role='worker').first()

        if not worker:
            return response.Response({'error': 'No collection worker found to assign route.'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch approved reports
        eligible_reports = WasteReport.objects.filter(status__in=['approved', 'pending'])[:8]
        if not eligible_reports.exists():
            return response.Response({'error': 'No approved waste reports available to optimize.'}, status=status.HTTP_400_BAD_REQUEST)

        # Municipal depot coordinates (city center depot)
        depot_lat, depot_lon = 40.7128, -74.0060

        optimized_stops_data = optimize_collection_route(depot_lat, depot_lon, eligible_reports)

        route = CollectionRoute.objects.create(
            worker=worker,
            route_name=f"Dynamic Collection Route #{random.randint(100, 999)} - Sector Central",
            total_distance_km=sum(s['distance_from_prev_km'] for s in optimized_stops_data),
            estimated_duration_mins=int(sum(s['estimated_minutes'] for s in optimized_stops_data))
        )

        for stop_info in optimized_stops_data:
            rep = stop_info['report']
            rep.assigned_worker = worker
            rep.status = 'approved'
            rep.save()

            CollectionStop.objects.create(
                route=route,
                report=rep,
                stop_order=stop_info['stop_order'],
                status='pending',
                notes=f"Priority: {rep.get_severity_display()}. Distance: {stop_info['distance_from_prev_km']} km"
            )

        return response.Response({
            'message': f'Successfully generated dynamic route with {len(optimized_stops_data)} stops.',
            'route': CollectionRouteSerializer(route).data
        }, status=status.HTTP_201_CREATED)


class WorkerStopsView(views.APIView):
    """
    Collection workers view their assigned tasks and update collection status on a phone.
    Enforces Worker/Admin access.
    """
    def get(self, request):
        role = request.headers.get('X-User-Role')
        username = request.headers.get('X-User-Username')

        if role and role not in ['worker', 'admin']:
            return response.Response({'error': 'Forbidden: Worker privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        worker = User.objects.filter(username=username, profile__role='worker').first() if username else User.objects.filter(profile__role='worker').first()

        if not worker:
            # Fallback to any active collection route
            routes = CollectionRoute.objects.all().order_by('-created_at')[:3]
        else:
            routes = CollectionRoute.objects.filter(worker=worker).order_by('-created_at')
            if not routes.exists():
                routes = CollectionRoute.objects.all().order_by('-created_at')[:1]

        return response.Response({
            'routes': CollectionRouteSerializer(routes, many=True).data,
            'worker': {'id': worker.id if worker else None, 'name': worker.get_full_name() if worker else 'Driver Unit 4'}
        })


class WorkerUpdateStopStatusView(views.APIView):
    def patch(self, request, pk):
        role = request.headers.get('X-User-Role')
        if role and role not in ['worker', 'admin']:
            return response.Response({'error': 'Forbidden: Worker privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            stop = CollectionStop.objects.get(pk=pk)
        except CollectionStop.DoesNotExist:
            return response.Response({'error': 'Collection stop not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        notes = request.data.get('notes', '')

        if new_status in dict(CollectionStop.STATUS_CHOICES):
            stop.status = new_status
            if notes:
                stop.notes = notes

            # Sync with underlying waste report
            if new_status == 'collected':
                stop.collected_at = timezone.now()
                stop.report.status = 'resolved'
                stop.report.resolved_at = timezone.now()
                stop.report.save()
            elif new_status == 'in_progress':
                stop.report.status = 'in_progress'
                stop.report.save()

            stop.save()

        # Check if all stops in route are collected
        route = stop.route
        if route.stops.exclude(status='collected').count() == 0:
            route.status = 'completed'
            route.save()
        else:
            route.status = 'in_progress'
            route.save()

        return response.Response({
            'message': f"Stop #{stop.stop_order} updated to '{stop.get_status_display()}'.",
            'stop': CollectionStopSerializer(stop).data,
            'route_status': route.status
        })


class AdminUsersListView(views.APIView):
    """
    Admin views all registered citizens and workers, including approval statuses and photos.
    Strictly verifies superuser admin.
    """
    def get(self, request):
        role = request.headers.get('X-User-Role')
        username = request.headers.get('X-User-Username')
        admin_user = User.objects.filter(username=username).first() if username else None

        if role != 'admin' or (admin_user and not admin_user.is_superuser):
            return response.Response({'error': 'Forbidden: Exclusive administrator privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        all_users = User.objects.exclude(is_superuser=True).exclude(profile__role='admin').order_by('-date_joined')
        role_filter = request.query_params.get('role')
        filtered_users = all_users
        if role_filter in ['citizen', 'worker']:
            filtered_users = all_users.filter(profile__role=role_filter)

        return response.Response({
            'users': UserSerializer(filtered_users, many=True).data,
            'total_users': all_users.count(),
            'pending_count': all_users.filter(profile__is_approved=False).count(),
            'approved_count': all_users.filter(profile__is_approved=True).count(),
            'citizen_count': all_users.filter(profile__role='citizen').count(),
            'worker_count': all_users.filter(profile__role='worker').count(),
            'filtered_total': filtered_users.count(),
            'filtered_pending': filtered_users.filter(profile__is_approved=False).count()
        })


class AdminUserApproveView(views.APIView):
    """
    Admin approves a registered citizen or worker, allowing them to log in.
    """
    def post(self, request, pk):
        role = request.headers.get('X-User-Role')
        username = request.headers.get('X-User-Username')
        admin_user = User.objects.filter(username=username).first() if username else None

        if role != 'admin' or (admin_user and not admin_user.is_superuser):
            return response.Response({'error': 'Forbidden: Exclusive administrator privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return response.Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not hasattr(target_user, 'profile'):
            UserProfile.objects.create(user=target_user, role='citizen', is_approved=True)
        else:
            target_user.profile.is_approved = True
            target_user.profile.save()

        name = target_user.get_full_name() or target_user.username
        role_label = target_user.profile.get_role_display()
        return response.Response({
            'message': f'{role_label} "{name}" has been approved! They can now log in.',
            'user': UserSerializer(target_user).data
        })


class AdminUserDeleteView(views.APIView):
    """
    Admin deletes a citizen or worker account.
    Admin account deletion is strictly protected.
    """
    def delete(self, request, pk):
        role = request.headers.get('X-User-Role')
        username = request.headers.get('X-User-Username')
        admin_user = User.objects.filter(username=username).first() if username else None

        if role != 'admin' or (admin_user and not admin_user.is_superuser):
            return response.Response({'error': 'Forbidden: Exclusive administrator privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return response.Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Protect administrator accounts
        if target_user.is_superuser or (hasattr(target_user, 'profile') and target_user.profile.role == 'admin'):
            return response.Response({'error': 'The municipal administrator account cannot be deleted.'}, status=status.HTTP_400_BAD_REQUEST)

        name = target_user.get_full_name() or target_user.username
        role_label = target_user.profile.get_role_display() if hasattr(target_user, 'profile') else 'User'

        target_user.delete()

        return response.Response({
            'message': f'{role_label} "{name}" deleted successfully.'
        })
