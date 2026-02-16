import uuid
from django.db import models
from django.utils import timezone


class Expense(models.Model):
    """
    Model untuk mencatat pengeluaran operasional harian Mitra.
    Contoh: Beli Gas LPG, Bahan Baku Darurat, Kemasan, dll.
    """

    class Category(models.TextChoices):
        GAS = 'GAS', 'Gas LPG'
        BAHAN_DARURAT = 'BAHAN_DARURAT', 'Bahan Baku Darurat'
        PACKAGING = 'PACKAGING', 'Kemasan & Packaging'
        TRANSPORT = 'TRANSPORT', 'Transportasi'
        MAINTENANCE = 'MAINTENANCE', 'Perawatan Alat'
        LAINNYA = 'LAINNYA', 'Lainnya'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mitra = models.ForeignKey(
        'users.Mitra',
        on_delete=models.CASCADE,
        related_name='expenses'
    )
    amount = models.PositiveIntegerField(
        help_text="Jumlah pengeluaran dalam Rupiah"
    )
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.LAINNYA
    )
    description = models.CharField(
        max_length=255,
        help_text="Deskripsi singkat pengeluaran"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Catatan tambahan (opsional)"
    )
    proof_image = models.ImageField(
        upload_to='expenses/proofs/',
        blank=True,
        null=True,
        help_text="Foto bukti pengeluaran (struk/nota)"
    )
    date = models.DateField(
        default=timezone.now,
        help_text="Tanggal pengeluaran"
    )
    shift = models.ForeignKey(
        'sales.Shift',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses',
        help_text="Shift saat pengeluaran dicatat (opsional)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = 'Expense'
        verbose_name_plural = 'Expenses'

    def __str__(self):
        return f"{self.get_category_display()} - Rp {self.amount:,} ({self.date})"
