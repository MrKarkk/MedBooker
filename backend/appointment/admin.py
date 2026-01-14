from django.contrib import admin
from .models import Appointment, AppointmentQueueOnly


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "__str__",
        "clinic_name",
        "date",
        "status",
        "number_coupon"
    )
    list_filter = ("status", "clinic", "doctor", "date", "created_by")
    search_fields = ("patient_full_name", "patient_phone", "doctor__full_name", "clinic__name")
    ordering = ("-date", "-time_start")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "date"

    fieldsets = (
        ("Врач", {
            "fields": ("doctor", "clinic", "service")
        }),
        ("Детали записи", {
            "fields": ("patient_full_name", "patient_phone", "date", "time_start")
        }),
        ("Статус", {
            "fields": ("status", "number_coupon", "comment")
        }),
        ("Системная информация", {
            "fields": ("created_by", "source", "created_at", "updated_at"),
        }),
    )

    def patient_name(self, obj):
        return obj.patient_full_name
    patient_name.short_description = "Пациент"

    def doctor_name(self, obj):
        return obj.doctor.full_name
    doctor_name.short_description = "Врач"

    def clinic_name(self, obj):
        return obj.clinic.name
    clinic_name.short_description = "Клиника"

@admin.register(AppointmentQueueOnly)
class AppointmentQueueOnlyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "__str__",
        "clinic_name",
        "date",
        "status",
        "number_coupon"
    )
    list_filter = ("status", "number_coupon", "clinic", "doctor", "date")
    search_fields = ("patient_full_name", "patient_phone", "doctor__full_name", "clinic__name")
    ordering = ("-date", "-time_start")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "date"

    fieldsets = (
        ("Врач", {
            "fields": ("doctor", "clinic", "service")
        }),
        ("Детали записи", {
            "fields": ("patient_full_name", "patient_phone", "date", "time_start")
        }),
        ("Статус", {
            "fields": ("status", "number_coupon")
        }),
        ("Системная информация", {
            "fields": ("created_at", "updated_at"),
        }),
    )

    def patient_name(self, obj):
        return obj.patient_full_name
    patient_name.short_description = "Пациент"

    def doctor_name(self, obj):
        return obj.doctor.full_name
    doctor_name.short_description = "Врач"

    def clinic_name(self, obj):
        return obj.clinic.name
    clinic_name.short_description = "Клиника"