from django.contrib import admin
from .models import *


@admin.register(Clinic)
class ClinicAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "city",
        "phone_number",
        "is_verified",
        "is_active",
        "online_queue_only",
    )
    list_filter = ("city", "is_verified", "is_active")
    search_fields = ("name", "city", "phone_number", "email")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)
    
    fieldsets = (
        ("Основная информация", {
            "fields": ("name", "city")
        }),
        ("Контакты", {
            "fields": ("phone_number", "email", "website", "admin")
        }),
        ("Описание и адрес", {
            "fields": ("address", "description")
        }),
        ("Рабочие часы", {
            "fields": ("working_days", "working_hours")
        }),
        ("Статус", {
            "fields": ("is_verified", "is_active", "is_online_booking", "is_electronic_queue", "is_booking_for_services", "is_booking_for_doctors", "is_notification_telegram", "online_queue_only", "created_at")
        }),
    )

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "clinic",
        "phone_number",
        "available_for_booking",
        "is_active",
    )
    list_filter = ("clinic", "is_active", "available_for_booking")
    search_fields = ("full_name", "phone_number", "tg_id")
    readonly_fields = ()
    
    fieldsets = (
        ("Личная информация", {
            "fields": ("full_name", "phone_number", "tg_id")
        }),
        ("Профессиональные данные", {
            "fields": ("clinic", "work_experience", "price", "services", "working_days", "working_hours", "lunch_time", "cabinet_number")
        }),
        ("Конфигурация", {
            "fields": ("available_for_booking", "default_duration", "is_active")
        }),
    )