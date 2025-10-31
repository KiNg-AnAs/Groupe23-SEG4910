"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from users.views import (
    get_user_info,
    get_user_subscription,
    set_username,
    is_coach,
    auth0_login,
    save_user_profile,
    user_detail,
    downgrade_plan,
    get_user_addons,
)
from ai_program_generator.views import generate_ai_program

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/program/generate", generate_ai_program, name="generate_training_program"),
    path('user-info/', get_user_info, name='user-info'),
    path('user-subscription/', get_user_subscription, name='user-subscription'),
    path('set-username/', set_username, name='set-username'),
    path('is-coach/', is_coach, name='is-coach'),
    path('auth0-login/', auth0_login, name='auth0-login'),
    path('save-profile/', save_user_profile, name='save-profile'),
    path('user-detail/', user_detail, name='user-detail'),
    path("downgrade-plan/", downgrade_plan, name="downgrade-plan"),
    path('user-addons/', get_user_addons, name='user-addons'),
]
