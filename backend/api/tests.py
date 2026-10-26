from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status
from .models import UserProfile, WasteReport, Voucher, CollectionRoute, CollectionStop

class SmartWasteSystemTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create test citizen
        self.citizen = User.objects.create_user(
            username='citizen_test',
            password='testpassword123',
            email='citizen@example.com',
            first_name='Test',
            last_name='Citizen'
        )
        self.citizen_profile = UserProfile.objects.create(
            user=self.citizen,
            role='citizen',
            reward_points=140,
            is_approved=True
        )

        # Create test worker
        self.worker = User.objects.create_user(
            username='worker_test',
            password='testpassword123',
            email='worker@example.com'
        )
        self.worker_profile = UserProfile.objects.create(
            user=self.worker,
            role='worker',
            reward_points=0,
            is_approved=True
        )

        # Create test admin
        self.admin = User.objects.create_user(
            username='admin_test',
            password='testpassword123',
            email='admin@example.com'
        )
        self.admin_profile = UserProfile.objects.create(
            user=self.admin,
            role='admin',
            reward_points=0,
            is_approved=True
        )

        # Sample report
        self.report = WasteReport.objects.create(
            user=self.citizen,
            title='Test Plastic Waste',
            waste_type='plastic',
            severity='medium',
            status='pending',
            latitude=40.7128,
            longitude=-74.0060,
            address='Test Street 101',
            points_awarded=20
        )

    def test_user_registration(self):
        """Verify registration endpoint creates user and profile with points, mobile, age, gender, address."""
        response = self.client.post('/api/auth/register/', {
            'username': 'new_user',
            'password': 'password123',
            'email': 'new@example.com',
            'mobile': '+91 99988 77766',
            'full_name': 'New User',
            'age': 25,
            'gender': 'female',
            'address': 'Street 12, Green Park',
            'role': 'citizen'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='new_user').exists())
        u = User.objects.get(username='new_user')
        self.assertEqual(u.profile.reward_points, 100)
        self.assertEqual(u.profile.phone, '+91 99988 77766')
        self.assertEqual(u.profile.age, 25)
        self.assertEqual(u.profile.gender, 'female')
        self.assertEqual(u.profile.address, 'Street 12, Green Park')

    def test_registration_mandatory_fields(self):
        """Verify registration rejects missing mobile or email."""
        # Missing mobile
        res1 = self.client.post('/api/auth/register/', {
            'username': 'nomobile_user',
            'password': 'password123',
            'email': 'nomobile@example.com',
            'full_name': 'No Mobile',
            'role': 'citizen'
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Mobile number is mandatory', res1.data.get('error', ''))

        # Missing email
        res2 = self.client.post('/api/auth/register/', {
            'username': 'noemail_user',
            'password': 'password123',
            'mobile': '+91 9876543210',
            'full_name': 'No Email',
            'role': 'citizen'
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Email address is mandatory', res2.data.get('error', ''))

    def test_profile_view_and_edit(self):
        """Verify user profile viewing and editing with PUT endpoint."""
        self.client.defaults['HTTP_X_USER_USERNAME'] = 'citizen_test'

        # View profile
        get_res = self.client.get('/api/auth/me/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data['username'], 'citizen_test')

        # Edit profile
        put_res = self.client.put('/api/auth/me/', {
            'full_name': 'Sarah Jenkins Updated',
            'email': 'sarah.updated@example.com',
            'mobile': '+91 98471 99999',
            'age': 29,
            'gender': 'female',
            'address': 'New Address Villa 9, Lake View'
        }, format='json')
        self.assertEqual(put_res.status_code, status.HTTP_200_OK)
        self.assertEqual(put_res.data['user']['email'], 'sarah.updated@example.com')
        self.assertEqual(put_res.data['user']['profile']['phone'], '+91 98471 99999')
        self.assertEqual(put_res.data['user']['profile']['age'], 29)
        self.assertEqual(put_res.data['user']['profile']['address'], 'New Address Villa 9, Lake View')

    def test_waste_reporting_and_points_award(self):
        """Verify submitting report awards +20 points and triggers server-side AI analysis."""
        initial_points = self.citizen.profile.reward_points
        self.client.defaults['HTTP_X_USER_USERNAME'] = 'citizen_test'

        response = self.client.post('/api/reports/', {
            'title': 'Illegal Tyre Dump',
            'waste_type': 'plastic',
            'severity': 'high',
            'latitude': 40.7150,
            'longitude': -74.0080,
            'address': 'Alley behind Store 5',
            'notes': 'Spotted this morning.'
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.citizen_profile.refresh_from_db()
        self.assertEqual(self.citizen_profile.reward_points, initial_points + 20)
        self.assertIn('ai_analysis', response.data)

    def test_dashboard_summary_and_milestone(self):
        """Verify dashboard returns points, 100-pt milestone progress, and report stats."""
        self.client.defaults['HTTP_X_USER_USERNAME'] = 'citizen_test'
        response = self.client.get('/api/dashboard/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reward_points'], 140)
        self.assertEqual(response.data['milestone']['points_in_cycle'], 40)
        self.assertEqual(response.data['milestone']['progress_percentage'], 40)
        self.assertEqual(response.data['milestone']['eligible_vouchers_count'], 1)

    def test_voucher_redemption(self):
        """Verify user can redeem 100 points for a partner voucher."""
        self.client.defaults['HTTP_X_USER_USERNAME'] = 'citizen_test'
        response = self.client.post('/api/rewards/redeem/', {
            'catalog_id': 'v-1',
            'title': '$5 Grocery Green Discount',
            'partner_name': 'EcoFresh Market',
            'points_cost': 100,
            'discount_text': '$5.00 Off'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.citizen_profile.refresh_from_db()
        self.assertEqual(self.citizen_profile.reward_points, 40)
        self.assertTrue(Voucher.objects.filter(user=self.citizen).exists())

    def test_insufficient_points_voucher_rejection(self):
        """Verify overdraft prevention when points < points_cost."""
        self.citizen_profile.reward_points = 50
        self.citizen_profile.save()
        self.client.defaults['HTTP_X_USER_USERNAME'] = 'citizen_test'

        response = self.client.post('/api/rewards/redeem/', {
            'catalog_id': 'v-1',
            'title': '$5 Grocery Green Discount',
            'points_cost': 100
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Insufficient points', response.data['error'])

    def test_admin_role_enforcement(self):
        """Verify public users without admin role are forbidden from admin endpoints."""
        self.client.defaults['HTTP_X_USER_ROLE'] = 'citizen'
        response = self.client.get('/api/admin/reports/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # When admin role provided, access is permitted
        self.client.defaults['HTTP_X_USER_ROLE'] = 'admin'
        response = self.client.get('/api/admin/reports/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_worker_stop_status_update(self):
        """Verify collection workers can update stop status and resolve reports."""
        route = CollectionRoute.objects.create(
            worker=self.worker,
            route_name='Test Route 1',
            total_distance_km=3.2
        )
        stop = CollectionStop.objects.create(
            route=route,
            report=self.report,
            stop_order=1,
            status='pending'
        )

        self.client.defaults['HTTP_X_USER_ROLE'] = 'worker'
        response = self.client.patch(f'/api/worker/stops/{stop.id}/status/', {
            'status': 'collected',
            'notes': 'Waste cleared from sidewalk.'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stop.refresh_from_db()
        self.report.refresh_from_db()
        self.assertEqual(stop.status, 'collected')
        self.assertEqual(self.report.status, 'resolved')

    def test_unified_login_citizen_redirect(self):
        """Verify unified login for citizen returns citizen role and redirects to dashboard."""
        response = self.client.post('/api/auth/login/', {
            'username': 'citizen_test',
            'password': 'testpassword123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'citizen')
        self.assertEqual(response.data['redirect_tab'], 'dashboard')

    def test_unified_login_worker_redirect(self):
        """Verify unified login for worker returns worker role and redirects to worker route."""
        response = self.client.post('/api/auth/login/', {
            'username': 'worker_test',
            'password': 'testpassword123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'worker')
        self.assertEqual(response.data['redirect_tab'], 'worker')

    def test_unified_login_admin_redirect(self):
        """Verify unified login for admin returns admin role and redirects to admin portal."""
        response = self.client.post('/api/auth/login/', {
            'username': 'admin_test',
            'password': 'testpassword123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'admin')
        self.assertEqual(response.data['redirect_tab'], 'admin')

    def test_unified_login_with_email(self):
        """Verify unified login supports email as login identifier."""
        response = self.client.post('/api/auth/login/', {
            'username': 'citizen@example.com',
            'password': 'testpassword123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'citizen')
        self.assertEqual(response.data['redirect_tab'], 'dashboard')

    def test_admin_is_superuser(self):
        """Verify admin user is strictly a Django superuser and staff."""
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_superuser)
        self.assertTrue(self.admin.is_staff)
        self.assertEqual(self.admin.profile.role, 'admin')

    def test_only_one_admin_allowed_registration(self):
        """Verify registration rejects any attempt to register a second admin."""
        response = self.client.post('/api/auth/register/', {
            'username': 'second_admin',
            'password': 'password123',
            'email': 'second_admin@example.com',
            'role': 'admin'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Only one admin', response.data['error'])

    def test_only_one_admin_allowed_model_level(self):
        """Verify UserProfile model raises ValidationError if second admin is created."""
        user2 = User.objects.create_user(username='extra_admin', password='pass123')
        with self.assertRaises(ValidationError):
            UserProfile.objects.create(user=user2, role='admin')

    def test_unapproved_user_login_blocked(self):
        """Verify unapproved citizen/worker cannot login until approved by admin."""
        # Create unapproved worker
        unapproved = User.objects.create_user(username='pending_worker', password='password123', email='pending@clean.gov')
        UserProfile.objects.create(user=unapproved, role='worker', is_approved=False)

        res = self.client.post('/api/auth/login/', {
            'username': 'pending_worker',
            'password': 'password123'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('pending administrator approval', res.data['error'])

    def test_admin_approves_and_deletes_user(self):
        """Verify admin can approve a pending user and delete a citizen or worker."""
        # Create pending citizen
        applicant = User.objects.create_user(username='new_applicant', password='password123', email='app@clean.gov')
        UserProfile.objects.create(user=applicant, role='citizen', is_approved=False)

        self.client.defaults['HTTP_X_USER_ROLE'] = 'admin'
        self.client.defaults['HTTP_X_USER_USERNAME'] = 'admin_test'

        # Admin lists users
        list_res = self.client.get('/api/admin/users/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(list_res.data['pending_count'], 1)

        # Admin approves user
        approve_res = self.client.post(f'/api/admin/users/{applicant.id}/approve/')
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)
        applicant.profile.refresh_from_db()
        self.assertTrue(applicant.profile.is_approved)

        # Approved user can now log in
        login_res = self.client.post('/api/auth/login/', {
            'username': 'new_applicant',
            'password': 'password123'
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)

        # Admin deletes user
        del_res = self.client.delete(f'/api/admin/users/{applicant.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(username='new_applicant').exists())
