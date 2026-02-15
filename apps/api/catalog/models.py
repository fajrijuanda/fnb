from django.db import models
from django.utils.text import slugify


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
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category__order', 'name']
    
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
