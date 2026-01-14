from django.urls import path
from .views import *

urlpatterns = [
    path('search/', search_available_doctors, name='search_appointments'),
    path('create/', create_appointment, name='create_appointment'),

    path('services_and_cities/', get_services_and_cities, name='get_services_and_cities'),
    path('clinic/<int:clinic_id>/', get_clinic_appointments, name='clinic_appointments'),
    
    path('clinic/<int:clinic_id>/queue-settings/', get_clinic_queue_settings, name='get_clinic_queue_settings'),
    path('clinic/<int:clinic_id>/queue/create/', create_queue_appointment_by_admin, name='create_queue_appointment_by_admin'),
    path('clinic/<int:clinic_id>/queue/sse/', queue_appointments_sse, name='queue_appointments_sse'),

    path('<int:appointment_id>/update/', update_appointment, name='update_appointment'),
    path('user-appointments/', get_user_appointments, name='user_appointments'),
]
