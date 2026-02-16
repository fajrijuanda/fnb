from django.db import models
from catalog.models import Product

class Ingredient(models.Model):
    """Raw material/Ingredient for recipes (e.g., Rice, Eggs, Syrup)."""
    UNIT_CHOICES = [
        ('gram', 'Gram'),
        ('ml', 'Milliliter'),
        ('pcs', 'Pieces'),
        ('kg', 'Kilogram'),
        ('liter', 'Liter'),
    ]

    name = models.CharField(max_length=200)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='gram')
    current_stock = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Current stock in the specified unit"
    )
    min_stock_alert = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Alert threshold"
    )
    cost_per_unit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Harga beli per unit (Rp). Digunakan untuk kalkulasi HPP."
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.current_stock} {self.unit})"


class IngredientStock(models.Model):
    """
    Per-Mitra stock for ingredients.
    This replaces the global 'current_stock' in Ingredient for Mitras.
    HQ might still use Ingredient.current_stock or also have an entry here?
    For now, let's assume this is for Mitra inventory.
    """
    mitra = models.ForeignKey('users.Mitra', on_delete=models.CASCADE, related_name='ingredient_stocks')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='mitra_stocks')
    current_stock = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Current stock for this Mitra"
    )
    min_stock_alert = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Alert threshold for this Mitra"
    )

    class Meta:
        unique_together = ('mitra', 'ingredient')
        verbose_name_plural = "Ingredient Stocks"

    def __str__(self):
        return f"{self.ingredient.name} @ {self.mitra.user.username}: {self.current_stock} {self.ingredient.unit}"


class Recipe(models.Model):
    """Links a Product to its Ingredients."""
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        related_name='recipe',
        limit_choices_to={'track_inventory': False},
        help_text="Only products that do not track inventory (Racikan) can have a recipe."
    )
    notes = models.TextField(blank=True, help_text="Instructions or notes for this recipe")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Recipe for {self.product.name}"


class RecipeItem(models.Model):
    """Specific ingredient amount for a recipe."""
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='items')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.PROTECT, related_name='used_in_recipes')
    quantity_required = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Amount required per 1 unit of Product"
    )

    class Meta:
        unique_together = ['recipe', 'ingredient']

    def __str__(self):
        return f"{self.quantity_required} {self.ingredient.unit} of {self.ingredient.name}"


class StockLog(models.Model):
    """Log for all stock movements (In/Out)."""
    MOVEMENT_TYPES = [
        ('IN', 'Stock In (Purchase/Adjustment)'),
        ('OUT', 'Stock Out (Sales/Damage)'),
    ]
    REASON_CHOICES = [
        ('SALES', 'Sales'),
        ('PURCHASE', 'Purchase'),
        ('ADJUSTMENT', 'Manual Adjustment'),
        ('WASTE', 'Waste/Spoilage'),
    ]

    ingredient = models.ForeignKey(
        Ingredient, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='logs'
    )
    product = models.ForeignKey(
        Product, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='stock_logs'
    )
    mitra = models.ForeignKey(
        'users.Mitra',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_logs',
        help_text="Mitra who owns this stock movement. Null for HQ/Global."
    )
    
    change_amount = models.DecimalField(max_digits=10, decimal_places=2)
    final_stock = models.DecimalField(max_digits=10, decimal_places=2, help_text="Stock level after change")
    
    movement_type = models.CharField(max_length=10, choices=MOVEMENT_TYPES)
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    notes = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=100, blank=True, help_text="User/System who initiated")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        item = self.ingredient.name if self.ingredient else (self.product.name if self.product else "Unknown")
        return f"{self.movement_type} {self.change_amount} of {item} - {self.reason}"


class RestockOrder(models.Model):
    """
    Restock order from Mitra to HQ (samdenidimsum).
    Tracks the full lifecycle: PENDING → PAID → PREPARING → SHIPPED → RECEIVED.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Menunggu Pembayaran'),
        ('PAID', 'Dibayar'),
        ('PREPARING', 'Disiapkan'),
        ('SHIPPED', 'Dikirim'),
        ('RECEIVED', 'Diterima'),
        ('CANCELLED', 'Dibatalkan'),
    ]
    PAYMENT_CHOICES = [
        ('TRANSFER', 'Transfer Bank'),
        ('QRIS', 'QRIS'),
        ('VA', 'Virtual Account'),
        ('DANA', 'DANA'),
        ('GOPAY', 'GoPay'),
        ('SHOPEEPAY', 'ShopeePay'),
        ('OVO', 'OVO'),
    ]

    order_number = models.CharField(max_length=30, unique=True, editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='TRANSFER')

    shipping_address = models.TextField(blank=True, help_text="Alamat pengiriman Mitra")
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    # Timestamps per status
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    preparing_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    # External system reference
    external_order_id = models.CharField(max_length=100, blank=True, help_text="ID from samdenidimsum system")

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self._generate_order_number()
        # Recalculate total
        self.total_amount = self.subtotal + self.shipping_cost
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_order_number():
        from django.utils import timezone
        import random
        today = timezone.now().strftime('%Y%m%d')
        rand = random.randint(1000, 9999)
        return f"RST-{today}-{rand}"

    def __str__(self):
        return f"{self.order_number} ({self.get_status_display()})"


class RestockOrderItem(models.Model):
    """Individual item within a restock order."""
    order = models.ForeignKey(RestockOrder, on_delete=models.CASCADE, related_name='items')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.PROTECT, related_name='restock_items')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, help_text="Unit snapshot from ingredient")
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Harga per unit dari HQ")

    @property
    def line_total(self):
        return self.quantity * self.unit_price

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.quantity} {self.unit} of {self.ingredient.name}"


class Payment(models.Model):
    """
    Payment record for a RestockOrder.
    Uses AI (Gemini Vision) to automatically verify payment proof images.
    """
    VERIFICATION_STATUS_CHOICES = [
        ('PENDING', 'Menunggu Bukti'),
        ('PROCESSING', 'Memverifikasi'),
        ('VERIFIED', 'Terverifikasi'),
        ('REJECTED', 'Ditolak'),
        ('MANUAL_REVIEW', 'Perlu Review Manual'),
        ('EXPIRED', 'Kedaluwarsa'),
    ]

    order = models.OneToOneField(RestockOrder, on_delete=models.CASCADE, related_name='payment')
    payment_code = models.CharField(max_length=30, unique=True, editable=False)

    # Payment proof
    payment_proof = models.ImageField(upload_to='payment_proofs/', blank=True, null=True)
    payment_proof_uploaded_at = models.DateTimeField(null=True, blank=True)

    # Expiry
    expires_at = models.DateTimeField(help_text="Payment must be made before this time")

    # AI Verification
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='PENDING')
    verification_result = models.JSONField(default=dict, blank=True, help_text="AI analysis result")
    verification_confidence = models.IntegerField(default=0, help_text="AI confidence 0-100%")
    rejection_reason = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.payment_code:
            self.payment_code = self._generate_payment_code()
        # Compress proof image
        if self.payment_proof and hasattr(self.payment_proof, 'file'):
            from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
            if isinstance(self.payment_proof.file, (InMemoryUploadedFile, TemporaryUploadedFile)):
                from core.utils import compress_image
                self.payment_proof = compress_image(self.payment_proof)
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_payment_code():
        from django.utils import timezone
        import random
        today = timezone.now().strftime('%Y%m%d')
        rand = random.randint(1000, 9999)
        return f"PAY-{today}-{rand}"

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at and self.verification_status not in ('VERIFIED',)

    def __str__(self):
        return f"{self.payment_code} ({self.get_verification_status_display()})"
