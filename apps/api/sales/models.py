import uuid
from django.db import models
from django.utils import timezone
from catalog.models import Product


class Order(models.Model):
    """
    Model untuk menyimpan transaksi penjualan.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Tunai'
        QRIS = 'QRIS', 'QRIS'
        TRANSFER = 'TRANSFER', 'Transfer Bank'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PAID
    )
    total_amount = models.PositiveIntegerField(default=0)
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH
    )
    cashier = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_orders'
    )
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'

    def __str__(self):
        return f"{self.invoice_number} - Rp {self.total_amount:,}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        super().save(*args, **kwargs)

    def generate_invoice_number(self):
        """
        Generate invoice number format: INV/YYYY/MM/DD/XXX
        """
        today = timezone.now()
        date_str = today.strftime('%Y/%m/%d')
        
        # Count orders today
        today_start = today.replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = Order.objects.filter(
            created_at__gte=today_start
        ).count()
        
        sequence = str(today_count + 1).zfill(3)
        return f"INV/{date_str}/{sequence}"

    def calculate_total(self):
        """
        Calculate total from order items.
        """
        total = sum(item.subtotal for item in self.items.all())
        self.total_amount = total
        return total


class OrderItem(models.Model):
    """
    Model untuk menyimpan item dalam order.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    quantity = models.PositiveIntegerField(default=1)
    price_at_sale = models.PositiveIntegerField()  # Harga saat dijual (snapshot)
    note = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    @property
    def subtotal(self):
        return self.price_at_sale * self.quantity

    def save(self, *args, **kwargs):
        # Snapshot harga produk jika belum diset
        if not self.price_at_sale:
            self.price_at_sale = self.product.price
        super().save(*args, **kwargs)
