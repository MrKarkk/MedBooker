from django.core.management.base import BaseCommand
from core.models import Clinic, Doctor, Service
from decimal import Decimal


class Command(BaseCommand):
    help = 'Заполняет базу данных реальными медицинскими данными'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('🚀 Начинаю заполнение базы данных...'))

        # 1. Создание услуг
        self.stdout.write('📋 Создание услуг...')
        services_data = [
            {'name': 'Приём терапевта', 'description': 'Консультация врача-терапевта общей практики'},
            {'name': 'Приём кардиолога', 'description': 'Консультация врача-кардиолога, ЭКГ'},
            {'name': 'Приём невролога', 'description': 'Консультация врача-невролога'},
            {'name': 'Приём эндокринолога', 'description': 'Консультация врача-эндокринолога'},
            {'name': 'Приём гинеколога', 'description': 'Консультация врача-гинеколога'},
            {'name': 'Приём уролога', 'description': 'Консультация врача-уролога'},
            {'name': 'Приём офтальмолога', 'description': 'Проверка зрения, консультация офтальмолога'},
            {'name': 'Приём дерматолога', 'description': 'Консультация врача-дерматолога'},
            {'name': 'Приём педиатра', 'description': 'Консультация детского врача'},
            {'name': 'УЗИ диагностика', 'description': 'УЗИ органов брюшной полости, щитовидной железы'},
            {'name': 'Анализы крови', 'description': 'Общий анализ крови, биохимия'},
            {'name': 'ЭКГ', 'description': 'Электрокардиограмма'},
            {'name': 'Рентген', 'description': 'Рентгенологическое исследование'},
            {'name': 'МРТ', 'description': 'Магнитно-резонансная томография'},
            {'name': 'КТ', 'description': 'Компьютерная томография'},
        ]

        services = {}
        for service_data in services_data:
            service, created = Service.objects.get_or_create(
                name=service_data['name'],
                defaults={'description': service_data['description']}
            )
            services[service.name] = service
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✅ Создана услуга: {service.name}'))

        # 2. Создание клиник
        self.stdout.write('🏥 Создание клиник...')
        
        # Рабочие часы и дни (стандартные)
        standard_working_hours = {
            "mon": ["08:00", "20:00"],
            "tue": ["08:00", "20:00"],
            "wed": ["08:00", "20:00"],
            "thu": ["08:00", "20:00"],
            "fri": ["08:00", "20:00"],
            "sat": ["09:00", "18:00"],
            "sun": ["09:00", "15:00"]
        }
        
        standard_working_days = {
            "mon": True,
            "tue": True,
            "wed": True,
            "thu": True,
            "fri": True,
            "sat": True,
            "sun": True
        }
        
        weekday_only_days = {
            "mon": True,
            "tue": True,
            "wed": True,
            "thu": True,
            "fri": True,
            "sat": False,
            "sun": False
        }

        clinics_data = [
            {
                'name': 'СМ-Клиника',
                'city': 'Москва',
                'address': 'ул. Ярославская, д. 4, корп. 2',
                'phone_number': '+74951234567',
                'email': 'info@sm-clinic.ru',
                'website': 'https://www.smclinic.ru',
                'description': 'Многопрофильный медицинский центр с современным оборудованием',
                'rating': 4.8,
                'is_verified': True,
                'working_hours': standard_working_hours,
                'working_days': standard_working_days,
            },
            {
                'name': 'Медси',
                'city': 'Москва',
                'address': 'Грузинский переулок, д. 3А',
                'phone_number': '+74959999999',
                'email': 'info@medsi.ru',
                'website': 'https://www.medsi.ru',
                'description': 'Клиника премиум-класса с лучшими специалистами',
                'rating': 4.9,
                'is_verified': True,
                'working_hours': standard_working_hours,
                'working_days': standard_working_days,
            },
            {
                'name': 'Инвитро',
                'city': 'Москва',
                'address': 'ул. Новослободская, д. 3',
                'phone_number': '+78002003363',
                'email': 'info@invitro.ru',
                'website': 'https://www.invitro.ru',
                'description': 'Лабораторная диагностика и медицинские услуги',
                'rating': 4.6,
                'is_verified': True,
                'working_hours': standard_working_hours,
                'working_days': standard_working_days,
            },
            {
                'name': 'Семейный Доктор',
                'city': 'Москва',
                'address': 'ул. Баррикадная, д. 19, стр. 3',
                'phone_number': '+74992429393',
                'email': 'info@familydoctor.ru',
                'website': 'https://www.familydoctor.ru',
                'description': 'Семейная клиника с комплексным подходом к здоровью',
                'rating': 4.7,
                'is_verified': True,
                'working_hours': {
                    "mon": ["08:00", "21:00"],
                    "tue": ["08:00", "21:00"],
                    "wed": ["08:00", "21:00"],
                    "thu": ["08:00", "21:00"],
                    "fri": ["08:00", "21:00"],
                    "sat": ["09:00", "20:00"],
                    "sun": ["09:00", "18:00"]
                },
                'working_days': standard_working_days,
            },
            {
                'name': 'ЕвроМед',
                'city': 'Москва',
                'address': 'ул. Маросейка, д. 2/15',
                'phone_number': '+74959885555',
                'email': 'info@euromed.ru',
                'website': 'https://www.euromed.ru',
                'description': 'Европейский медицинский центр',
                'rating': 4.8,
                'is_verified': True,
                'working_hours': standard_working_hours,
                'working_days': weekday_only_days,
            },
        ]

        clinics = {}
        for clinic_data in clinics_data:
            clinic, created = Clinic.objects.get_or_create(
                name=clinic_data['name'],
                city=clinic_data['city'],
                defaults=clinic_data
            )
            clinics[clinic.name] = clinic
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✅ Создана клиника: {clinic.name}'))

        # 3. Создание врачей
        self.stdout.write('👨‍⚕️ Создание врачей...')
        
        doctors_data = [
            # СМ-Клиника
            {
                'full_name': 'Иванов Сергей Петрович',
                'clinic': clinics['СМ-Клиника'],
                'specialty': 'Терапевт',
                'phone_number': '+79161234567',
                'work_experience': 15,
                'price': Decimal('2500.00'),
                'services': ['Приём терапевта', 'ЭКГ'],
                'rating': 4.9,
            },
            {
                'full_name': 'Смирнова Елена Александровна',
                'clinic': clinics['СМ-Клиника'],
                'specialty': 'Кардиолог',
                'phone_number': '+79161234568',
                'work_experience': 12,
                'price': Decimal('3500.00'),
                'services': ['Приём кардиолога', 'ЭКГ'],
                'rating': 4.8,
            },
            {
                'full_name': 'Петров Андрей Николаевич',
                'clinic': clinics['СМ-Клиника'],
                'specialty': 'Невролог',
                'phone_number': '+79161234569',
                'work_experience': 10,
                'price': Decimal('3000.00'),
                'services': ['Приём невролога'],
                'rating': 4.7,
            },
            
            # Медси
            {
                'full_name': 'Волкова Мария Игоревна',
                'clinic': clinics['Медси'],
                'specialty': 'Эндокринолог',
                'phone_number': '+79261234567',
                'work_experience': 18,
                'price': Decimal('4500.00'),
                'services': ['Приём эндокринолога', 'УЗИ диагностика'],
                'rating': 4.9,
            },
            {
                'full_name': 'Соколов Дмитрий Владимирович',
                'clinic': clinics['Медси'],
                'specialty': 'Уролог',
                'phone_number': '+79261234568',
                'work_experience': 14,
                'price': Decimal('4000.00'),
                'services': ['Приём уролога', 'УЗИ диагностика'],
                'rating': 4.8,
            },
            
            # Инвитро
            {
                'full_name': 'Кузнецова Ольга Сергеевна',
                'clinic': clinics['Инвитро'],
                'specialty': 'Терапевт',
                'phone_number': '+79161234570',
                'work_experience': 8,
                'price': Decimal('2000.00'),
                'services': ['Приём терапевта', 'Анализы крови'],
                'rating': 4.6,
            },
            {
                'full_name': 'Морозов Игорь Анатольевич',
                'clinic': clinics['Инвитро'],
                'specialty': 'Диагност',
                'phone_number': '+79161234571',
                'work_experience': 20,
                'price': Decimal('3500.00'),
                'services': ['УЗИ диагностика', 'Анализы крови'],
                'rating': 4.7,
            },
            
            # Семейный Доктор
            {
                'full_name': 'Лебедева Татьяна Михайловна',
                'clinic': clinics['Семейный Доктор'],
                'specialty': 'Педиатр',
                'phone_number': '+79261234569',
                'work_experience': 16,
                'price': Decimal('2800.00'),
                'services': ['Приём педиатра'],
                'rating': 4.9,
            },
            {
                'full_name': 'Новиков Максим Юрьевич',
                'clinic': clinics['Семейный Доктор'],
                'specialty': 'Офтальмолог',
                'phone_number': '+79261234570',
                'work_experience': 11,
                'price': Decimal('3200.00'),
                'services': ['Приём офтальмолога'],
                'rating': 4.8,
            },
            {
                'full_name': 'Козлова Анна Викторовна',
                'clinic': clinics['Семейный Доктор'],
                'specialty': 'Гинеколог',
                'phone_number': '+79261234571',
                'work_experience': 13,
                'price': Decimal('3500.00'),
                'services': ['Приём гинеколога', 'УЗИ диагностика'],
                'rating': 4.7,
            },
            
            # ЕвроМед
            {
                'full_name': 'Федоров Виктор Павлович',
                'clinic': clinics['ЕвроМед'],
                'specialty': 'Дерматолог',
                'phone_number': '+79161234572',
                'work_experience': 9,
                'price': Decimal('3800.00'),
                'services': ['Приём дерматолога'],
                'rating': 4.8,
            },
            {
                'full_name': 'Васильева Светлана Дмитриевна',
                'clinic': clinics['ЕвроМед'],
                'specialty': 'Терапевт',
                'phone_number': '+79161234573',
                'work_experience': 12,
                'price': Decimal('3000.00'),
                'services': ['Приём терапевта', 'ЭКГ'],
                'rating': 4.7,
            },
            
            # Дополнительные врачи - СМ-Клиника (еще 3 врача)
            {
                'full_name': 'Григорьев Алексей Владимирович',
                'clinic': clinics['СМ-Клиника'],
                'specialty': 'Эндокринолог',
                'phone_number': '+79161234574',
                'work_experience': 14,
                'price': Decimal('3800.00'),
                'services': ['Приём эндокринолога', 'УЗИ диагностика'],
                'rating': 4.8,
            },
            {
                'full_name': 'Романова Екатерина Петровна',
                'clinic': clinics['СМ-Клиника'],
                'specialty': 'Гинеколог',
                'phone_number': '+79161234575',
                'work_experience': 11,
                'price': Decimal('3200.00'),
                'services': ['Приём гинеколога', 'УЗИ диагностика'],
                'rating': 4.7,
            },
            {
                'full_name': 'Жуков Николай Сергеевич',
                'clinic': clinics['СМ-Клиника'],
                'specialty': 'Офтальмолог',
                'phone_number': '+79161234576',
                'work_experience': 9,
                'price': Decimal('2900.00'),
                'services': ['Приём офтальмолога'],
                'rating': 4.6,
            },
            
            # Дополнительные врачи - Медси (еще 4 врача)
            {
                'full_name': 'Белов Константин Михайлович',
                'clinic': clinics['Медси'],
                'specialty': 'Невролог',
                'phone_number': '+79261234572',
                'work_experience': 17,
                'price': Decimal('4200.00'),
                'services': ['Приём невролога', 'МРТ'],
                'rating': 4.9,
            },
            {
                'full_name': 'Зайцева Наталья Андреевна',
                'clinic': clinics['Медси'],
                'specialty': 'Офтальмолог',
                'phone_number': '+79261234573',
                'work_experience': 13,
                'price': Decimal('3900.00'),
                'services': ['Приём офтальмолога'],
                'rating': 4.8,
            },
            {
                'full_name': 'Павлов Роман Игоревич',
                'clinic': clinics['Медси'],
                'specialty': 'Дерматолог',
                'phone_number': '+79261234574',
                'work_experience': 10,
                'price': Decimal('4100.00'),
                'services': ['Приём дерматолога'],
                'rating': 4.7,
            },
            {
                'full_name': 'Борисова Алина Владимировна',
                'clinic': clinics['Медси'],
                'specialty': 'Терапевт',
                'phone_number': '+79261234575',
                'work_experience': 15,
                'price': Decimal('3800.00'),
                'services': ['Приём терапевта', 'ЭКГ', 'Анализы крови'],
                'rating': 4.8,
            },
            
            # Дополнительные врачи - Инвитро (еще 4 врача)
            {
                'full_name': 'Сидоров Владимир Николаевич',
                'clinic': clinics['Инвитро'],
                'specialty': 'Кардиолог',
                'phone_number': '+79161234577',
                'work_experience': 19,
                'price': Decimal('3300.00'),
                'services': ['Приём кардиолога', 'ЭКГ'],
                'rating': 4.7,
            },
            {
                'full_name': 'Медведева Ирина Олеговна',
                'clinic': clinics['Инвитро'],
                'specialty': 'Эндокринолог',
                'phone_number': '+79161234578',
                'work_experience': 12,
                'price': Decimal('2900.00'),
                'services': ['Приём эндокринолога', 'УЗИ диагностика', 'Анализы крови'],
                'rating': 4.6,
            },
            {
                'full_name': 'Николаев Евгений Александрович',
                'clinic': clinics['Инвитро'],
                'specialty': 'Уролог',
                'phone_number': '+79161234579',
                'work_experience': 11,
                'price': Decimal('3100.00'),
                'services': ['Приём уролога', 'УЗИ диагностика'],
                'rating': 4.5,
            },
            {
                'full_name': 'Крылова Юлия Викторовна',
                'clinic': clinics['Инвитро'],
                'specialty': 'Педиатр',
                'phone_number': '+79161234580',
                'work_experience': 8,
                'price': Decimal('2400.00'),
                'services': ['Приём педиатра', 'Анализы крови'],
                'rating': 4.7,
            },
            
            # Дополнительные врачи - Семейный Доктор (еще 3 врача)
            {
                'full_name': 'Орлов Станислав Юрьевич',
                'clinic': clinics['Семейный Доктор'],
                'specialty': 'Кардиолог',
                'phone_number': '+79261234576',
                'work_experience': 16,
                'price': Decimal('3600.00'),
                'services': ['Приём кардиолога', 'ЭКГ'],
                'rating': 4.8,
            },
            {
                'full_name': 'Попова Наталия Сергеевна',
                'clinic': clinics['Семейный Доктор'],
                'specialty': 'Эндокринолог',
                'phone_number': '+79261234577',
                'work_experience': 14,
                'price': Decimal('3400.00'),
                'services': ['Приём эндокринолога', 'УЗИ диагностика'],
                'rating': 4.7,
            },
            {
                'full_name': 'Макаров Денис Иванович',
                'clinic': clinics['Семейный Доктор'],
                'specialty': 'Уролог',
                'phone_number': '+79261234578',
                'work_experience': 10,
                'price': Decimal('3100.00'),
                'services': ['Приём уролога'],
                'rating': 4.6,
            },
            
            # Дополнительные врачи - ЕвроМед (еще 4 врача)
            {
                'full_name': 'Захарова Анастасия Петровна',
                'clinic': clinics['ЕвроМед'],
                'specialty': 'Невролог',
                'phone_number': '+79161234581',
                'work_experience': 13,
                'price': Decimal('3900.00'),
                'services': ['Приём невролога', 'МРТ'],
                'rating': 4.8,
            },
            {
                'full_name': 'Антонов Михаил Владимирович',
                'clinic': clinics['ЕвроМед'],
                'specialty': 'Кардиолог',
                'phone_number': '+79161234582',
                'work_experience': 15,
                'price': Decimal('4000.00'),
                'services': ['Приём кардиолога', 'ЭКГ'],
                'rating': 4.9,
            },
            {
                'full_name': 'Егорова Валентина Игоревна',
                'clinic': clinics['ЕвроМед'],
                'specialty': 'Гинеколог',
                'phone_number': '+79161234583',
                'work_experience': 12,
                'price': Decimal('3700.00'),
                'services': ['Приём гинеколога', 'УЗИ диагностика'],
                'rating': 4.7,
            },
            {
                'full_name': 'Тимофеев Артем Дмитриевич',
                'clinic': clinics['ЕвроМед'],
                'specialty': 'Педиатр',
                'phone_number': '+79161234584',
                'work_experience': 9,
                'price': Decimal('3200.00'),
                'services': ['Приём педиатра'],
                'rating': 4.6,
            },
        ]

        # Стандартные рабочие часы для врачей
        doctor_working_hours = {
            "mon": ["09:00", "18:00"],
            "tue": ["09:00", "18:00"],
            "wed": ["09:00", "18:00"],
            "thu": ["09:00", "18:00"],
            "fri": ["09:00", "18:00"],
            "sat": ["10:00", "15:00"],
            "sun": []
        }
        
        doctor_working_days = {
            "mon": True,
            "tue": True,
            "wed": True,
            "thu": True,
            "fri": True,
            "sat": True,
            "sun": False
        }
        
        # Обеденное время для всех рабочих дней
        lunch_time = {
            "mon": ["13:00", "14:00"],
            "tue": ["13:00", "14:00"],
            "wed": ["13:00", "14:00"],
            "thu": ["13:00", "14:00"],
            "fri": ["13:00", "14:00"],
            "sat": ["13:00", "14:00"],
            "sun": []
        }

        for doctor_data in doctors_data:
            service_names = doctor_data.pop('services')
            
            doctor, created = Doctor.objects.get_or_create(
                full_name=doctor_data['full_name'],
                clinic=doctor_data['clinic'],
                defaults={
                    **doctor_data,
                    'working_hours': doctor_working_hours,
                    'working_days': doctor_working_days,
                    'lunch_time': lunch_time,
                    'default_duration': 30,
                    'available_for_booking': True,
                    'is_active': True,
                }
            )
            
            # Добавляем услуги
            for service_name in service_names:
                if service_name in services:
                    doctor.services.add(services[service_name])
            
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f'  ✅ Создан врач: {doctor.full_name} ({doctor.specialty}) - {doctor.clinic.name}'
                ))

        # Статистика
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('✅ База данных успешно заполнена!'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(f'📋 Услуг: {Service.objects.count()}')
        self.stdout.write(f'🏥 Клиник: {Clinic.objects.count()}')
        self.stdout.write(f'👨‍⚕️ Врачей: {Doctor.objects.count()}')
        self.stdout.write('')
        self.stdout.write('🌐 Теперь можете использовать приложение для записи на приём!')
