from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sales", "0004_orderitem_modifiers_snapshot_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="cash_received",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="Nominal tunai diterima dari pelanggan (khusus pembayaran CASH)",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="change_amount",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Nominal kembalian untuk pembayaran CASH",
            ),
        ),
    ]
