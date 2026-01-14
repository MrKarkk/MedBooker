from django.contrib import admin
from django.urls import path, include
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('core/', include('core.urls')),
    path('users/', include('users.urls')),
    path('appointment/', include('appointment.urls')),
]

# Django Debug Toolbar URLs (только для DEBUG=True)
if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
