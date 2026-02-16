from django.contrib import admin
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['mitra', 'category', 'amount', 'description', 'date', 'created_at']
    list_filter = ['category', 'date', 'mitra']
    search_fields = ['description', 'notes']
    date_hierarchy = 'date'
