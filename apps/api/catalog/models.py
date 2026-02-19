from django.db import models
from django.utils.text import slugify
from core.utils import compress_image


class Category(models.Model):
    """Product category for menu grouping."""
    
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide icon name")
    color = models.CharField(max_length=50, blank=True, null=True, help_text="Tailwind color identifier (e.g., orange, blue, purple)")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['order', 'name']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """Product/menu item for POS."""
    
    name = models.CharField(max_length=200)
    description = models.TextField(
        blank=True, 
        null=True,
        help_text="Deskripsi menu, contoh: 1 Pc Ayam + Nasi + Es Teh"
    )
    price = models.PositiveIntegerField(help_text="Price in IDR")
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    category = models.ForeignKey(
        Category, 
        on_delete=models.PROTECT,
        related_name='products'
    )
    
    # Inventory tracking
    track_inventory = models.BooleanField(
        default=False,
        help_text="True = Barang Jadi (track stock), False = Racikan (use recipe)"
    )
    current_stock = models.PositiveIntegerField(
        default=0,
        help_text="Stock count for 'Barang Jadi' products"
    )
    
    # Availability
    is_available = models.BooleanField(default=True)
    
    # Ordering
    order = models.PositiveIntegerField(default=0, help_text="Order within category")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category__order', 'order', 'name']

    def save(self, *args, **kwargs):
        # Compress image if it's new or changed (though hard to detect change easily without fetching)
        # For simplicity, we can check if self.pk is None (new) or just always try compressing
        # if it's a file upload ( InMemoryUploadedFile ).
        
        if self.image:
             # Check if it's an uploaded file (not just a path string from DB)
             if hasattr(self.image, 'file'):
                 # Avoid re-compressing if already compressed?
                 # compress_image handles this by checking if it's an image file.
                 # But we should be careful not to re-compress on every save if not changed.
                 # A simple check is if it is an instance of InMemoryUploadedFile or TemporaryUploadedFile
                 from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
                 if isinstance(self.image.file, (InMemoryUploadedFile, TemporaryUploadedFile)):
                     self.image = compress_image(self.image)
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    @property
    def stock_status(self) -> dict:
        """Return stock status for API response."""
        if self.track_inventory:
            return {
                'is_tracked': True,
                'remaining': self.current_stock,
                'available': self.current_stock > 0 and self.is_available
            }
        else:
            # For racikan/composite products, availability is manual
            # TODO: Check ingredient availability via inventory.selectors
            return {
                'is_tracked': False,
                'available': self.is_available
            }


class ProductVariant(models.Model):
    """
    Varian produk, contoh: Size (Regular, Large).
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=100)
    price_adjustment = models.IntegerField(default=0, help_text="Tambahan harga dalam Rupiah")
    sku = models.CharField(max_length=50, blank=True, null=True)
    
    def __str__(self):
        return f"{self.product.name} - {self.name}"


class ModifierGroup(models.Model):
    """
    Grup modifier, contoh: Topping, Level Pedas.
    """
    name = models.CharField(max_length=100)
    products = models.ManyToManyField(Product, related_name='modifier_groups', blank=True)
    min_selection = models.PositiveIntegerField(default=0)
    max_selection = models.PositiveIntegerField(default=1)
    
    def __str__(self):
        return self.name


class ModifierOption(models.Model):
    """
    Opsi modifier, contoh: Keju, Pedas Level 1.
    """
    group = models.ForeignKey(ModifierGroup, on_delete=models.CASCADE, related_name='options')
    name = models.CharField(max_length=100)
    price_adjustment = models.IntegerField(default=0)
    
    # Inventory Link
    ingredient = models.ForeignKey(
        'inventory.Ingredient',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='modifier_options',
        help_text="Ingredient used for this modifier (e.g., Keju -> Keju Block)"
    )
    quantity_required = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=0,
        help_text="Amount of ingredient used per selection"
    )
    
    def __str__(self):
        return self.name


class ProductAvailability(models.Model):
    """
    Pivot table for per-Mitra product availability.
    Status is CACHED and updated automatically via signals from IngredientStock.
    """
    mitra = models.ForeignKey('users.Mitra', on_delete=models.CASCADE, related_name='product_availabilities')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='mitra_availabilities')
    is_available = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('mitra', 'product')
        verbose_name_plural = "Product Availabilities"

    def __str__(self):
        status = "Available" if self.is_available else "Unavailable"
        return f"{self.product.name} ({self.mitra.user.username}): {status}"


class ModifierAvailability(models.Model):
    """
    Pivot table for per-Mitra modifier option availability.
    Status is MANUALLY toggled by Mitra.
    """
    mitra = models.ForeignKey('users.Mitra', on_delete=models.CASCADE, related_name='modifier_availabilities')
    modifier_option = models.ForeignKey(ModifierOption, on_delete=models.CASCADE, related_name='mitra_availabilities')
    is_available = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('mitra', 'modifier_option')
        verbose_name_plural = "Modifier Availabilities"

    def __str__(self):
        status = "Available" if self.is_available else "Unavailable"
        return f"{self.modifier_option.name} ({self.mitra.user.username}): {status}"

