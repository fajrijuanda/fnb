from django.contrib import admin
from .models import Category, Product, ProductVariant, ModifierGroup, ModifierOption


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class ModifierOptionInline(admin.TabularInline):
    model = ModifierOption
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'order', 'is_active']
    list_editable = ['order', 'is_active']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'track_inventory', 'current_stock', 'is_available']
    list_filter = ['category', 'is_available', 'track_inventory']
    list_editable = ['price', 'is_available', 'current_stock']
    search_fields = ['name']
    autocomplete_fields = ['category']
    inlines = [ProductVariantInline]


@admin.register(ModifierGroup)
class ModifierGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'min_selection', 'max_selection']
    inlines = [ModifierOptionInline]
    search_fields = ['name']
