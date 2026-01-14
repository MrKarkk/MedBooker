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
        "rating"
    )
    list_filter = ("city", "is_verified", "is_active", "rating")
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
            "fields": ("is_verified", "is_active", "is_online_booking", "is_electronic_queue", "is_booking_for_services", "is_booking_for_doctors", "is_notification_telegram", "online_queue_only", "rating", "created_at")
        }),
    )

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name", "description")
    
    fieldsets = (
        ("Основное", {
            "fields": ("name", "description")
        }),
    )

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "specialty",
        "clinic",
        "phone_number",
        "available_for_booking",
        "rating",
        "is_active",
    )
    list_filter = ("specialty", "clinic", "is_active", "available_for_booking")
    search_fields = ("full_name", "phone_number", "specialty", "tg_id")
    readonly_fields = ()
    
    fieldsets = (
        ("Личная информация", {
            "fields": ("full_name", "phone_number", "tg_id")
        }),
        ("Профессиональные данные", {
            "fields": ("specialty", "clinic", "work_experience", "price", "services", "working_days", "working_hours", "lunch_time", "cabinet_number")
        }),
        ("Конфигурация", {
            "fields": ("available_for_booking", "default_duration", "rating", "is_active")
        }),
    )

@admin.register(ReceivedMessage)
class ReceivedMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "email", "message", "received_at")
    list_filter = ("received_at",)
    search_fields = ("full_name", "email", "message")
    readonly_fields = ("full_name", "email", "message", "received_at")
    
    fieldsets = (
        ("Сообщение от пользователя", {
            "fields": ("full_name", "email", "message", "received_at")
        }),
    )

@admin.register(FAQEntry)
class FAQEntryAdmin(admin.ModelAdmin):
    list_display = ("question", "created_at", "updated_at")
    search_fields = ("question", "answer")
    readonly_fields = ("created_at", "updated_at")
    
    fieldsets = (
        ("Вопрос и ответ", {
            "fields": ("question", "answer")
        }),
        ("Метаданные", {
            "fields": ("created_at", "updated_at")
        }),
    )