from django.core.management.base import BaseCommand
from users.models import User, AddOn, CoachTrainingProgress

class Command(BaseCommand):
    help = "Sync all active AI AddOns to CoachTrainingProgress table"

    def handle(self, *args, **kwargs):
        coach = User.objects.filter(role="coach").first()
        if not coach:
            self.stdout.write(self.style.ERROR("No coach found. Create one first."))
            return

        ai_addons = AddOn.objects.filter(addon_type="ai", status="active")

        count = 0
        for addon in ai_addons:
            if not hasattr(addon, "training_progress"):
                CoachTrainingProgress.objects.create(
                    user=addon.user,
                    coach=coach,
                    addon=addon,
                    status="Pending",
                    notes=""
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f"Synced {count} AI add-ons."))
