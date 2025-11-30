from rest_framework.test import APITestCase, APIClient

from django.urls import reverse
from types import SimpleNamespace
from django.utils import timezone
from datetime import timedelta
from users.models import User, UserProfile, Subscription, AddOn,CoachTrainingProgress, CoachBooking
from rest_framework import status
from rest_framework.test import APIClient
from types import SimpleNamespace
from django.urls import reverse, NoReverseMatch
from types import SimpleNamespace
from unittest.mock import patch, MagicMock, Mock

from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIRequestFactory

from users.authentication import Auth0JSONWebTokenAuthentication
from jose import jwt as jose_jwt

import json
from rest_framework.test import APIClient

from users.models import User, Subscription, AddOn

def _body(res):
    # DRF Response
    if hasattr(res, "data"):
        return res.data
    # Raw Django HttpResponse/JsonResponse
    try:
        content = (res.content or b"").decode("utf-8")
    except Exception:
        content = ""
    if not content:
        return {}
    try:
        import json
        return json.loads(content)
    except Exception:
        # last resort: return a dict with the raw text
        return {"_raw": content}


def _text(res):
    """Lowercased raw text body (covers HTML / plain text error pages)."""
    try:
        return (res.content or b"").decode().lower()
    except Exception:
        return ""

class APITestSuite(APITestCase):
    def _as_auth(self, sub):
        stub = SimpleNamespace(is_authenticated=True, payload={"sub": sub})
        self.client.force_authenticate(user=stub)
    def setUp(self):
        super().setUp()
        from rest_framework.test import APIClient
        self.client = APIClient()

        # client user
        self.user = User.objects.create(
            auth0_id="auth0|123456",
            email="user@example.com",
            username="testuser",
            role="user",
            subscription_plan="basic",
            add_ons={},
        )

        # COACH user for coach-only endpoints
        self.coach = User.objects.create(
            auth0_id="auth0|coach",
            email="coach@example.com",
            username="coach",
            role="coach",
            subscription_plan="none",
            add_ons={},
        )

        # default: act as COACH for coach endpoints
        self._as_auth("auth0|coach")

    def test_auth0_login(self):
        url = reverse("auth0-login")
        res = self.client.post(url, {})
        self.assertIn(res.status_code, [status.HTTP_200_OK,
                                        status.HTTP_201_CREATED,
                                        status.HTTP_204_NO_CONTENT,
                                        status.HTTP_400_BAD_REQUEST])

    def test_get_user_info(self):
        url = reverse("user-info")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("role", res.data)

    def test_get_user_subscription(self):
        url = reverse("user-subscription")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)


    def test_set_username(self):
        self._as_auth("auth0|123456")  # act as the client user
        url = reverse("set-username")
        res = self.client.post(url, {"username": "newName"})
        assert res.status_code == 200
        self.user.refresh_from_db()
        assert self.user.username == "newName"

    def test_is_coach(self):
        url = reverse("is-coach")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("is_coach", res.data)

    def test_save_user_profile(self):
        url = reverse("save-profile")
        # IMPORTANT: match the view's expected camelCase keys
        data = {
            "age": 24,
            "height": 178,                 # not height_cm
            "weight": 75,                  # not weight_kg
            "fitnessLevel": "Intermediate",
            "goal": "Build Muscle",
            "frequency": 3,
            "activityLevel": "Active",
            "sleepHours": 7,
            "bodyFat": 15,
            "bodyType": "Mesomorph",
        }
        res = self.client.post(url, data, format="json")
        self.assertIn(res.status_code, [200, 201, 204])

    def test_user_detail_get(self):
        url = reverse("user-detail")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)


    def test_user_detail_patch_downgrade(self):
        self._as_auth("auth0|123456")  # act as the client user
        url = reverse("user-detail")
        res = self.client.patch(url, {"subscription_plan": "none"}, format="json")
        assert res.status_code == 200
        self.user.refresh_from_db()
        assert self.user.subscription_plan == "none"

    def test_downgrade_plan(self):
        url = reverse("downgrade-plan")
        res = self.client.post(url, {"target_plan": "basic"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_get_user_addons(self):
        AddOn.objects.create(
            user=self.user,
            addon_type="zoom",
            quantity=2,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            status="active",
        )
        url = reverse("user-addons")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_coach_list_clients_404_when_user_missing(self):
        c = APIClient()
        ghost_auth = SimpleNamespace(is_authenticated=True, payload={"sub": "auth0|ghost"})
        c.force_authenticate(user=ghost_auth)

        url = reverse("coach-list-clients")
        res = c.get(url)
        assert res.status_code == 404
        body = _body(res)
        text = _text(res)
        # Accept JSON {"error": "..."} or any error-ish text
        assert ("error" in body) or ("not found" in text or "error" in text)

    def test_auth0_login_bad_payload(self):
        c = APIClient()
        bad_stub = SimpleNamespace(is_authenticated=True, payload={"sub": None, "email": None})
        c.force_authenticate(user=bad_stub)

        url = reverse("auth0-login")
        res = c.post(url, {})
        assert res.status_code == 400

        body = _body(res)
        text = (body.get("error") if isinstance(body, dict) else "") or body.get("_raw", "")
        assert "invalid" in (text or "").lower()

    def test_coach_list_clients_ok_when_coach(self):
        """_require_coach: user is coach -> 200 and structured payload"""
        # Promote test user to coach
        self.user.role = "coach"
        self.user.save()

        # Create two client users + data to exercise aggregation/pagination
        u1 = User.objects.create(
            auth0_id="auth0|u1", email="u1@example.com", username="u1",
            role="user", subscription_plan="basic", add_ons={}
        )
        u2 = User.objects.create(
            auth0_id="auth0|u2", email="alpha@example.com", username="alpha",
            role="user", subscription_plan="none", add_ons={}
        )

        # Active subscription for u1
        Subscription.objects.create(
            user=u1, plan="basic", start_date=timezone.now() - timedelta(days=1),
            end_date=timezone.now() + timedelta(days=29), status="active"
        )

        # Profile for u2 only (exercise optional profile branch)
        UserProfile.objects.create(
            user=u2, age=21, height_cm=175, weight_kg=68,
            fitness_level="intermediate", primary_goal="fat_loss",
            workout_frequency=4, daily_activity_level="active",
            sleep_hours=7, body_fat_percentage=15, body_type="ectomorph"
        )

        # Add-ons: active only count toward summary
        AddOn.objects.create(user=u1, addon_type="zoom", quantity=2,
                             start_date=timezone.now(), end_date=timezone.now()+timedelta(days=30),
                             status="active")
        AddOn.objects.create(user=u1, addon_type="ebook", quantity=1,
                             start_date=timezone.now(), end_date=timezone.now()+timedelta(days=30),
                             status="used")  # used shouldn't be counted
        AddOn.objects.create(user=u2, addon_type="ai", quantity=3,
                             start_date=timezone.now(), end_date=timezone.now()+timedelta(days=30),
                             status="active")

        # Basic call
        url = reverse("coach-list-clients")
        res = self.client.get(url)  # authenticated as self.auth_user
        assert res.status_code == 200
        assert "results" in res.data and "count" in res.data
        assert res.data["count"] >= 2
        # check one row structure quickly
        row = res.data["results"][0]
        for key in ["id", "email", "username", "role", "subscription_plan", "addons", "created_at"]:
            assert key in row

        # Pagination + search branches
        res2 = self.client.get(url, {"limit": "1", "offset": "0"})
        assert res2.status_code == 200
        assert len(res2.data["results"]) == 1

        # Search matches username/email icontains
        res3 = self.client.get(url, {"q": "alpha"})
        assert res3.status_code == 200
        assert any(r["email"] == "alpha@example.com" for r in res3.data["results"])

    # ---------- Tests for auth0_login (created vs existing) ----------

    def test_auth0_login_creates_new_user(self):
        """auth0_login: valid payload, user created => created=True"""
        c = APIClient()
        auth_stub = SimpleNamespace(
            is_authenticated=True,
            payload={"sub": "auth0|newuser", "email": "newuser@example.com"}
        )
        c.force_authenticate(user=auth_stub)

        url = reverse("auth0-login")
        res = c.post(url, {})  # body not used; payload read from request.user.payload
        assert res.status_code == 200
        assert res.data.get("created") is True
        assert User.objects.filter(auth0_id="auth0|newuser").exists()

    def test_auth0_login_existing_user(self):
        """auth0_login: existing user => created=False"""
        # Ensure a user exists for this sub
        User.objects.create(
            auth0_id="auth0|exists", email="exists@example.com",
            username="exists", role="user", subscription_plan="none", add_ons={}
        )
        c = APIClient()
        auth_stub = SimpleNamespace(
            is_authenticated=True,
            payload={"sub": "auth0|exists", "email": "exists@example.com"}
        )
        c.force_authenticate(user=auth_stub)

        url = reverse("auth0-login")
        res = c.post(url, {})
        assert res.status_code == 200
        assert res.data.get("created") is False
# -------------------- coach_update_client_profile --------------------

    def test_coach_update_client_profile_happy(self):
        """PATCH profile + plan -> profile upserted, plan changed, subscription created."""
        url = reverse("coach-update-client-profile", args=[self.user.id])  # adjust name if needed
        payload = {
            "subscription_plan": "pro",
            "age": 21,
            "height_cm": 170,
            "weight_kg": 70,
            "fitness_level": "Intermediate",
            "primary_goal": "build_muscle",
            "workout_frequency": 4,
            "daily_activity_level": "active",
            "sleep_hours": 7,
            "body_fat_percentage": 15,
            "body_type": "mesomorph",
        }
        res = self.client.patch(url, payload, format="json")
        assert res.status_code == 200, _text(res)

        self.user.refresh_from_db()
        assert self.user.subscription_plan == "pro"

        # profile upserted + updated
        prof = UserProfile.objects.filter(user=self.user).first()
        assert prof and prof.age == 21 and prof.height_cm == 170

        # subscription created
        sub = Subscription.objects.filter(user=self.user, plan="pro", status="active").first()
        assert sub is not None

    def test_coach_update_client_profile_404(self):
        url = reverse("coach-update-client-profile", args=[999999])  # adjust name if needed
        res = self.client.patch(url, {"age": 30}, format="json")
        assert res.status_code == 404

    # -------------------- coach_delete_client --------------------

    def test_coach_delete_client_success(self):
        victim = User.objects.create(
            auth0_id="auth0|victim",
            email="victim@example.com",
            username="victim",
            role="user",
            subscription_plan="none",
        )
        url = reverse("coach-delete-client", args=[victim.id])  # adjust name if needed
        res = self.client.delete(url)
        assert res.status_code == 200
        assert not User.objects.filter(id=victim.id).exists()

    def test_coach_delete_client_404(self):
        url = reverse("coach-delete-client", args=[999999])  # adjust name if needed
        res = self.client.delete(url)
        assert res.status_code == 404

    # -------------------- coach_training_list --------------------

    def test_coach_training_list_groups_ai_addons(self):
        AddOn.objects.create(user=self.user, addon_type="ai", quantity=2, status="active")
        other = User.objects.create(
            auth0_id="auth0|other",
            email="other@example.com",
            username="other",
            role="user",
            subscription_plan="none",
        )
        AddOn.objects.create(user=other, addon_type="ai", quantity=1, status="active")

        url = reverse("coach-training-list")
        res = self.client.get(url)
        assert res.status_code == 200
        rows = _body(res)

        # Validate users present
        emails = {r["user_email"] for r in rows}
        assert {"user@example.com", "other@example.com"} <= emails

        # Validate quantities
        qty = {r["user_email"]: r["quantity"] for r in rows}
        assert qty["user@example.com"] == 2
        assert qty["other@example.com"] == 1


    # -------------------- coach_training_update --------------------

    def test_coach_training_update_notes_only_creates_or_updates(self):
        # ensure there's an AI addon so CoachTrainingProgress.addon is not NULL
        AddOn.objects.create(user=self.user, addon_type="ai", quantity=1, status="active")

        url = reverse("coach-training-update", args=[self.user.id])
        res = self.client.patch(url, {"notes": "new note"}, format="json")
        assert res.status_code == 200
        assert "notes updated" in _text(res)

        prog = CoachTrainingProgress.objects.filter(user=self.user, coach=self.coach).first()
        assert prog and prog.notes == "new note"

    def test_coach_training_update_done_decrements_quantity(self):
        # one active AI session
        addon = AddOn.objects.create(user=self.user, addon_type="ai", quantity=1, status="active")
        url = reverse("coach-training-update", args=[self.user.id])
        res = self.client.patch(url, {"status": "Done", "notes": "finished"}, format="json")
        assert res.status_code == 200
        body = _body(res)
        assert body.get("remaining_quantity") == 0
        assert body.get("status") == "Done"

        addon.refresh_from_db()
        assert addon.quantity == 0 and addon.status == "used"

    def test_coach_training_update_done_no_addon_400(self):
        url = reverse("coach-training-update", args=[self.user.id])
        res = self.client.patch(url, {"status": "Done"}, format="json")
        assert res.status_code == 400

    # -------------------- coach_list_bookings --------------------

    def test_coach_list_bookings_aggregates_zoom_and_latest_booking(self):
        zoom = AddOn.objects.create(user=self.user, addon_type="zoom", quantity=2, status="active")
        CoachBooking.objects.create(
            user=self.user, coach=self.coach, addon=zoom, status="Pending", notes="init"
        )

        url = reverse("coach-list-bookings")
        res = self.client.get(url)
        assert res.status_code == 200
        rows = _body(res)
        row = next(r for r in rows if r["user_email"] == "user@example.com")
        assert row["quantity"] == 2
        assert row["status"] in {"Pending", "Completed"}

    # -------------------- coach_update_booking --------------------

    def test_coach_update_booking_complete_flow(self):
        addon = AddOn.objects.create(user=self.user, addon_type="zoom", quantity=1, status="active")
        url = reverse("coach-update-booking", args=[self.user.id])
        res = self.client.patch(
            url, {"status": "Completed", "notes": "done", "scheduled_date": "2025-10-31"}, format="json"
        )
        assert res.status_code == 200
        body = _body(res)
        assert body.get("remaining_quantity") == 0
        assert body.get("status") == "Completed"

        addon.refresh_from_db()
        assert addon.quantity == 0 and addon.status == "used"

        booking = CoachBooking.objects.filter(user=self.user, coach=self.coach).first()
        assert booking and booking.status == "Completed" and booking.notes == "done"

    def test_coach_update_booking_no_addon_400(self):
        url = reverse("coach-update-booking", args=[self.user.id])
        res = self.client.patch(url, {"status": "Completed"}, format="json")
        assert res.status_code == 400

import pytest
from django.urls import reverse, NoReverseMatch

def _mk_auth(email="buyer@example.com", sub="auth0|buyer"):
    return SimpleNamespace(is_authenticated=True, payload={"email": email, "sub": sub})

def _rev_or(name: str, fallback: str) -> str:
    """Try reverse(name), otherwise use fallback literal path."""
    try:
        return reverse(name)
    except NoReverseMatch:
        return fallback


# 1) create_checkout_session: happy path
@pytest.mark.django_db
@patch("users.views.stripe.checkout.Session.create")
def test_create_checkout_session_ok(mock_create):
    # Arrange
    client = APIClient()
    user = User.objects.create(
        auth0_id="auth0|buyer", email="buyer@example.com",
        username="buyer", role="user", subscription_plan="none"
    )
    client.force_authenticate(user=_mk_auth(email=user.email, sub=user.auth0_id))

    fake_session = SimpleNamespace(url="https://stripe.test/checkout/abc123")
    mock_create.return_value = fake_session

    body = {"total": 12.34, "plan": "basic", "add_ons": {"ai": 2, "ebook": 1}}

    # Act
    url = reverse("create-checkout-session")
    res = client.post(url, body, format="json")

    # Assert
    assert res.status_code == 200
    assert res.data.get("url") == fake_session.url

    # Verify key args passed to Stripe
    args, kwargs = mock_create.call_args
    md = kwargs["metadata"]
    assert md["auth0_id"] == user.auth0_id
    assert md["email"] == user.email
    assert md["plan"] == "basic"
    assert json.loads(md["add_ons"]) == {"ai": 2, "ebook": 1}
    assert md["billing_period"] == "monthly"  # because plan in ["basic","advanced"]
    assert kwargs["customer_email"] == user.email
    # unit_amount is cents
    assert kwargs["line_items"][0]["price_data"]["unit_amount"] == int(12.34 * 100)


# 2) create_checkout_session: Stripe error -> 400
@pytest.mark.django_db
@patch("users.views.stripe.checkout.Session.create", side_effect=Exception("boom"))
def test_create_checkout_session_error_400(mock_create):
    client = APIClient()
    client.force_authenticate(user=_mk_auth())
    url = reverse("create-checkout-session")
    res = client.post(url, {"total": 5, "plan": "none", "add_ons": {}}, format="json")
    assert res.status_code == 400
    assert "error" in (res.data if hasattr(res, "data") else res.json())


# 3) stripe_webhook: invalid signature -> 400
@pytest.mark.django_db
@patch("users.views.settings.STRIPE_WEBHOOK_SECRET", "whsec_test")
@patch("users.views.stripe.Webhook.construct_event", side_effect=ValueError("bad sig"))
def test_stripe_webhook_invalid_signature(mock_construct):
    client = APIClient()
    url = _rev_or("stripe-webhook", "/stripe-webhook/")
    # raw body + missing/invalid header -> construct_event raises
    res = client.post(url, data=b"{}", content_type="application/json")
    assert res.status_code == 400


# 4) stripe_webhook: completed but no user -> 200 (noop)
@pytest.mark.django_db
@patch("users.views.settings.STRIPE_WEBHOOK_SECRET", "whsec_test")
@patch("users.views.stripe.Webhook.construct_event")
def test_stripe_webhook_completed_no_user_ok(mock_construct):
    event = {
        "type": "checkout.session.completed",
        "data": {"object": {
            "customer_email": "ghost@example.com",
            "metadata": {"email": "ghost@example.com", "auth0_id": "", "plan": "basic", "add_ons": '{"ai":1}'}
        }},
    }
    mock_construct.return_value = event

    client = APIClient()
    url = _rev_or("stripe-webhook", "/stripe-webhook/")
    res = client.post(url, data=b"{}", content_type="application/json")
    assert res.status_code == 200  # quietly ignores if user not found


# 5) stripe_webhook: completed, updates plan + add-ons (ebook unique rule)
@pytest.mark.django_db
@patch("users.views.settings.STRIPE_WEBHOOK_SECRET", "whsec_test")
@patch("users.views.stripe.Webhook.construct_event")
def test_stripe_webhook_completed_updates_user(mock_construct):
    user = User.objects.create(
        auth0_id="auth0|buyer", email="buyer@example.com",
        username="buyer", role="user", subscription_plan="none", add_ons={}
    )
    # Pre-existing active subscription to ensure it gets expired
    Subscription.objects.create(
        user=user, plan="basic", start_date=timezone.now() - timezone.timedelta(days=30),
        end_date=timezone.now() + timezone.timedelta(days=1), status="active"
    )
    # Pre-existing active ebook to test "don’t create duplicates"
    AddOn.objects.create(user=user, addon_type="ebook", quantity=1, status="active")

    # Webhook payload: upgrade to advanced + add Zoom(2), AI(3), ebook(1)
    meta = {
        "auth0_id": user.auth0_id,
        "email": user.email,
        "plan": "advanced",
        "billing_period": "monthly",
        "add_ons": json.dumps({"zoom": 2, "ai": 3, "ebook": 1}),
    }
    event = {"type": "checkout.session.completed", "data": {"object": {"metadata": meta}}}
    mock_construct.return_value = event

    client = APIClient()
    url = _rev_or("stripe-webhook", "/stripe-webhook/")
    res = client.post(url, data=b"{}", content_type="application/json")
    assert res.status_code == 200

    # Assertions: subscription
    user.refresh_from_db()
    assert user.subscription_plan == "advanced"
    assert Subscription.objects.filter(user=user, status="active", plan="advanced").exists()
    assert not Subscription.objects.filter(user=user, status="active", plan="basic").exists()

    # Assertions: add-ons
    # ebook should NOT be duplicated
    assert AddOn.objects.filter(user=user, addon_type="ebook").count() == 1
    # zoom and ai created with requested quantities
    zoom_total = sum(a.quantity for a in AddOn.objects.filter(user=user, addon_type="zoom"))
    ai_total = sum(a.quantity for a in AddOn.objects.filter(user=user, addon_type="ai"))
    assert zoom_total == 2
    assert ai_total == 3

    assert user.add_ons.get("zoom") == 2
    assert user.add_ons.get("ai") == 3
    assert user.add_ons.get("ebook") in (None, 1)


# 6) stripe_webhook: DB error during atomic -> 500
@pytest.mark.django_db
@patch("users.views.settings.STRIPE_WEBHOOK_SECRET", "whsec_test")
@patch("users.views.AddOn.objects.create", side_effect=Exception("DB fail"))
@patch("users.views.stripe.Webhook.construct_event")
def test_stripe_webhook_db_error_returns_500(mock_construct, _mock_create):
    user = User.objects.create(
        auth0_id="auth0|buyer", email="buyer@example.com",
        username="buyer", role="user", subscription_plan="none", add_ons={}
    )
    meta = {
        "auth0_id": user.auth0_id,
        "email": user.email,
        "plan": "basic",
        "billing_period": "monthly",
        "add_ons": json.dumps({"zoom": 1}),
    }
    event = {"type": "checkout.session.completed", "data": {"object": {"metadata": meta}}}
    mock_construct.return_value = event

    client = APIClient()
    url = _rev_or("stripe-webhook", "/stripe-webhook/")
    res = client.post(url, data=b"{}", content_type="application/json")
    assert res.status_code == 500

# ---------- helpers ----------
def _auth_header(token="tok123"):
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

# ---------- authenticate() unit tests ----------

def test_authenticate_success_returns_user_and_token():
    factory = APIRequestFactory()
    req = factory.get("/anything", **_auth_header("abc.xyz.123"))

    auth = Auth0JSONWebTokenAuthentication()
    with patch.object(auth, "verify_jwt", return_value={"sub": "auth0|u1", "email": "u1@example.com"}):
        user, token = auth.authenticate(req)

    assert token == "abc.xyz.123"
    assert user.is_authenticated is True
    assert user.payload["sub"] == "auth0|u1"
    assert user.payload["email"] == "u1@example.com"
    # __getattr__ passthrough
    assert getattr(user, "email") == "u1@example.com"


def test_authenticate_no_header_returns_none():
    factory = APIRequestFactory()
    req = factory.get("/no-auth-header")

    auth = Auth0JSONWebTokenAuthentication()
    assert auth.authenticate(req) is None


def test_authenticate_malformed_header_raises():
    factory = APIRequestFactory()
    # Will split to ["Bearer"] and then access [1] -> IndexError => wrapped into AuthenticationFailed
    req = factory.get("/bad-auth", HTTP_AUTHORIZATION="Bearer")

    auth = Auth0JSONWebTokenAuthentication()
    with pytest.raises(AuthenticationFailed) as exc:
        auth.authenticate(req)

    assert "JWT Authentication failed" in str(exc.value)


# ---------- verify_jwt() unit tests ----------

def test_verify_jwt_success_builds_rsa_key_and_decodes():
    # Arrange JWKS with a matching kid
    jwks = {"keys": [{"kid": "abc", "kty": "RSA", "use": "sig", "n": "modulusN", "e": "AQAB"}]}
    token = "header.payload.sig"

    with patch("users.authentication.requests.get") as mock_get, \
         patch("users.authentication.jwt.get_unverified_header", return_value={"kid": "abc"}) as mock_hdr, \
         patch("users.authentication.jwt.decode", return_value={"ok": True}) as mock_decode:

        mock_get.return_value = MagicMock(json=lambda: jwks)

        auth = Auth0JSONWebTokenAuthentication()
        payload = auth.verify_jwt(token)

    assert payload == {"ok": True}
    mock_get.assert_called_once()  # fetched JWKS
    mock_hdr.assert_called_once_with(token)
    # ensure decode received the reconstructed RSA key and expected params
    args, kwargs = mock_decode.call_args
    assert args[0] == token
    assert isinstance(args[1], dict) and args[1]["kid"] == "abc"
    assert kwargs["algorithms"] == ["RS256"]
    assert "audience" in kwargs and "issuer" in kwargs


def test_verify_jwt_no_matching_kid_raises():
    jwks = {"keys": [{"kid": "other", "kty": "RSA", "use": "sig", "n": "N", "e": "AQAB"}]}
    token = "t"

    with patch("users.authentication.requests.get", return_value=MagicMock(json=lambda: jwks)), \
         patch("users.authentication.jwt.get_unverified_header", return_value={"kid": "abc"}):
        auth = Auth0JSONWebTokenAuthentication()
        with pytest.raises(AuthenticationFailed) as exc:
            auth.verify_jwt(token)

    assert "No valid key found" in str(exc.value)


def test_verify_jwt_expired_signature_raises():
    jwks = {"keys": [{"kid": "abc", "kty": "RSA", "use": "sig", "n": "N", "e": "AQAB"}]}
    token = "t"

    with patch("users.authentication.requests.get", return_value=MagicMock(json=lambda: jwks)), \
         patch("users.authentication.jwt.get_unverified_header", return_value={"kid": "abc"}), \
         patch("users.authentication.jwt.decode", side_effect=jose_jwt.ExpiredSignatureError()):
        auth = Auth0JSONWebTokenAuthentication()
        with pytest.raises(AuthenticationFailed) as exc:
            auth.verify_jwt(token)

    assert "Token has expired" in str(exc.value)


def test_verify_jwt_claims_error_raises():
    jwks = {"keys": [{"kid": "abc", "kty": "RSA", "use": "sig", "n": "N", "e": "AQAB"}]}
    token = "t"

    with patch("users.authentication.requests.get", return_value=MagicMock(json=lambda: jwks)), \
         patch("users.authentication.jwt.get_unverified_header", return_value={"kid": "abc"}), \
         patch("users.authentication.jwt.decode", side_effect=jose_jwt.JWTClaimsError("bad claims")):
        auth = Auth0JSONWebTokenAuthentication()
        with pytest.raises(AuthenticationFailed) as exc:
            auth.verify_jwt(token)

    assert "Invalid claims" in str(exc.value)


def test_verify_jwt_generic_error_raises():
    jwks = {"keys": [{"kid": "abc", "kty": "RSA", "use": "sig", "n": "N", "e": "AQAB"}]}
    token = "t"

    with patch("users.authentication.requests.get", return_value=MagicMock(json=lambda: jwks)), \
         patch("users.authentication.jwt.get_unverified_header", return_value={"kid": "abc"}), \
         patch("users.authentication.jwt.decode", side_effect=Exception("boom")):
        auth = Auth0JSONWebTokenAuthentication()
        with pytest.raises(AuthenticationFailed) as exc:
            auth.verify_jwt(token)

    assert "JWT Verification failed" in str(exc.value)
