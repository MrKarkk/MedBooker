"""
Pagination classes для проекта Med-Booker
"""
from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """
    Стандартная пагинация для списков
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100