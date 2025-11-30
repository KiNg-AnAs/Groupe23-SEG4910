# ai_program_generator/models.py
from django.db import models
from users.models import User
import json


class AIProgram(models.Model):
    """
    Represents a complete AI-generated fitness program for a user.
    One user can have multiple programs (history), but typically one is "active".
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ai_programs")

    # Program Summary
    goal = models.CharField(max_length=255, help_text="e.g. 'Build Muscle Mass'")
    difficulty = models.CharField(
        max_length=20,
        choices=[
            ("beginner", "Beginner"),
            ("intermediate", "Intermediate"),
            ("advanced", "Advanced"),
        ],
        default="beginner"
    )

    # Metadata
    is_active = models.BooleanField(
        default=True,
        help_text="Only one program should be active per user at a time"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    # Backup: store the full raw JSON for debugging/future use
    raw_json = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "is_active"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.goal} ({self.difficulty})"

    def deactivate_other_programs(self):
        """Ensure only this program is active for the user."""
        AIProgram.objects.filter(user=self.user, is_active=True).exclude(id=self.id).update(is_active=False)

    def save(self, *args, **kwargs):
        if self.is_active:
            # Deactivate all other programs for this user before saving
            AIProgram.objects.filter(user=self.user, is_active=True).update(is_active=False)
        super().save(*args, **kwargs)


class ProgramDay(models.Model):
    """
    Represents one day in the 7-day program.
    Each day has a focus (e.g., 'Upper Body') and may be a rest day.
    """
    program = models.ForeignKey(AIProgram, on_delete=models.CASCADE, related_name="days")

    day_number = models.IntegerField(help_text="1-7 for Mon-Sun")
    day_name = models.CharField(
        max_length=20,
        choices=[
            ("Monday", "Monday"),
            ("Tuesday", "Tuesday"),
            ("Wednesday", "Wednesday"),
            ("Thursday", "Thursday"),
            ("Friday", "Friday"),
            ("Saturday", "Saturday"),
            ("Sunday", "Sunday"),
        ]
    )
    focus = models.CharField(max_length=100, help_text="e.g., 'Upper Body Strength', 'Cardio'")
    is_rest_day = models.BooleanField(default=False)

    class Meta:
        ordering = ["day_number"]
        unique_together = [["program", "day_number"]]
        indexes = [
            models.Index(fields=["program", "day_number"]),
        ]

    def __str__(self):
        return f"{self.program.user.email} - {self.day_name} ({self.focus})"


class Exercise(models.Model):
    """
    Represents a single exercise within a day's workout session.
    Each exercise has sets, reps, intensity, and optional notes.
    """
    program_day = models.ForeignKey(ProgramDay, on_delete=models.CASCADE, related_name="exercises")

    order = models.IntegerField(default=0, help_text="Order of exercise in the session")
    exercise_name = models.CharField(max_length=200)
    sets = models.IntegerField(default=0, help_text="Number of sets (0 if not applicable)")
    reps = models.CharField(max_length=100, help_text="Rep scheme or duration (e.g., '3x10', '30 seconds')")
    intensity = models.CharField(max_length=100, help_text="e.g., 'moderate', 'RPE 7-8', 'easy pace'")
    notes = models.TextField(blank=True, help_text="Coaching tips or additional info")

    class Meta:
        ordering = ["order"]
        indexes = [
            models.Index(fields=["program_day", "order"]),
        ]

    def __str__(self):
        return f"{self.exercise_name} ({self.program_day.day_name})"