from django.urls import path

from dashboard.views import MetricsView


urlpatterns = [
    path("metrics/", MetricsView.as_view()),
]
