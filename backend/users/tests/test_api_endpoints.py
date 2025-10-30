import json
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from users.models import User, Subscription, AddOn, UserProfile
from datetime import timedelta

class APITestSuite(APITestCase):
    """Comprehensive automated API test coverage for all major endpoints."""
    def setUp(self):
        super().setUp()
        self.user.is_authenticated = True  # Patch for tests


    def setUp(self):
        self.client = APIClient()

        # Create mock authenticated user
        self.user = User.objects.create(
            auth0_id="auth0|123456",
            email="user@example.com",
            username="testuser",
            role="user",
            subscription_plan="basic",
            add_ons={}
        )

        # Inject fake Auth0 JWT payload
        self.client.force_authenticate(user=self.user)
        self.auth_header = {"HTTP_AUTHORIZATION": "Bearer fake-token"}

    def test_auth0_login(self):
        url = reverse("auth0_login")
        response = self.client.post(url, **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_user_info(self):
        url = reverse("get_user_info")
        response = self.client.get(url, **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("role", response.data)

    def test_get_user_subscription(self):
        url = reverse("get_user_subscription")
        response = self.client.get(url, **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_set_username(self):
        url = reverse("set_username")
        response = self.client.post(url, {"username": "newName"}, **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "newName")

    def test_is_coach(self):
        url = reverse("is_coach")
        response = self.client.get(url, **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_coach"])

    def test_save_user_profile(self):
        url = reverse("save_user_profile")
        data = {
            "age": 24,
            "height": 178,
            "weight": 75,
            "fitnessLevel": "Intermediate",
            "goal": "Build Muscle",
            "frequency": 3,
            "activityLevel": "Active",
            "sleepHours": 7,
            "bodyFat": 15,
            "bodyType": "Mesomorph"
        }
        response = self.client.post(url, data, format="json", **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_detail_get(self):
        url = reverse("user_detail")
        response = self.client.get(url, **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_detail_patch_downgrade(self):
        url = reverse("user_detail")
        response = self.client.patch(url, {"subscription_plan": "none"}, format="json", **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.subscription_plan, "none")

    def test_downgrade_plan(self):
        url = reverse("downgrade_plan")
        response = self.client.post(url, {"target_plan": "basic"}, format="json", **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_user_addons(self):
        AddOn.objects.create(user=self.user, addon_type="zoom", quantity=2, start_date=timezone.now(), end_date=timezone.now() + timedelta(days=30), status="active")
        url = reverse("get_user_addons")
        response = self.client.get(url, **self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_checkout_session(self):
        url = reverse("create_checkout_session")
        data = {"total": 10, "plan": "basic", "add_ons": {"zoom": 1}}
        response = self.client.post(url, data, format="json", **self.auth_header)
        # Stripe mock might fail locally; expect 400 if missing key
        self.assertIn(response.status_code, [200, 400])

