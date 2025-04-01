from django.db import models

# Main User Table (Clients & Coaches)
class User(models.Model):
    auth0_id = models.CharField(max_length=255, unique=True)  # Auth0 User ID
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=50, unique=True, null=True, blank=True)
    role = models.CharField(max_length=10, choices=[("user", "User"), ("coach", "Coach")], default="user")
    subscription_plan = models.CharField(max_length=10, choices=[("none", "None"), ("basic", "Basic"), ("advanced", "Advanced")], default="none")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username or self.email} - {self.role}"

# User Profile (For Clients Only)
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # Core Physical Attributes
    age = models.IntegerField()
    height_cm = models.IntegerField()
    weight_kg = models.FloatField()

    # Fitness & Activity
    fitness_level = models.CharField(max_length=20, choices=[
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced")
    ])
    primary_goal = models.CharField(max_length=50, choices=[
        ("muscle_gain", "Muscle Gain"),
        ("fat_loss", "Fat Loss"),
        ("endurance", "Endurance")
    ])
    workout_frequency = models.CharField(max_length=30, choices=[
        ("1-2x per week", "1-2 times a week"),
        ("3-4x per week", "3-4 times a week"),
        ("5+ per week", "5+ times a week")
    ])
    daily_activity_level = models.CharField(max_length=50, choices=[
        ("sedentary", "Sedentary (Minimal movement)"),
        ("lightly_active", "Lightly Active (Some movement daily)"),
        ("active", "Active (Frequent physical activity)"),
        ("very_active", "Very Active (Intense training or labor)")
    ])

    # Additional Health Data
    sleep_hours = models.IntegerField()
    body_fat_percentage = models.FloatField(null=True, blank=True)
    body_type = models.CharField(max_length=20, choices=[
        ("ectomorph", "Ectomorph (Lean & Slim)"),
        ("mesomorph", "Mesomorph (Athletic & Muscular)"),
        ("endomorph", "Endomorph (Broad & Higher Fat Storage)")
    ], null=True, blank=True)

    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username or self.user.email} Profile"
# Coach Profile (For Coaches Only)
class CoachProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    certifications = models.TextField()
    experience_years = models.IntegerField()
    specialties = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Coach {self.user.username or self.user.email}"

# Subscription Table (For Paid Users)
class Subscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    plan = models.CharField(max_length=10, choices=[("basic", "Basic"), ("advanced", "Advanced")])
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    status = models.CharField(max_length=10, choices=[("active", "Active"), ("expired", "Expired"), ("canceled", "Canceled")])

    def __str__(self):
        return f"{self.user.username or self.user.email} - {self.plan}"
