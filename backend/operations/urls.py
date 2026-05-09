from django.urls import include, path
from rest_framework.routers import DefaultRouter

from operations.views import AlertViewSet, AssetViewSet, DutyRosterViewSet, FaultReportViewSet, InspectionTaskViewSet, OperationLogViewSet, UserLookupViewSet


router = DefaultRouter()
router.register("assets", AssetViewSet, basename="assets")
router.register("inspection-tasks", InspectionTaskViewSet, basename="inspection-tasks")
router.register("fault-reports", FaultReportViewSet, basename="fault-reports")
router.register("duty-rosters", DutyRosterViewSet, basename="duty-rosters")
router.register("alerts", AlertViewSet, basename="alerts")
router.register("operation-logs", OperationLogViewSet, basename="operation-logs")
router.register("lookups/users", UserLookupViewSet, basename="lookup-users")

urlpatterns = [
    path("", include(router.urls)),
]
