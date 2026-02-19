
import os
import gspread
from django.core.management.base import BaseCommand
from google.oauth2.service_account import Credentials
from django.utils import timezone

from django.db.models import Sum
from sales.models import Order
from users.models import Mitra

class Command(BaseCommand):
    help = 'Sync daily sales report to Google Sheets'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting sales sync...'))

        # 1. Load Credentials
        creds_file = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        if not creds_file:
             self.stdout.write(self.style.ERROR('GOOGLE_APPLICATION_CREDENTIALS env var not set.'))
             return

        scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ]

        try:
            credentials = Credentials.from_service_account_file(creds_file, scopes=scopes)
            gc = gspread.authorize(credentials)
        except Exception as e:
             self.stdout.write(self.style.ERROR(f'Failed to authenticate with Google: {e}'))
             return

        # 2. Get Date (Yesterday if running after midnight, or Today)
        # Assuming this runs after closing (e.g. 10 PM), so we use Today.
        # If running continuously, we might want to specify date.
        # For now, let's use Today.
        report_date = timezone.now().date()
        date_str = report_date.strftime('%Y-%m-%d')
        
        # 3. Process Global Report
        global_sheet_id = os.environ.get('GLOBAL_REPORT_SHEET_ID')
        if global_sheet_id:
            self.sync_global_report(gc, global_sheet_id, report_date, date_str)
        else:
            self.stdout.write(self.style.WARNING('GLOBAL_REPORT_SHEET_ID not set. Skipping global report.'))

        # 4. Process Individual Mitra Reports
        mitras = Mitra.objects.filter(google_sheet_id__isnull=False).exclude(google_sheet_id='')
        for mitra in mitras:
            self.sync_mitra_report(gc, mitra, report_date, date_str)

        self.stdout.write(self.style.SUCCESS('Sales sync completed.'))

    def get_sales_data(self, mitra, report_date):
        # Filter orders for this Mitra (via Cashiers)
        # Cashier -> User -> CashierProfile -> Mitra
        orders = Order.objects.filter(
            cashier__cashier_profile__mitra=mitra,
            created_at__date=report_date,
            status=Order.Status.PAID
        )

        total_sales = orders.aggregate(total=Sum('total_amount'))['total'] or 0
        total_orders = orders.count()

        # Payment Methods
        cash_sales = orders.filter(payment_method=Order.PaymentMethod.CASH).aggregate(total=Sum('total_amount'))['total'] or 0
        qris_sales = orders.filter(payment_method=Order.PaymentMethod.QRIS).aggregate(total=Sum('total_amount'))['total'] or 0
        transfer_sales = orders.filter(payment_method=Order.PaymentMethod.TRANSFER).aggregate(total=Sum('total_amount'))['total'] or 0

        return {
            'total_sales': total_sales,
            'total_orders': total_orders,
            'cash': cash_sales,
            'qris': qris_sales,
            'transfer': transfer_sales
        }

    def sync_global_report(self, gc, sheet_id, report_date, date_str):
        try:
            sh = gc.open_by_key(sheet_id)
            worksheet = sh.get_worksheet(0) # First sheet
            
            # Check/Create Header
            header = ["Date", "Mitra Name", "Total Sales", "Orders", "Cash", "QRIS", "Transfer"]
            current_header = worksheet.row_values(1)
            if current_header != header:
                worksheet.insert_row(header, 1)

            # Get all Mitras
            all_mitras = Mitra.objects.all()
            
            # Prepare rows
            rows_to_append = []
            
            for mitra in all_mitras:
                data = self.get_sales_data(mitra, report_date)
                
                # Check if row exists for this Date + Mitra to avoid duplicates?
                # For simplicity, we append for now. 
                # Ideally we should check if data for this date/mitra already exists and update it.
                # But Append is safer for history if script runs once.
                
                row = [
                    date_str,
                    mitra.user.username,
                    data['total_sales'],
                    data['total_orders'],
                    data['cash'],
                    data['qris'],
                    data['transfer']
                ]
                rows_to_append.append(row)

            if rows_to_append:
                worksheet.append_rows(rows_to_append)
                self.stdout.write(f"Updated global report for {date_str}")

        except Exception as e:
             self.stdout.write(self.style.ERROR(f'Error updating global report: {e}'))

    def sync_mitra_report(self, gc, mitra, report_date, date_str):
        try:
            sh = gc.open_by_key(mitra.google_sheet_id)
            worksheet = sh.get_worksheet(0) # First sheet
            
            # Check/Create Header
            header = ["Date", "Total Sales", "Orders", "Cash", "QRIS", "Transfer"]
            current_header = worksheet.row_values(1)
            if not current_header: # Sheet might be empty
                 worksheet.append_row(header)
            elif current_header != header:
                 # Warning: Header mismatch. We might append anyway or try to fix.
                 # Let's assume user might have changed it, but we append our format.
                 pass

            data = self.get_sales_data(mitra, report_date)
            
            row = [
                date_str,
                data['total_sales'],
                data['total_orders'],
                data['cash'],
                data['qris'],
                data['transfer']
            ]
            
            worksheet.append_row(row)
            self.stdout.write(f"Updated report for Mitra {mitra.user.username}")

        except Exception as e:
             self.stdout.write(self.style.ERROR(f'Error updating report for Mitra {mitra.user.username}: {e}'))
