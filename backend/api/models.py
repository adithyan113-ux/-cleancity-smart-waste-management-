from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
import datetime

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('citizen', 'Citizen / Public User'),
        ('worker', 'Collection Worker'),
        ('admin', 'Municipal Admin (Superuser)'),
    ]

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citizen')
    phone = models.CharField(max_length=20, blank=True, default='')  # Mobile number
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, default='')
    address = models.TextField(blank=True, default='')
    id_details = models.CharField(max_length=150, blank=True, default='')  # Worker ID / Driving License / Gov ID
    profile_photo = models.TextField(blank=True, default='')  # Photo URL or Base64 data URL
    is_approved = models.BooleanField(default=False)  # Requires admin approval for workers & citizens
    reward_points = models.IntegerField(default=120)
    total_reports = models.IntegerField(default=0)
    total_vouchers_redeemed = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        if self.role == 'admin':
            existing = UserProfile.objects.filter(role='admin').exclude(pk=self.pk).first()
            if existing:
                raise ValidationError("Only one admin (superuser) account is allowed for the entire project.")

    def save(self, *args, **kwargs):
        if self.role == 'admin':
            existing = UserProfile.objects.filter(role='admin').exclude(pk=self.pk).first()
            if existing:
                raise ValidationError("Only one admin (superuser) account is allowed for the entire project.")
            self.is_approved = True  # Admin is always auto-approved
            # Ensure associated User instance is a Django superuser
            if self.user_id:
                u = self.user
                if not u.is_superuser or not u.is_staff:
                    u.is_superuser = True
                    u.is_staff = True
                    u.save(update_fields=['is_superuser', 'is_staff'])
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class WasteReport(models.Model):
    WASTE_TYPE_CHOICES = [
        ('plastic', 'Plastic / Dry Packaging'),
        ('organic', 'Organic / Food Waste'),
        ('electronic', 'E-Waste / Batteries'),
        ('hazardous', 'Hazardous / Chemical / Medical'),
        ('glass_metal', 'Glass & Metal Cans'),
        ('mixed_debris', 'Mixed Street Litter / Debris'),
    ]

    SEVERITY_CHOICES = [
        ('low', 'Low - Minor Litter'),
        ('medium', 'Medium - Overflowing Bin'),
        ('high', 'High - Large Illegal Dumping'),
        ('urgent', 'Urgent - Hazardous / Road Hazard'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('approved', 'Approved for Collection'),
        ('in_progress', 'Collection In Progress'),
        ('resolved', 'Collected & Cleaned'),
        ('rejected', 'Rejected / Duplicate'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reports')
    title = models.CharField(max_length=200, default='Reported Waste Pile')
    image = models.ImageField(upload_to='reports/', null=True, blank=True)
    image_url = models.CharField(max_length=500, blank=True, default='')
    waste_type = models.CharField(max_length=30, choices=WASTE_TYPE_CHOICES, default='mixed_debris')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.CharField(max_length=300, default='Specified Map Location')
    notes = models.TextField(blank=True, default='')
    ai_confidence = models.FloatField(default=0.91)
    ai_classification_summary = models.CharField(max_length=255, blank=True, default='')
    points_awarded = models.IntegerField(default=20)
    assigned_worker = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report #{self.id} - {self.get_waste_type_display()} ({self.get_status_display()})"


class Voucher(models.Model):
    code = models.CharField(max_length=30, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vouchers', null=True, blank=True)
    title = models.CharField(max_length=150)
    partner_name = models.CharField(max_length=100)
    points_cost = models.IntegerField(default=100)
    discount_text = models.CharField(max_length=100, default='$5.00 Off')
    is_redeemed = models.BooleanField(default=False)
    redeemed_at = models.DateTimeField(null=True, blank=True)
    expiry_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.expiry_date:
            self.expiry_date = timezone.now() + datetime.timedelta(days=60)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.code}"


class CollectionRoute(models.Model):
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='routes')
    route_name = models.CharField(max_length=150, default='Morning Sector Dynamic Route')
    date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    total_distance_km = models.FloatField(default=5.4)
    estimated_duration_mins = models.IntegerField(default=48)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Route {self.id}: {self.route_name} - {self.worker.username}"


class CollectionStop(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Pickup'),
        ('in_progress', 'En Route / At Stop'),
        ('collected', 'Successfully Collected'),
        ('skipped', 'Unable to Collect / Blocked'),
    ]

    route = models.ForeignKey(CollectionRoute, on_delete=models.CASCADE, related_name='stops')
    report = models.ForeignKey(WasteReport, on_delete=models.CASCADE, related_name='collection_stops')
    stop_order = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, default='')
    collected_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['stop_order']

    def __str__(self):
        return f"Stop #{self.stop_order}: Report #{self.report.id} ({self.get_status_display()})"
