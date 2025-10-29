from django.core.management.base import BaseCommand
from users.models import User, AddOn
from users.models import CoachBooking 

class Command(BaseCommand):
    help = "Sync all active Zoom AddOns to CoachBooking table"

    def handle(self, *args, **kwargs):
        coach = User.objects.filter(role="coach").first()
        if not coach:
            self.stdout.write(self.style.ERROR("No coach found. Create one first."))
            return

        zoom_addons = AddOn.objects.filter(addon_type="zoom", status="active")

        count = 0
        for addon in zoom_addons:
            # Create a pending booking if none exists for this add-on
            if not CoachBooking.objects.filter(addon=addon, status="Pending").exists():
                CoachBooking.objects.create(
                    user=addon.user,
                    coach=coach,
                    addon=addon,
                    status="Pending",
                    scheduled_date=None,
                    completion_date=None,
                    notes=""
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f"Synced {count} Zoom add-ons."))
