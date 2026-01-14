from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, RefreshToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('id', 'email', 'full_name', 'phone_number', 'tg_id', 'role', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('role', 'is_staff', 'is_active', 'date_joined')
    search_fields = ('email', 'full_name', 'phone_number')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Личная информация', {'fields': ('full_name', 'phone_number', 'tg_id', 'role')}),
        ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Важные даты', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'phone_number', 'tg_id', 'password1', 'password2', 'role', 'is_active', 'is_staff'),
        }),
    )
    
    readonly_fields = ('date_joined', 'last_login')

@admin.register(RefreshToken)
class RefreshTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'jti', 'created_at', 'expires_at', 'is_revoked')
    list_filter = ('is_revoked', 'created_at', 'expires_at')
    search_fields = ('user__email', 'jti')
    ordering = ('-created_at',)
    readonly_fields = ('user', 'token', 'jti', 'created_at')

