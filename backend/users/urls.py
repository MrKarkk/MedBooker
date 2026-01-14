from django.urls import path
from .views import *


urlpatterns = [
    path('register/', register_view, name='register'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('refresh/', refresh_view, name='refresh'),
    path('me/', me_view, name='me'),
    path('profile/update/', update_profile_view, name='profile_update'),
    path('password/change/', change_password_view, name='password_change'),
]
