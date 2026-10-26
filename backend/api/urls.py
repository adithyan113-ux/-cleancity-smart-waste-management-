from django.urls import path
from .views import (
    RegisterView, LoginView, CurrentUserView,
    WasteReportListCreateView, WasteReportDetailView, AIClassifyPreviewView,
    DashboardSummaryView, RedeemVoucherView,
    AdminReportsManageView, GenerateDynamicRouteView,
    WorkerStopsView, WorkerUpdateStopStatusView,
    AdminUsersListView, AdminUserApproveView, AdminUserDeleteView
)

urlpatterns = [
    # Auth & Profile
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('auth/profile/', CurrentUserView.as_view(), name='auth-profile'),

    # AI Model inference
    path('ai/classify/', AIClassifyPreviewView.as_view(), name='ai-classify'),

    # Reports
    path('reports/', WasteReportListCreateView.as_view(), name='report-list-create'),
    path('reports/<int:pk>/', WasteReportDetailView.as_view(), name='report-detail'),

    # Citizen Dashboard & Rewards
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('rewards/redeem/', RedeemVoucherView.as_view(), name='rewards-redeem'),

    # Admin Management
    path('admin/reports/', AdminReportsManageView.as_view(), name='admin-reports'),
    path('admin/routes/generate/', GenerateDynamicRouteView.as_view(), name='admin-route-generate'),
    path('admin/users/', AdminUsersListView.as_view(), name='admin-users-list'),
    path('admin/users/<int:pk>/approve/', AdminUserApproveView.as_view(), name='admin-user-approve'),
    path('admin/users/<int:pk>/', AdminUserDeleteView.as_view(), name='admin-user-delete'),

    # Worker Collection
    path('worker/stops/', WorkerStopsView.as_view(), name='worker-stops'),
    path('worker/stops/<int:pk>/status/', WorkerUpdateStopStatusView.as_view(), name='worker-update-status'),
]
