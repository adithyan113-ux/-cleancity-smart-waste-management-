import os
import django
import sys
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartwaste_backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from api.models import UserProfile, WasteReport, Voucher, CollectionRoute, CollectionStop

def seed():
    print("Clearing old test data...")
    CollectionStop.objects.all().delete()
    CollectionRoute.objects.all().delete()
    Voucher.objects.all().delete()
    WasteReport.objects.all().delete()
    UserProfile.objects.all().delete()
    User.objects.all().delete()

    print("Creating demo users...")
    # 1. Citizen (Approved)
    citizen = User.objects.create_user(
        username='citizen1',
        password='password123',
        email='sarah.jenkins@example.com',
        first_name='Sarah',
        last_name='Jenkins'
    )
    citizen_profile = UserProfile.objects.create(
        user=citizen,
        role='citizen',
        phone='+91 98471 23456',
        age=28,
        gender='female',
        address='Flat 4B, Green Meadows Apartment, MG Road, Sector 12',
        profile_photo='https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        is_approved=True,
        reward_points=140,
        total_reports=5,
        total_vouchers_redeemed=1
    )

    # 2. Worker (Approved)
    worker = User.objects.create_user(
        username='worker1',
        password='password123',
        email='dave.miller@cleancity.gov',
        first_name='Dave',
        last_name='Miller'
    )
    UserProfile.objects.create(
        user=worker,
        role='worker',
        phone='+91 94462 87654',
        age=36,
        gender='male',
        address='Quarter 12, Municipal Sanitation Staff Colony, North Depot',
        profile_photo='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        is_approved=True,
        reward_points=0
    )

    # 3. Admin (Single Superuser - Auto Approved)
    admin = User.objects.create_superuser(
        username='admin1',
        password='password123',
        email='director.martinez@cleancity.gov',
        first_name='Elena',
        last_name='Martinez'
    )
    UserProfile.objects.create(
        user=admin,
        role='admin',
        phone='+91 97450 11223',
        age=44,
        gender='female',
        address='Suite 401, Municipal Corporation Headquarters, Central City',
        profile_photo='https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        is_approved=True,
        reward_points=0
    )

    # 4. Pending Approval Citizen (For Admin approval testing)
    pending_citizen = User.objects.create_user(
        username='anand_k',
        password='password123',
        email='anand.kumar@example.com',
        first_name='Anand',
        last_name='Kumar'
    )
    UserProfile.objects.create(
        user=pending_citizen,
        role='citizen',
        phone='+91 98472 33445',
        age=31,
        gender='male',
        address='House No 45, Riverside View, Ward 6',
        profile_photo='https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        is_approved=False,
        reward_points=100
    )

    # 5. Pending Approval Worker (For Admin approval testing)
    pending_worker = User.objects.create_user(
        username='rajesh_v',
        password='password123',
        email='rajesh.v@cleancity.gov',
        first_name='Rajesh',
        last_name='Varma'
    )
    UserProfile.objects.create(
        user=pending_worker,
        role='worker',
        phone='+91 94470 55667',
        age=34,
        gender='male',
        address='Plot 18, Highway View Colony, South Zone',
        profile_photo='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        is_approved=False,
        reward_points=0
    )

    print("Creating sample waste reports...")
    reports_data = [
        {
            'user': citizen,
            'title': 'Overflowing Bin and Plastic Containers',
            'waste_type': 'plastic',
            'severity': 'medium',
            'status': 'pending',
            'lat': 40.7135,
            'lon': -74.0042,
            'address': 'Corner of Pine St & Broadway, Downtown',
            'notes': 'Public bin overflowed onto pedestrian walkway after weekend street fair.',
            'ai_summary': 'AI vision detected high-density polyethylene (HDPE) containers and plastic bags. Confidence: 94.6%',
            'ai_conf': 0.946,
            'points': 20,
            'image_url': 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=600&q=80'
        },
        {
            'user': citizen,
            'title': 'Discarded Electronics & Battery Unit',
            'waste_type': 'electronic',
            'severity': 'urgent',
            'status': 'approved',
            'lat': 40.7182,
            'lon': -74.0011,
            'address': '142 Grand Street, Alleyway Entrance',
            'notes': 'Cracked lead-acid battery and discarded printer chassis on sidewalk.',
            'ai_summary': 'AI Warning: Heavy metals and hazardous electrolytic residue identified. High priority dispatch.',
            'ai_conf': 0.978,
            'points': 20,
            'image_url': 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=600&q=80'
        },
        {
            'user': citizen,
            'title': 'Commercial Restaurant Food Scraps Pile',
            'waste_type': 'organic',
            'severity': 'high',
            'status': 'approved',
            'lat': 40.7225,
            'lon': -73.9984,
            'address': '88 Mulberry Street, Chinatown',
            'notes': 'Multiple burst garbage bags with rotting produce attracting pests.',
            'ai_summary': 'AI detected biodegradable organic decomposing food mass. Recommended immediate pickup.',
            'ai_conf': 0.932,
            'points': 20,
            'image_url': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80'
        },
        {
            'user': citizen,
            'title': 'Broken Glass Beverage Bottles & Tin Cans',
            'waste_type': 'glass_metal',
            'severity': 'medium',
            'status': 'in_progress',
            'lat': 40.7156,
            'lon': -74.0090,
            'address': 'West Thames Park Walkway, Battery Park City',
            'notes': 'Glass shards pose minor hazard to cyclists and dogs.',
            'ai_summary': 'AI identified recyclable amber glass shards and beverage cans.',
            'ai_conf': 0.915,
            'points': 20,
            'image_url': 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80'
        },
        {
            'user': citizen,
            'title': 'Illegal Drywall & Construction Debris',
            'waste_type': 'mixed_debris',
            'severity': 'high',
            'status': 'resolved',
            'lat': 40.7260,
            'lon': -74.0035,
            'address': 'Varick St & Spring St intersection',
            'notes': 'Renovation waste left beside storm drain.',
            'ai_summary': 'AI classified as mixed inert masonry and packaging debris.',
            'ai_conf': 0.890,
            'points': 20,
            'image_url': 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=600&q=80'
        }
    ]

    created_reports = []
    for r in reports_data:
        rep = WasteReport.objects.create(
            user=r['user'],
            title=r['title'],
            waste_type=r['waste_type'],
            severity=r['severity'],
            status=r['status'],
            latitude=r['lat'],
            longitude=r['lon'],
            address=r['address'],
            notes=r['notes'],
            ai_classification_summary=r['ai_summary'],
            ai_confidence=r['ai_conf'],
            points_awarded=r['points'],
            image_url=r['image_url'],
            assigned_worker=worker if r['status'] in ['approved', 'in_progress'] else None,
            resolved_at=timezone.now() - timedelta(hours=3) if r['status'] == 'resolved' else None
        )
        created_reports.append(rep)

    print("Creating sample vouchers...")
    Voucher.objects.create(
        code='CLEAN-8X99A1',
        user=citizen,
        title='$5 Grocery Green Discount',
        partner_name='EcoFresh Market',
        points_cost=100,
        discount_text='$5.00 Off Organic Groceries',
        is_redeemed=True,
        redeemed_at=timezone.now() - timedelta(days=2),
        expiry_date=timezone.now() + timedelta(days=58)
    )

    print("Creating sample collection route for worker...")
    route = CollectionRoute.objects.create(
        worker=worker,
        route_name="Route #401 - Downtown High-Priority Optimization",
        status='in_progress',
        total_distance_km=4.8,
        estimated_duration_mins=42
    )

    # Add stops to route
    CollectionStop.objects.create(
        route=route,
        report=created_reports[1], # Urgent E-waste
        stop_order=1,
        status='pending',
        notes='Priority: Urgent E-waste. Handle battery with safety gloves.'
    )

    CollectionStop.objects.create(
        route=route,
        report=created_reports[2], # High Organic
        stop_order=2,
        status='pending',
        notes='Priority: High Organic. Restaurant back entrance.'
    )

    CollectionStop.objects.create(
        route=route,
        report=created_reports[3], # Medium Glass
        stop_order=3,
        status='in_progress',
        notes='Priority: Medium Glass. Sweep pathway.'
    )

    print("Database successfully seeded with realistic Smart Waste Management demo data!")

if __name__ == '__main__':
    seed()
