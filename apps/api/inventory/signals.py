from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import IngredientStock, RecipeItem
from catalog.models import ProductAvailability

@receiver(post_save, sender=IngredientStock)
def check_product_availability_on_stock_change(sender, instance, **kwargs):
    """
    When IngredientStock changes, re-evaluate availability for all products
    that use this ingredient in their recipe.
    """
    mitra = instance.mitra
    ingredient = instance.ingredient
    
    # Find all recipes using this ingredient
    recipe_items = RecipeItem.objects.filter(ingredient=ingredient).select_related('recipe__product')
    
    for item in recipe_items:
        product = item.recipe.product
        update_product_availability(mitra, product)

def update_product_availability(mitra, product):
    """
    Check if Mitra has enough stock for all ingredients in the product's recipe.
    Update ProductAvailability.is_available.
    """
    # If product doesn't track inventory (is Racikan), check recipe
    if not product.track_inventory:
        if hasattr(product, 'recipe'):
            is_available = True
            
            # Check all ingredients
            for item in product.recipe.items.all():
                try:
                    stock = IngredientStock.objects.get(mitra=mitra, ingredient=item.ingredient)
                    if stock.current_stock < item.quantity_required:
                        is_available = False
                        break
                except IngredientStock.DoesNotExist:
                    # If stock record missing, assume 0 stock -> Unavailable
                    is_available = False
                    break
            
            # Update or Create Availability Record
            ProductAvailability.objects.update_or_create(
                mitra=mitra,
                product=product,
                defaults={'is_available': is_available}
            )
    else:
        # For "Barang Jadi" (Track Inventory directly on Product), 
        # we might need a ProductStock model similar to IngredientStock.
        # But Plan says "current_stock" in ProductAvailability if needed.
        # For now, let's assume we use ProductAvailability.current_stock if we add it?
        # Or just skip "Barang Jadi" logic for now as it wasn't explicitly detailed for auto-calc
        # beyond "Raw Material".
        # User said "availability triggered by raw material amount".
        pass
