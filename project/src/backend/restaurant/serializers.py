from rest_framework import serializers
from .models import (
    Reservation, Ingredient, MenuItem, MenuItemIngredient, 
    Order, OrderItem, Promotion
)
from authentication.serializers import UserSerializer

class ReservationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Reservation
        fields = ['id', 'user', 'user_id', 'date', 'time', 'party_size', 
                 'status', 'table_number', 'special_requests', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        if 'user_id' not in validated_data:
            validated_data['user'] = self.context['request'].user
        else:
            validated_data['user_id'] = validated_data.pop('user_id')
        return super().create(validated_data)

class IngredientSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'quantity', 'unit', 'minimum_quantity', 
                 'price_per_unit', 'supplier', 'is_low_stock', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class MenuItemIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    
    class Meta:
        model = MenuItemIngredient
        fields = ['id', 'ingredient', 'ingredient_name', 'quantity_required']

class MenuItemSerializer(serializers.ModelSerializer):
    ingredients = MenuItemIngredientSerializer(many=True, read_only=True)
    
    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'description', 'price', 'category', 'is_available',
                 'is_vegetarian', 'is_vegan', 'is_gluten_free', 'preparation_time',
                 'image_url', 'ingredients', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name', 'quantity', 'price', 'subtotal', 'notes']
        read_only_fields = ['id', 'price', 'subtotal']

class OrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    waiter = UserSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'waiter', 'reservation', 'status', 'order_type',
                 'table_number', 'total_amount', 'discount_percentage', 'final_amount',
                 'special_instructions', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'total_amount', 'final_amount', 'created_at', 'updated_at']

class OrderCreateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), write_only=True)
    promo_code = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Order
        fields = ['order_type', 'table_number', 'special_instructions', 'items', 'promo_code', 'reservation']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        promo_code = validated_data.pop('promo_code', None)
        
        order = Order.objects.create(
            user=self.context['request'].user,
            **validated_data
        )
        
        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                menu_item_id=item_data['menu_item_id'],
                quantity=item_data['quantity'],
                notes=item_data.get('notes', '')
            )
        
        if promo_code:
            try:
                promotion = Promotion.objects.get(promo_code=promo_code)
                if promotion.is_valid and order.total_amount >= promotion.minimum_order_amount:
                    order.discount_percentage = promotion.discount_percentage
                    promotion.current_uses += 1
                    promotion.save()
                    order.calculate_total()
            except Promotion.DoesNotExist:
                pass
        
        return order

class PromotionSerializer(serializers.ModelSerializer):
    is_valid = serializers.ReadOnlyField()
    
    class Meta:
        model = Promotion
        fields = ['id', 'name', 'description', 'discount_percentage', 'start_date',
                 'end_date', 'is_active', 'minimum_order_amount', 'applicable_items',
                 'promo_code', 'max_uses', 'current_uses', 'is_valid', 'created_at']
        read_only_fields = ['id', 'current_uses', 'created_at']