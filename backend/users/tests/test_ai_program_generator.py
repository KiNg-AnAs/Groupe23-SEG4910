# users/tests/test_ai_program_generator.py
import json
from types import SimpleNamespace
import pytest
from unittest.mock import patch
from django.urls import reverse, NoReverseMatch
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from ai_program_generator.views import generate_ai_program
from users.models import User, UserProfile

def _mk_auth(email="buyer@example.com", sub="auth0|buyer"):
    return SimpleNamespace(is_authenticated=True, payload={"email": email, "sub": sub})

def _rev_or(name: str, fallback: str) -> str:
    try:
        return reverse(name)
    except NoReverseMatch:
        return fallback

# --- Use the **real URL** from backend/urls.py ---
# path("api/program/generate", generate_ai_program, name="generate_training_program")

@pytest.mark.django_db
def test_generate_ai_program_user_not_found():
    client = APIClient()
    client.force_authenticate(user=_mk_auth(email="ghost@example.com", sub="auth0|ghost"))

    url = _rev_or("generate_training_program", "/api/program/generate")
    res = client.get(url)

    assert res.status_code == 404
    assert res.data.get("error") == "User not found"

@pytest.mark.django_db
def test_generate_ai_program_profile_missing():
    user = User.objects.create(
        auth0_id="auth0|noprof",
        email="noprof@example.com",
        username="noprof",
        role="user",
        subscription_plan="none",
    )
    client = APIClient()
    client.force_authenticate(user=_mk_auth(email=user.email, sub=user.auth0_id))

    url = _rev_or("generate_training_program", "/api/program/generate")
    res = client.get(url)

    assert res.status_code == 400
    assert "profile" in res.data.get("error", "").lower()

@pytest.mark.django_db
@patch("ai_program_generator.views.genai.GenerativeModel")
def test_generate_ai_program_empty_text_returns_502(MockGenModel):
    user = User.objects.create(
        auth0_id="auth0|empty",
        email="empty@example.com",
        username="empty",
        role="user",
        subscription_plan="none",
    )
    UserProfile.objects.create(
        user=user,
        age=25,
        height_cm=170,
        weight_kg=65,
        fitness_level="beginner",
        primary_goal="fat_loss",
        workout_frequency="3x_week",
        daily_activity_level="sedentary",
        sleep_hours=7,
        body_type="ectomorph",
        body_fat_percentage=20,
    )

    instance = MockGenModel.return_value
    instance.generate_content.return_value = SimpleNamespace(text="")

    client = APIClient()
    client.force_authenticate(user=_mk_auth(email=user.email, sub=user.auth0_id))

    url = _rev_or("generate_training_program", "/api/program/generate")
    res = client.get(url)

    assert res.status_code == 502
    assert "empty response" in res.data.get("error", "").lower()

@pytest.mark.django_db
@patch("ai_program_generator.views.genai.GenerativeModel")
def test_generate_ai_program_success(MockGenModel):
    user = User.objects.create(
        auth0_id="auth0|ok",
        email="ok@example.com",
        username="ok",
        role="user",
        subscription_plan="none",
    )
    UserProfile.objects.create(
        user=user,
        age=30,
        height_cm=180,
        weight_kg=78,
        fitness_level="intermediate",
        primary_goal="muscle_gain",
        workout_frequency="5x_week",
        daily_activity_level="active",
        sleep_hours=8,
        body_type="mesomorph",
        body_fat_percentage=15,
    )

    instance = MockGenModel.return_value
    instance.generate_content.return_value = SimpleNamespace(text="### 7-Day Program\n- Day 1: ...")

    client = APIClient()
    client.force_authenticate(user=_mk_auth(email=user.email, sub=user.auth0_id))

    url = _rev_or("generate_training_program", "/api/program/generate")
    res = client.get(url)

    assert res.status_code == 200
    assert res.data.get("program", "").startswith("### 7-Day Program")

@pytest.mark.django_db
@patch("ai_program_generator.views.genai.GenerativeModel")
def test_generate_ai_program_model_raises_returns_500(MockGenModel):
    user = User.objects.create(
        auth0_id="auth0|err",
        email="err@example.com",
        username="err",
        role="user",
        subscription_plan="none",
    )
    UserProfile.objects.create(
        user=user,
        age=22,
        height_cm=172,
        weight_kg=60,
        fitness_level="beginner",
        primary_goal="endurance",
        workout_frequency="4x_week",
        daily_activity_level="moderate",
        sleep_hours=7,
    )

    instance = MockGenModel.return_value
    instance.generate_content.side_effect = Exception("boom")

    client = APIClient()
    client.force_authenticate(user=_mk_auth(email=user.email, sub=user.auth0_id))

    url = _rev_or("generate_training_program", "/api/program/generate")
    res = client.get(url)

    assert res.status_code == 500
    assert "boom" in res.data.get("error", "").lower()
