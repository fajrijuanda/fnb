from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from datetime import datetime
from .models import Order
from .serializers import (
    CreateOrderSerializer,
    OrderSerializer,
    OrderListSerializer
)
from .selectors import get_daily_sales_summary, get_sales_by_date_range
from inventory.services import deduct_stock_for_order


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet untuk mengelola Order.
    
    create: Buat order baru (checkout)
    list: Daftar semua order
    retrieve: Detail order berdasarkan ID
    """
    queryset = Order.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        if self.action == 'list':
            return OrderListSerializer
        return OrderSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Handle checkout - create new order.
        Stock deduction is performed automatically after order creation.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Deduct stock from inventory (products and/or ingredients)
        deduct_stock_for_order(order)
        
        # Return full order data
        response_serializer = OrderSerializer(order)
        return Response({
            'status': 'success',
            'message': 'Order berhasil dibuat dan stok telah dikurangi.',
            'data': response_serializer.data
        }, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        """
        List orders dengan filter optional.
        """
        queryset = self.get_queryset()
        
        # Filter by status
        order_status = request.query_params.get('status')
        if order_status:
            queryset = queryset.filter(status=order_status.upper())
        
        # Filter by date
        date = request.query_params.get('date')
        if date:
            queryset = queryset.filter(created_at__date=date)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'status': 'success',
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        """
        Get order detail by ID.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'status': 'success',
            'data': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='daily-report')
    def daily_report(self, request):
        """
        Get daily sales report.
        GET /api/v1/sales/orders/daily-report/?date=YYYY-MM-DD
        """
        date_str = request.query_params.get('date')
        
        if date_str:
            try:
                report_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({
                    'status': 'error',
                    'message': 'Invalid date format. Use YYYY-MM-DD.'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            report_date = None  # Will default to today
        
        summary = get_daily_sales_summary(report_date)
        
        return Response({
            'status': 'success',
            'data': summary
        })

    @action(detail=False, methods=['get'], url_path='range-report')
    def range_report(self, request):
        """
        Get sales report for a date range.
        GET /api/v1/sales/orders/range-report/?start=YYYY-MM-DD&end=YYYY-MM-DD
        """
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')
        
        if not start_str or not end_str:
            return Response({
                'status': 'error',
                'message': 'Both start and end dates are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'status': 'error',
                'message': 'Invalid date format. Use YYYY-MM-DD.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = get_sales_by_date_range(start_date, end_date)
        
        return Response({
            'status': 'success',
            'data': data
        })

