from django.db import models
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from users.models import User


class Clinic(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    city = models.CharField(max_length=100, db_index=True)

    address = models.CharField(max_length=255)
    working_hours = models.JSONField(default={"mon": ["09:00", "18:00"], "tue": ["09:00", "18:00"], "wed": ["09:00", "18:00"], "thu": ["09:00", "18:00"], "fri": ["09:00", "18:00"], "sat": ["10:00", "16:00"], "sun": []}) 
    working_days = models.JSONField(default={"mon": True, "tue": True, "wed": True, "thu": True, "fri": True, "sat": True, "sun": False}) 

    phone_number = models.CharField(max_length=20, validators=[RegexValidator(r'^\+?\d{7,15}$')])
    email = models.EmailField()
    admin = models.ManyToManyField(User, related_name='clinics', blank=True)

    description = models.TextField(blank=True)
    website = models.URLField(blank=True, null=True)

    rating = models.FloatField(default=0.0, db_index=True)

    is_verified = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_online_booking = models.BooleanField(default=False, db_index=True)
    is_electronic_queue = models.BooleanField(default=False, db_index=True, help_text="если is_electronic_queue = true то один из двух вариантов ниже должен быть true")
    is_booking_for_services = models.BooleanField(default=False, db_index=True, help_text="разрешена ли запись на по услугам на фронте")
    is_booking_for_doctors = models.BooleanField(default=False, db_index=True, help_text="разрешена ли запись на по фио врачей на фронте")
    is_notification_telegram = models.BooleanField(default=False, db_index=True)

    online_queue_only = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        """Validate that if electronic queue is enabled, at least one booking type is enabled"""
        super().clean()
        if self.is_electronic_queue and not (self.is_booking_for_services or self.is_booking_for_doctors):
            raise ValidationError(
                'Если включена электронная очередь (is_electronic_queue), '
                'должен быть включен хотя бы один из вариантов: '
                'запись на услуги (is_booking_for_services) или '
                'запись к врачам (is_booking_for_doctors).'
            )

    def __str__(self):
        return f"{self.name} — {self.city}"

    class Meta:
        verbose_name = "Клиника"
        verbose_name_plural = "Клиники"
        indexes = [
            models.Index(fields=['city']),
            models.Index(fields=['rating']),
            models.Index(fields=['is_active']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['is_online_booking']),
            models.Index(fields=['is_electronic_queue']),
            models.Index(fields=['is_notification_telegram']),
            models.Index(fields=['online_queue_only']),
            models.Index(fields=['is_active', 'is_verified']), 
            models.Index(fields=['-rating']), 
        ]

class Doctor(models.Model):
    full_name = models.CharField(max_length=255, db_index=True)
    phone_number = models.CharField(max_length=20, validators=[RegexValidator(r'^\+?\d{7,15}$')], blank=True)
    tg_id = models.CharField(max_length=50, blank=True, null=True, verbose_name='Telegram ID')

    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='doctors')
    specialty = models.CharField(max_length=100, db_index=True) # Специальность
    working_days = models.JSONField(default={"mon": True, "tue": True, "wed": True, "thu": True, "fri": True, "sat": True, "sun": False}) 
    working_hours = models.JSONField(default={"mon": ["09:00", "18:00"], "tue": ["09:00", "18:00"], "wed": ["09:00", "18:00"], "thu": ["09:00", "18:00"], "fri": ["09:00", "18:00"], "sat": ["10:00", "16:00"], "sun": []})
    lunch_time = models.JSONField(default={"mon": ["13:00", "14:00"], "tue": ["13:00", "14:00"], "wed": ["13:00", "14:00"], "thu": ["13:00", "14:00"], "fri": ["13:00", "14:00"], "sat": ["12:00", "13:00"], "sun": []})
    cabinet_number = models.CharField(max_length=50, blank=True) 

    work_experience = models.IntegerField(help_text="Опыт работы в годах", default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    services = models.ManyToManyField('Service', related_name='doctors', help_text="Услуги, которые предоставляет врач")

    available_for_booking = models.BooleanField(default=True)
    default_duration = models.PositiveIntegerField(default=30)
    rating = models.FloatField(default=0.0, db_index=True)

    is_active = models.BooleanField(default=True, db_index=True)

    def __str__(self):
        return f"{self.full_name} ({self.specialty})"

    class Meta:
        verbose_name = "Врач"
        verbose_name_plural = "Врачи"
        indexes = [
            models.Index(fields=['clinic', 'is_active']),
            models.Index(fields=['rating']),
            models.Index(fields=['-rating']),  
            models.Index(fields=['is_active']),
            models.Index(fields=['available_for_booking']),
            models.Index(fields=['specialty']),
        ]

class Service(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Услуга"
        verbose_name_plural = "Услуги"

# class ReviewsClinic(models.Model):
#     clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='reviews')
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clinic_reviews')
#     rating = models.FloatField(default=0.0)
#     comment = models.TextField(blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"Отзыв для {self.clinic.name} от {self.user.full_name}"

#     class Meta:
#         verbose_name = "Отзыв о клинике"
#         verbose_name_plural = "Отзывы о клиниках"
#         indexes = [
#             models.Index(fields=['-created_at']), 
#             models.Index(fields=['rating']),
#             models.Index(fields=['clinic', '-created_at']),
#         ]

# class ReviewsDoctor(models.Model):
#     doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='reviews')
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_reviews')
#     rating = models.FloatField(default=0.0, db_index=True)
#     comment = models.TextField(blank=True)
#     created_at = models.DateTimeField(auto_now_add=True, db_index=True)

#     def __str__(self):
#         return f"Отзыв для {self.doctor.full_name} от {self.user.full_name}"

#     class Meta:
#         verbose_name = "Отзыв о враче"
#         verbose_name_plural = "Отзывы о врачах"
#         indexes = [
#             models.Index(fields=['-created_at']),
#             models.Index(fields=['rating']),
#             models.Index(fields=['doctor', '-created_at']),  
#         ]

class ReceivedMessage(models.Model):
    full_name = models.CharField(max_length=255, blank=False, null=False)
    email = models.EmailField(blank=False, null=False)
    message = models.TextField(blank=False, null=False)
    received_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Сообщение от {self.full_name} в {self.received_at}"

    class Meta:
        verbose_name = "Полученное сообщение"
        verbose_name_plural = "Полученные сообщения"
        indexes = [
            models.Index(fields=['-received_at']),
            models.Index(fields=['full_name', '-received_at']),
        ]

class FAQEntry(models.Model):
    question = models.CharField(max_length=500)
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.question

    class Meta:
        verbose_name = "ЧСВ"
        verbose_name_plural = "ЧЗВы"
        indexes = [
            models.Index(fields=['-created_at']),
        ]