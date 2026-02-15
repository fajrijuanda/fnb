import google.generativeai as genai
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from sales.models import Order
from inventory.models import StockLog, Ingredient, Recipe
from catalog.models import Product
from django.db.models import Sum, Count, F

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    def generate_content(self, prompt):
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            error_str = str(e)
            if '429' in error_str or 'quota' in error_str.lower() or 'rate' in error_str.lower():
                return "⏳ Batas penggunaan AI tercapai. Silakan coba lagi dalam beberapa menit."
            return "Gagal memuat data AI. Silakan coba lagi nanti."

class AdditionalServices:
    def __init__(self):
        self.gemini = GeminiService()

    def generate_product_description(self, product_name, ingredients):
        prompt = f"""
        Generate a short, appetizing, and professional menu description for a product named "{product_name}".
        Main ingredients: {ingredients}.
        Target audience: Cafe customers.
        Tone: Modern, inviting, premium.
        Length: 1-2 sentences.
        Language: Bahasa Indonesia (but verify it sounds natural).
        """
        return self.gemini.generate_content(prompt)

    def analyze_sales_trends(self):
        # 1. Get Sales Data (Last 7 Days)
        today = timezone.now()
        last_week = today - timedelta(days=7)
        orders = Order.objects.filter(created_at__gte=last_week)
        
        total_revenue = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_orders = orders.count()
        
        # Top Selling Items (Naive implementation via order items)
        # optimize: aggregate OrderItem directly
        # For simplicity, we'll prompt with aggregate numbers
        
        prompt = f"""
        Act as a business data analyst for a Cafe.
        Analyze the following sales data for the last 7 days:
        - Total Revenue: Rp {total_revenue:,}
        - Total Transactions: {total_orders}
        - Date: {today.strftime('%Y-%m-%d')}
        
        Provide 1 short, actionable insight/recommendation (max 2 sentences) in Bahasa Indonesia.
        Focus on value, not just stating the numbers.
        Example: "Pendapatan stabil, namun jumlah transaksi menurun; pertimbangkan promo bundling untuk meningkatkan order count."
        """
        return self.gemini.generate_content(prompt)

    def predict_inventory_depletion(self):
        # Naive approach: specific ingredients tracking
        # Get ingredients with lowest stock relative to alert level
        low_stock_items = Ingredient.objects.filter(current_stock__lte=F('min_stock_alert') * 2)
        
        if not low_stock_items.exists():
            return "Stok aman. Tidak ada prediksi kritis saat ini."
            
        items_summary = ", ".join([f"{i.name} ({i.current_stock} {i.unit})" for i in low_stock_items])
        
        prompt = f"""
        Act as an inventory manager.
        The following items are running low or near alert levels:
        {items_summary}
        
        Provide a brief warning and restocking recommendation in Bahasa Indonesia.
        Max 2 sentences.
        """
        return self.gemini.generate_content(prompt)

    def chat_assistant(self, user_query):
        # Context building (lightweight)
        # Fetch basic stats to give context
        today = timezone.now().date()
        daily_revenue = Order.objects.filter(created_at__date=today).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        order_count = Order.objects.filter(created_at__date=today).count()
        
        context = f"""
        You are 'Orion AI', a helpful assistant for the CloudPOS admin.
        Current Business Context (Today):
        - Date: {today}
        - Daily Revenue: Rp {daily_revenue:,}
        - Order Count: {order_count}
        
        User Query: "{user_query}"
        
        Answer courteously in Bahasa Indonesia. If the query requires data you don't have, explain that you only have access to daily summaries currently.
        Keep answers short and professional.
        """
        return self.gemini.generate_content(context)
