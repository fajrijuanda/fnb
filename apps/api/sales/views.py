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
from inventory.services import deduct_stock_for_order
from .selectors import (
    get_daily_sales_summary, 
    get_sales_by_date_range,
    get_orders_for_export
)
import pandas as pd
import io
from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet untuk mengelola Order.
    
    create: Buat order baru (checkout)
    list: Daftar semua order
    retrieve: Detail order berdasarkan ID
    """
    # queryset = Order.objects.all() # Replaced with get_queryset for RBAC
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()

        # Superuser sees all
        if user.is_superuser:
            return Order.objects.all()

        # Mitra sees orders from their cashiers OR themselves
        if hasattr(user, 'mitra_profile'):
            from django.db.models import Q
            return Order.objects.filter(
                Q(cashier__cashier_profile__mitra__user=user) | 
                Q(cashier=user)
            ).distinct()

        # Cashier sees their own orders (and potentially others in same store depending on policy)
        # For strict security audit, start with OWN orders only.
        if hasattr(user, 'cashier_profile'):
             # Optional: Allow seeing all orders in same store:
             # return Order.objects.filter(cashier__cashier_profile__mitra=user.cashier_profile.mitra)
             return Order.objects.filter(cashier=user)

        # Fallback
        return Order.objects.none()
    
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
        order = serializer.save(cashier=request.user)
        
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

    @action(detail=False, methods=['get'], url_path='download-report')
    def export_report(self, request):
        print("DEBUG: HIT EXPORT")
        """
        Export sales report to Excel or PDF.
        GET /api/v1/sales/orders/export/?start=...&end=...&format=excel|pdf
        """
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')
        date_str = request.query_params.get('date')
        export_format = request.query_params.get('format', 'excel')
        
        # Date Logic
        try:
            if start_str and end_str:
                start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
            elif date_str:
                start_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                end_date = start_date
            else:
                return Response({
                    'status': 'error',
                    'message': 'Date or start/end range required.'
                }, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({
                'status': 'error',
                'message': 'Invalid date format.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Fetch Data
        orders = get_orders_for_export(start_date, end_date)
        
        if export_format == 'excel':
            return self._export_to_excel(orders, start_date, end_date)
        elif export_format == 'pdf':
            return self._export_to_pdf(orders, start_date, end_date)
        else:
            return Response({'error': 'Invalid format'}, status=400)

    def _export_to_excel(self, orders, start_date, end_date):
        data = []
        for o in orders:
            data.append({
                'Order ID': o.id,
                'Date': o.created_at.strftime('%Y-%m-%d %H:%M'),
                'Amount': o.total_amount,
                'Payment': o.payment_method,
                'Status': o.status,
                'Cashier': o.cashier.user.username if hasattr(o, 'cashier') else '-',
                'Mitra': o.mitra.user.username if hasattr(o, 'mitra') else '-'
            })
        
        if not data:
            data.append({'Message': 'No Data Available'})

        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Sales Report')
            
        buffer.seek(0)
        filename = f"Sales_Report_{start_date}_{end_date}.xlsx"
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    def _export_to_pdf(self, orders, start_date, end_date):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        # Header
        elements.append(Paragraph("Sales Report", styles['Title']))
        elements.append(Paragraph(f"Period: {start_date} to {end_date}", styles['Normal']))
        elements.append(Spacer(1, 12))
        
        # Table Data
        data = [['Order ID', 'Date', 'Amount', 'Payment', 'Status']]
        total_amount = 0
        for o in orders:
            data.append([
                str(o.id),
                o.created_at.strftime('%Y-%m-%d %H:%M'),
                f"{o.total_amount:,.0f}",
                o.payment_method,
                o.status
            ])
            total_amount += o.total_amount
        
        if not orders:
            data.append(['No Data', '-', '-', '-', '-'])

        # Total Row
        data.append(['', '', '', 'TOTAL', f"{total_amount:,.0f}"])
        
        # Table Styling
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        elements.append(table)
        doc.build(elements)
        
        buffer.seek(0)
        filename = f"Sales_Report_{start_date}_{end_date}.pdf"
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

