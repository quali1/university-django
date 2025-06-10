from django.contrib import admin
from .models import (
    Reservation, Ingredient, MenuItem, MenuItemIngredient,
    Order, OrderItem, Promotion
)

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'time', 'party_size', 'status', 'table_number', 'created_at']
    list_filter = ['status', 'date']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    date_hierarchy = 'date'

@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ['name', 'quantity', 'unit', 'minimum_quantity', 'is_low_stock', 'supplier']
    list_filter = ['supplier']
    search_fields = ['name', 'supplier']

class MenuItemIngredientInline(admin.TabularInline):
    model = MenuItemIngredient
    extra = 1

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'is_available', 'is_vegetarian', 'is_vegan', 'is_gluten_free']
    list_filter = ['category', 'is_available', 'is_vegetarian', 'is_vegan', 'is_gluten_free']
    search_fields = ['name', 'description']
    inlines = [MenuItemIngredientInline]

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['price', 'subtotal']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'waiter', 'status', 'order_type', 'total_amount', 'created_at']
    list_filter = ['status', 'order_type', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline]
    readonly_fields = ['total_amount', 'final_amount']

@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ['name', 'promo_code', 'discount_percentage', 'start_date', 'end_date', 'is_active', 'is_valid']
    list_filter = ['is_active', 'start_date', 'end_date']
    search_fields = ['name', 'promo_code']
    filter_horizontal = ['applicable_items']