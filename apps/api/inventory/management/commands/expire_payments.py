"""
Management command to cancel expired unpaid payments and their orders.
Run periodically via cron or scheduler:
    python manage.py expire_payments
"""
from django.core.management.base import BaseCommand
from inventory.services import PaymentVerificationService


class Command(BaseCommand):
    help = 'Cancel expired unpaid payments and their associated restock orders.'

    def handle(self, *args, **options):
        count = PaymentVerificationService.cancel_expired_payments()
        self.stdout.write(
            self.style.SUCCESS(f'Successfully cancelled {count} expired order(s).')
        )
