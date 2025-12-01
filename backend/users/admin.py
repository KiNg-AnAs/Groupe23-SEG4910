from django.contrib import admin
from .models import User, UserProfile, CoachProfile, Subscription

admin.site.register(User)
admin.site.register(UserProfile)
admin.site.register(CoachProfile)
admin.site.register(Subscription)

