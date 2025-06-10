from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Count, F
from django.utils import timezone
from datetime import datetime, timedelta
from .models import (
    Reservation, Ingredient, MenuItem, MenuItemIngredient,
    Order, OrderItem, Promotion
)
from .serializers import (
    ReservationSerializer, IngredientSerializer, MenuItemSerializer,
    MenuItemIngredientSerializer, OrderSerializer, OrderCreateSerializer,
    OrderItemSerializer, PromotionSerializer
)

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False

class IsWaiterOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['waiter', 'admin']

class ReservationListCreateView(generics.ListCreateAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['date', 'time', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    
    def get_queryset(self):
        queryset = Reservation.objects.all()
        if self.request.user.role == 'client':
            queryset = queryset.filter(user=self.request.user)
        
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        status = self.request.query_params.get('status')
        
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.order_by('-date', '-time')

class ReservationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

class IngredientListCreateView(generics.ListCreateAPIView):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'supplier']
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsWaiterOrAdmin()]
        return [permissions.IsAuthenticated()]

class IngredientDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [permissions.IsAuthenticated, IsWaiterOrAdmin]

class MenuItemListCreateView(generics.ListCreateAPIView):
    serializer_class = MenuItemSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'category']
    ordering_fields = ['price', 'name', 'category']
    
    def get_queryset(self):
        queryset = MenuItem.objects.all()
        category = self.request.query_params.get('category')
        is_available = self.request.query_params.get('is_available')
        is_vegetarian = self.request.query_params.get('is_vegetarian')
        is_vegan = self.request.query_params.get('is_vegan')
        is_gluten_free = self.request.query_params.get('is_gluten_free')
        
        if category:
            queryset = queryset.filter(category=category)
        if is_available is not None:
            queryset = queryset.filter(is_available=is_available.lower() == 'true')
        if is_vegetarian is not None:
            queryset = queryset.filter(is_vegetarian=is_vegetarian.lower() == 'true')
        if is_vegan is not None:
            queryset = queryset.filter(is_vegan=is_vegan.lower() == 'true')
        if is_gluten_free is not None:
            queryset = queryset.filter(is_gluten_free=is_gluten_free.lower() == 'true')
        
        return queryset
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsWaiterOrAdmin()]
        return [permissions.AllowAny()]

class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated(), IsWaiterOrAdmin()]
        return [permissions.AllowAny()]

class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'status']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderSerializer
    
    def get_queryset(self):
        queryset = Order.objects.all()
        if self.request.user.role == 'client':
            queryset = queryset.filter(user=self.request.user)
        elif self.request.user.role == 'waiter':
            queryset = queryset.filter(Q(waiter=self.request.user) | Q(waiter__isnull=True))
        
        status = self.request.query_params.get('status')
        order_type = self.request.query_params.get('order_type')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if status:
            queryset = queryset.filter(status=status)
        if order_type:
            queryset = queryset.filter(order_type=order_type)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        return queryset.order_by('-created_at')

class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [permissions.IsAuthenticated(), IsWaiterOrAdmin()]
        return [permissions.IsAuthenticated()]

class PromotionListView(generics.ListCreateAPIView):
    serializer_class = PromotionSerializer
    
    def get_queryset(self):
        queryset = Promotion.objects.filter(is_active=True)
        return queryset.filter(
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        )
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsWaiterOrAdmin()]
        return [permissions.AllowAny()]

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsWaiterOrAdmin])
def add_menu_item_ingredient(request, menu_item_id):
    menu_item = get_object_or_404(MenuItem, id=menu_item_id)
    serializer = MenuItemIngredientSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save(menu_item=menu_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def low_stock_ingredients(request):
    ingredients = Ingredient.objects.filter(quantity__lte=F('minimum_quantity'))
    serializer = IngredientSerializer(ingredients, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsWaiterOrAdmin])
def assign_waiter_to_order(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    order.waiter = request.user
    order.save()
    serializer = OrderSerializer(order)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsWaiterOrAdmin])
def update_order_status(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    new_status = request.data.get('status')
    
    if new_status not in dict(Order.STATUS_CHOICES):
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
    
    order.status = new_status
    order.save()
    serializer = OrderSerializer(order)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsWaiterOrAdmin])
def sales_report(request):
    date_from = request.query_params.get('date_from', timezone.now().date() - timedelta(days=30))
    date_to = request.query_params.get('date_to', timezone.now().date())
    
    orders = Order.objects.filter(
        created_at__date__range=[date_from, date_to],
        status__in=['delivered', 'ready']
    )
    
    total_sales = orders.aggregate(total=Sum('final_amount'))['total'] or 0
    total_orders = orders.count()
    
    daily_sales = orders.values('created_at__date').annotate(
        total=Sum('final_amount'),
        count=Count('id')
    ).order_by('created_at__date')
    
    category_sales = OrderItem.objects.filter(
        order__in=orders
    ).values('menu_item__category').annotate(
        total=Sum('subtotal'),
        count=Sum('quantity')
    )
    
    top_items = OrderItem.objects.filter(
        order__in=orders
    ).values('menu_item__name').annotate(
        total_quantity=Sum('quantity'),
        total_revenue=Sum('subtotal')
    ).order_by('-total_quantity')[:10]
    
    return Response({
        'total_sales': total_sales,
        'total_orders': total_orders,
        'average_order_value': total_sales / total_orders if total_orders > 0 else 0,
        'daily_sales': daily_sales,
        'category_sales': category_sales,
        'top_items': top_items
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsWaiterOrAdmin])
def inventory_report(request):
    low_stock = Ingredient.objects.filter(quantity__lte=F('minimum_quantity'))
    total_value = Ingredient.objects.aggregate(
        total=Sum(F('quantity') * F('price_per_unit'))
    )['total'] or 0
    
    ingredient_usage = MenuItemIngredient.objects.values(
        'ingredient__name'
    ).annotate(
        total_usage=Sum('quantity_required'),
        menu_items_count=Count('menu_item', distinct=True)
    ).order_by('-total_usage')
    
    return Response({
        'low_stock_count': low_stock.count(),
        'low_stock_items': IngredientSerializer(low_stock, many=True).data,
        'total_inventory_value': total_value,
        'ingredient_usage': ingredient_usage
    })