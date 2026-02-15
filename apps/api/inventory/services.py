"""
Inventory Services Module
Business logic for stock management.

Following Service Layer Pattern:
- All business logic goes here (NOT in views.py)
- Views only handle request/response
"""
from django.db import transaction
from inventory.models import Ingredient, StockLog

@transaction.atomic
def deduct_stock_for_order(order) -> None:
    """
    Deduct stock after successful payment.
    Accepts an Order instance (which has related items).
    
    Handles two product types:
    - Barang Jadi (track_inventory=True): Deduct product.current_stock
    - Racikan/Composite (track_inventory=False): Deduct ingredients via recipe
    """
    for item in order.items.all():
        product = item.product
        qty_sold = item.quantity

        # Case A: Ready-to-sell Product (e.g., Canned Drink)
        if product.track_inventory:
            # Optional: Enforce stock check
            # if product.current_stock < qty_sold:
            #    raise ValidationError(f"Insufficient stock for {product.name}")
            
            product.current_stock -= qty_sold
            product.save()
            _log_stock_movement(product=product, qty=-qty_sold, reason='SALES', notes=f"Order {order.invoice_number}")

        # Case B: Composite/Recipe Product (e.g., Nasi Goreng)
        # Check if product has a recipe (OneToOne relation)
        elif hasattr(product, 'recipe'):
            recipe = product.recipe
            for recipe_item in recipe.items.all():
                ingredient = recipe_item.ingredient
                # Calculate total ingredient usage: required amount * quantity sold
                usage_amount = recipe_item.quantity_required * qty_sold
                
                ingredient.current_stock -= usage_amount
                ingredient.save()
                _log_stock_movement(
                    ingredient=ingredient, 
                    qty=-usage_amount, 
                    reason='SALES', 
                    notes=f"Order {order.invoice_number} (For {product.name})"
                )


def _log_stock_movement(product=None, ingredient=None, qty=0, reason='SALES', notes="") -> None:
    """
    Internal helper to create stock movement log entry.
    """
    if not product and not ingredient:
        return

    # Determine final stock based on the object provided
    final_stock = 0
    if product:
        final_stock = product.current_stock
    elif ingredient:
        final_stock = ingredient.current_stock

    movement_type = 'OUT' if qty < 0 else 'IN'
    
    StockLog.objects.create(
        product=product,
        ingredient=ingredient,
        change_amount=qty,
        final_stock=final_stock,
        movement_type=movement_type,
        reason=reason,
        notes=notes,
        created_by="System" 
    )

def restock_ingredient(ingredient_id: int, quantity: float, notes: str = "") -> None:
    """Add stock to ingredient (restocking)."""
    with transaction.atomic():
        ingredient = Ingredient.objects.get(pk=ingredient_id)
        ingredient.current_stock += quantity
        ingredient.save()
        _log_stock_movement(
            ingredient=ingredient,
            qty=quantity,
            reason='PURCHASE',
            notes=notes
        )
