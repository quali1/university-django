from django.urls import path
from .views import (
    ReservationListCreateView, ReservationDetailView,
    IngredientListCreateView, IngredientDetailView,
    MenuItemListCreateView, MenuItemDetailView,
    OrderListCreateView, OrderDetailView,
    PromotionListView, add_menu_item_ingredient,
    low_stock_ingredients, assign_waiter_to_order,
    update_order_status, sales_report, inventory_report
)

urlpatterns = [
    path('reservations/', ReservationListCreateView.as_view(), name='reservation-list'),
    path('reservations/<int:pk>/', ReservationDetailView.as_view(), name='reservation-detail'),
    
    path('ingredients/', IngredientListCreateView.as_view(), name='ingredient-list'),
    path('ingredients/<int:pk>/', IngredientDetailView.as_view(), name='ingredient-detail'),
    path('ingredients/low-stock/', low_stock_ingredients, name='low-stock-ingredients'),
    
    path('menu-items/', MenuItemListCreateView.as_view(), name='menu-item-list'),
    path('menu-items/<int:pk>/', MenuItemDetailView.as_view(), name='menu-item-detail'),
    path('menu-items/<int:menu_item_id>/ingredients/', add_menu_item_ingredient, name='add-menu-item-ingredient'),
    
    path('orders/', OrderListCreateView.as_view(), name='order-list'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:order_id>/assign-waiter/', assign_waiter_to_order, name='assign-waiter'),
    path('orders/<int:order_id>/update-status/', update_order_status, name='update-order-status'),
    
    path('promotions/', PromotionListView.as_view(), name='promotion-list'),
    
    path('reports/sales/', sales_report, name='sales-report'),
    path('reports/inventory/', inventory_report, name='inventory-report'),
]