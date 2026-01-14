from django.urls import path
from .views import *


urlpatterns = [
    path('health/', health_check, name='health_check'),

    path('document/commercial/full/', document_commercial_proposal_full, name='document_commercial_proposal_full'),
    path('document/commercial/life/', document_commercial_proposal_life, name='document_commercial_proposal_life'),
    path('document/terms-of-service/', document_terms_of_service, name='document_terms_of_service'),
    path('document/privacy-policy/', document_privacy_policy, name='document_privacy_policy'),

    path('messages/receive/', received_message, name='receive_message'),

    path('faq/', get_faq_entries, name='get_faq_entries'),
]
