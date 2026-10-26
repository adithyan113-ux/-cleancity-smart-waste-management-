from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, WasteReport, Voucher, CollectionRoute, CollectionStop

class UserProfileSerializer(serializers.ModelSerializer):
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'role', 'phone', 'age', 'gender', 'gender_display', 'address',
            'id_details', 'profile_photo', 'is_approved', 'reward_points',
            'total_reports', 'total_vouchers_redeemed', 'created_at'
        ]

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'is_superuser', 'is_staff', 'date_joined', 'profile'
        ]

    def get_full_name(self, obj):
        name = obj.get_full_name()
        return name.strip() if name else obj.username

class WasteReportSerializer(serializers.ModelSerializer):
    waste_type_display = serializers.CharField(source='get_waste_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    user_name = serializers.SerializerMethodField()
    assigned_worker_name = serializers.SerializerMethodField()

    class Meta:
        model = WasteReport
        fields = [
            'id', 'title', 'image', 'image_url', 'waste_type', 'waste_type_display',
            'severity', 'severity_display', 'status', 'status_display',
            'latitude', 'longitude', 'address', 'notes',
            'ai_confidence', 'ai_classification_summary', 'points_awarded',
            'user', 'user_name', 'assigned_worker', 'assigned_worker_name',
            'created_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'ai_confidence', 'ai_classification_summary', 'points_awarded', 'created_at']

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return 'Anonymous Citizen'

    def get_assigned_worker_name(self, obj):
        if obj.assigned_worker:
            return obj.assigned_worker.get_full_name() or obj.assigned_worker.username
        return 'Unassigned'

class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = [
            'id', 'code', 'title', 'partner_name', 'points_cost',
            'discount_text', 'is_redeemed', 'redeemed_at', 'expiry_date', 'created_at'
        ]

class CollectionStopSerializer(serializers.ModelSerializer):
    report_details = WasteReportSerializer(source='report', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = CollectionStop
        fields = [
            'id', 'route', 'report', 'report_details', 'stop_order',
            'status', 'status_display', 'notes', 'collected_at'
        ]

class CollectionRouteSerializer(serializers.ModelSerializer):
    stops = CollectionStopSerializer(many=True, read_only=True)
    worker_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = CollectionRoute
        fields = [
            'id', 'worker', 'worker_name', 'route_name', 'date',
            'status', 'status_display', 'total_distance_km',
            'estimated_duration_mins', 'stops', 'created_at'
        ]

    def get_worker_name(self, obj):
        return obj.worker.get_full_name() or obj.worker.username
