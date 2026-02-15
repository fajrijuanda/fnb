from django.db import migrations

def set_default_icons(apps, schema_editor):
    Category = apps.get_model('catalog', 'Category')
    
    icon_mapping = {
        'Makanan Berat': 'Utensils',
        'Makanan Ringan': 'Cookie',
        'Minuman': 'Coffee',
        'Snack': 'Candy',
        'Paket': 'Package',
    }
    
    for name, icon in icon_mapping.items():
        Category.objects.filter(name=name, icon='').update(icon=icon)
    
    # Generic fallback for others
    Category.objects.filter(icon='').update(icon='Tag')

def reverse_icons(apps, schema_editor):
    Category = apps.get_model('catalog', 'Category')
    Category.objects.all().update(icon='')

class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0002_product_description'),
    ]

    operations = [
        migrations.RunPython(set_default_icons, reverse_icons),
    ]
