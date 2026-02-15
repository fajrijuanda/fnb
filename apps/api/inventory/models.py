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

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.current_stock} {self.unit})"


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
