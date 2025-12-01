from django.db.models import Q, Sum  
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import JsonResponse
from .models import User, UserProfile, Subscription, AddOn, CoachTrainingProgress, CoachBooking
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
import json
import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import stripe
from django.http import HttpResponse
from django.db import transaction

stripe.api_key = settings.STRIPE_SECRET_KEY

def _require_coach(request):
    """Raise 403 if the authenticated user is not a coach."""
    auth0_id = request.user.payload.get("sub")
    me = User.objects.filter(auth0_id=auth0_id).first()
    if not me:
        return None, JsonResponse({"error": "User not found"}, status=404)
    if me.role != "coach":
        return None, JsonResponse({"error": "Forbidden: coach access required"}, status=403)
    return me, None


# --------------------------------------------------------------------
#  Auth0 Login Endpoint (Create user on first login)
# --------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auth0_login(request):
    payload = request.user.payload
    auth0_id = payload.get("sub")
    email = payload.get("email")

    if not auth0_id or not email:
        return JsonResponse({"error": "Invalid token payload"}, status=400)

    user, created = User.objects.get_or_create(auth0_id=auth0_id, defaults={
        "email": email,
        "role": "user",
        "subscription_plan": "none",
        "add_ons": {}  # initialize empty dict
    })

    return Response({
        "message": "User synced successfully",
        "created": created
    })


# --------------------------------------------------------------------
#  Basic user info (used for dashboard welcome)
# --------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if user:
        return Response({
            "auth0_id": user.auth0_id,
            "role": user.role,
            "username": user.username
        })
    return JsonResponse({"error": "User not found"}, status=404)


# --------------------------------------------------------------------
#  Retrieve user's subscription plan
# --------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_subscription(request):
    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if user:
        return Response({
            "subscription_plan": user.subscription_plan,
            "add_ons": user.add_ons or {}
        })
    return JsonResponse({"error": "User not found"}, status=404)


# --------------------------------------------------------------------
#  Set or update username
# --------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_username(request):
    username = request.data.get("username")
    if not username:
        return JsonResponse({"error": "Username is required"}, status=400)

    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if user:
        user.username = username
        user.save()
        return Response({"message": "Username set successfully"})
    return JsonResponse({"error": "User not found"}, status=404)


# --------------------------------------------------------------------
#  Check if authenticated user is a coach
# --------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def is_coach(request):
    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if user:
        return Response({"is_coach": user.role == "coach"})
    return JsonResponse({"error": "User not found"}, status=404)


# --------------------------------------------------------------------
#  Save or update user profile details
# --------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_user_profile(request):
    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if not user:
        return JsonResponse({"error": "User not found"}, status=404)

    data = request.data

    profile_data = {
        "age": data.get("age"),
        "height_cm": data.get("height"),
        "weight_kg": data.get("weight"),
        "fitness_level": data.get("fitnessLevel").lower(),
        "primary_goal": data.get("goal").lower().replace(" ", "_"),
        "workout_frequency": data.get("frequency"),
        "daily_activity_level": data.get("activityLevel").lower().replace(" ", "_"),
        "sleep_hours": data.get("sleepHours"),
        "body_fat_percentage": data.get("bodyFat"),
        "body_type": data.get("bodyType").lower() if data.get("bodyType") else None
    }

    profile, created = UserProfile.objects.update_or_create(user=user, defaults=profile_data)
    return Response({"message": "Profile saved", "created": created})


# --------------------------------------------------------------------
#  Get and Update current user's full database row
# --------------------------------------------------------------------
@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_detail(request):
    """
    GET  -> Returns the current authenticated user's full database row INCLUDING profile
    PUT/PATCH -> Updates username, role, and allows plan downgrade only.
    """
    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if not user:
        return JsonResponse({"error": "User not found"}, status=404)

    # -------------------------------
    # PUT / PATCH  -> basic profile updates
    # -------------------------------
    if request.method in ["PUT", "PATCH"]:
        data = request.data
        username = data.get("username")
        role = data.get("role")
        subscription_plan = data.get("subscription_plan")
        add_ons = data.get("add_ons", {})

        if username is not None:
            user.username = username
        if role is not None:
            user.role = role

        if subscription_plan is not None:
            if subscription_plan in ["none", "basic"]:
                user.subscription_plan = subscription_plan
                Subscription.objects.filter(user=user, status="active").update(status="expired")

        for addon_type, qty in (add_ons or {}).items():
            qty = int(qty)
            if qty <= 0:
                continue
            if addon_type == "ebook":
                if AddOn.objects.filter(user=user, addon_type="ebook", status__in=["active", "used"]).exists():
                    continue
            end_date = timezone.now() + timedelta(days=30)
            AddOn.objects.create(
                user=user,
                addon_type=addon_type,
                quantity=qty,
                start_date=timezone.now(),
                end_date=end_date,
                status="active",
            )

        user.save()
        return Response({"message": "User updated successfully"})

    # -------------------------------
    # GET -> return complete profile
    # -------------------------------
    
    # Latest active subscription
    sub = (
        Subscription.objects
        .filter(user=user, status="active")
        .order_by("-start_date")
        .first()
    )
    sub_data = None
    if sub:
        sub_data = {
            "plan": sub.plan,
            "start_date": sub.start_date,
            "end_date": sub.end_date,
            "status": sub.status,
        }

    # Profile
    prof = UserProfile.objects.filter(user=user).first()
    prof_data = None
    if prof:
        prof_data = {
            "age": prof.age,
            "height_cm": prof.height_cm,
            "weight_kg": prof.weight_kg,
            "fitness_level": prof.fitness_level,
            "primary_goal": prof.primary_goal,
            "workout_frequency": prof.workout_frequency,
            "daily_activity_level": prof.daily_activity_level,
            "sleep_hours": prof.sleep_hours,
            "body_fat_percentage": prof.body_fat_percentage,
            "body_type": prof.body_type,
            "created_at": prof.created_at,
        }
    
    # Debug logging
    print(f"🔍 DEBUG - User ID: {user.id}")
    print(f"🔍 DEBUG - Profile found: {prof}")
    print(f"🔍 DEBUG - Profile data: {prof_data}")

    # Add-ons (active only)
    addons_list = AddOn.objects.filter(user=user)
    addons_data = [
        {
            "addon_type": a.addon_type,
            "quantity": a.quantity,
            "status": a.status,
            "start_date": a.start_date,
            "end_date": a.end_date,
        }
        for a in addons_list
    ]

    return Response({
        "id": user.id,
        "auth0_id": user.auth0_id,
        "email": user.email,
        "username": user.username,
        "role": user.role,
        "subscription_plan": user.subscription_plan,
        "subscription_details": sub_data,
        "addons": addons_data,
        "profile": prof_data,
        "created_at": user.created_at,
    })
# --------------------------------------------------------------------
#  Downgrade Plan (Dashboard-only action)
# --------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def downgrade_plan(request):
    """
    POST -> Downgrade the user's plan to 'none' or 'basic'
    Example payload: { "target_plan": "none" } or { "target_plan": "basic" }
    """

    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if not user:
        return JsonResponse({"error": "User not found"}, status=404)

    target_plan = request.data.get("target_plan")
    if target_plan not in ["none", "basic"]:
        return JsonResponse({"error": "Invalid downgrade target."}, status=400)

    user.subscription_plan = target_plan
    user.save()

    return Response({
        "message": f"Plan downgraded successfully to '{target_plan}'",
        "subscription_plan": user.subscription_plan
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_addons(request):
    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if not user:
        return JsonResponse({"error": "User not found"}, status=404)

    addons = AddOn.objects.filter(user=user)
    response_data = [
        {
            "addon_type": a.addon_type,
            "quantity": a.quantity,
            "status": a.status,
            "start_date": a.start_date,
            "end_date": a.end_date,
        }
        for a in addons
    ]
    return Response({"addons": response_data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coach_list_clients(request):
    """
    GET /coach/clients/?q=<search>&limit=20&offset=0
    Returns users with role='user' plus:
      - subscription_plan + latest active subscription details
      - condensed add_ons { ebook, zoom, ai }
      - profile snapshot (UserProfile) if present
    """
    me, err = _require_coach(request)
    if err:
        return err

    q = request.GET.get("q", "").strip()
    try:
        limit = max(1, int(request.GET.get("limit", "20")))
    except ValueError:
        limit = 20
    try:
        offset = max(0, int(request.GET.get("offset", "0")))
    except ValueError:
        offset = 0

    qs = User.objects.filter(role="user")
    if q:
        qs = qs.filter(Q(email__icontains=q) | Q(username__icontains=q))

    total = qs.count()
    users = list(qs.order_by("id")[offset:offset + limit])

    out = []
    for u in users:
        # latest active subscription
        sub = (
            Subscription.objects
            .filter(user=u, status="active")
            .order_by("-start_date")
            .first()
        )
        sub_data = None
        if sub:
            sub_data = {
                "plan": sub.plan,
                "start_date": sub.start_date,
                "end_date": sub.end_date,
                "status": sub.status,
            }

        # profile 
        prof = UserProfile.objects.filter(user=u).first()
        prof_data = None
        if prof:
            prof_data = {
                "age": prof.age,
                "height_cm": prof.height_cm,
                "weight_kg": prof.weight_kg,
                "fitness_level": prof.fitness_level,
                "primary_goal": prof.primary_goal,
                "workout_frequency": prof.workout_frequency,
                "daily_activity_level": prof.daily_activity_level,
                "sleep_hours": prof.sleep_hours,
                "body_fat_percentage": prof.body_fat_percentage,
                "body_type": prof.body_type,
                "created_at": prof.created_at,
            }

        # add-ons summary (active only)
        addons = AddOn.objects.filter(user=u, status="active")
        addons_summary = {"ebook": 0, "zoom": 0, "ai": 0}
        for a in addons:
            key = a.addon_type  # expected: "ebook" | "zoom" | "ai"
            if key in addons_summary:
                addons_summary[key] += (a.quantity or 0)

        out.append({
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "role": u.role,
            "subscription_plan": u.subscription_plan,
            "subscription_details": sub_data,
            "addons": addons_summary,
            "profile": prof_data,
            "created_at": u.created_at,
        })

    return Response({
        "results": out,
        "count": total,
        "limit": limit,
        "offset": offset,
    })

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def coach_update_client_profile(request, user_id: int):
    """
    PUT/PATCH /coach/clients/<user_id>/profile/
    Body may include any UserProfile fields and optionally "subscription_plan".
    """
    me, err = _require_coach(request)
    if err:
        return err

    client = User.objects.filter(id=user_id, role="user").first()
    if not client:
        return JsonResponse({"error": "Client not found"}, status=404)

    data = request.data or {}

    # update client's plan (and create a new subscription record)
    new_plan = data.get("subscription_plan", None)
    if new_plan is not None and new_plan != client.subscription_plan:
        client.subscription_plan = new_plan
        client.save(update_fields=["subscription_plan"])
        Subscription.objects.create(
            user=client,
            plan=new_plan,
            start_date=timezone.now(),
            end_date=timezone.now() + timezone.timedelta(days=365),
            status="active",
        )

    # Upsert UserProfile
    defaults = {
        'age': data.get('age', 0),
        'height_cm': data.get('height_cm', 0),
        'weight_kg': data.get('weight_kg', 0),
        'fitness_level': data.get('fitness_level', ''),
        'primary_goal': data.get('primary_goal', ''),
        'workout_frequency': data.get('workout_frequency', ''),
        'daily_activity_level': data.get('daily_activity_level', ''),
        'sleep_hours': data.get('sleep_hours', 0),
        'body_fat_percentage': data.get('body_fat_percentage', 0),
        'body_type': data.get('body_type', ''),
    }
    prof, _created = UserProfile.objects.get_or_create(user=client, defaults=defaults)
    for field, value in defaults.items():
        setattr(prof, field, value)
    prof.save()

    
    # Safe updates for known fields only
    updatable = [
        "age", "height_cm", "weight_kg", "fitness_level", "primary_goal",
        "workout_frequency", "daily_activity_level", "sleep_hours",
        "body_fat_percentage", "body_type",
    ]
    changed = False
    for f in updatable:
        if f in data:
            setattr(prof, f, data.get(f))
            changed = True
    if changed:
        prof.save()

    return Response({"message": "Client profile updated successfully"})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def coach_delete_client(request, user_id: int):
    """
    DELETE /coach/clients/<user_id>/
    Hard delete the client user and related records (if on_delete=CASCADE).
    """
    me, err = _require_coach(request)
    if err:
        return err

    client = User.objects.filter(id=user_id, role="user").first()
    if not client:
        return JsonResponse({"error": "Client not found"}, status=404)

    try:
        client.delete()
    except Exception as e:
        return JsonResponse({"error": f"Delete failed: {e}"}, status=400)

    return Response({"message": "Client deleted successfully"})

# --------------------------------------------------------------------
#  Coach – Manage AI Training Programs
# --------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coach_training_list(request):
    """
    Returns one row per client who has active AI add-ons.
    Quantity = SUM(quantity) of active AI add-ons.
    Notes/last_updated come from CoachTrainingProgress (if any).
    """
    me, err = _require_coach(request)
    if err:
        return err

    # Group active AI add-ons by user
    grouped = (AddOn.objects
               .filter(addon_type='ai', status='active')
               .values('user_id')
               .annotate(total_qty=Sum('quantity'))
               .order_by('user_id'))

    rows = []
    for row in grouped:
        user_id = row['user_id']
        qty = row['total_qty'] or 0
        u = User.objects.filter(id=user_id).first()
        if not u:
            continue

        # Notes are stored per user in CoachTrainingProgress (last one)
        prog = (CoachTrainingProgress.objects
                .filter(user_id=user_id)
                .order_by('-last_updated')
                .first())

        rows.append({
            "id": user_id,                 # use user_id as the row id
            "user_id": user_id,
            "user_email": u.email,
            "quantity": qty,
            "status": "Pending",           # all active = pending
            "notes": (prog.notes if prog else ""),
            "last_updated": (prog.last_updated if prog else u.created_at),
        })

    return Response(rows)

# --------------------------------------------------------------------
#  PATCH /coach/training/<int:user_id>/
# --------------------------------------------------------------------
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def coach_training_update(request, user_id: int):
    """
    Allows a coach to mark AI training progress as done or add notes.
    PATCH body may include:
      - notes
      - status ("Done")
    """
    me, err = _require_coach(request)
    if err:
        return err

    user = User.objects.filter(id=user_id, role="user").first()
    if not user:
        return Response({"error": "Client not found."}, status=404)

    data = request.data or {}

    # ---- Notes-only update ----
    if "notes" in data and data.get("status") != "Done":
        progress = CoachTrainingProgress.objects.filter(user=user, coach=me).first()
        if progress:
            progress.notes = data["notes"]
            progress.save(update_fields=["notes", "last_updated"])
        else:
            CoachTrainingProgress.objects.create(
                user=user,
                coach=me,
                addon=AddOn.objects.filter(user=user, addon_type="ai").first(),
                notes=data["notes"],
                status="Pending",
            )
        return Response({"message": "Notes updated."})

    # ---- Completion logic ----
    if data.get("status") == "Done":
        addon = (
            AddOn.objects.filter(user=user, addon_type="ai", status="active", quantity__gt=0)
            .order_by("-quantity")
            .first()
        )
        if not addon:
            return Response({"error": "No active AI Add-On found for this user."}, status=400)

        # Decrement quantity
        addon.quantity -= 1
        if addon.quantity <= 0:
            addon.status = "used"
        addon.save(update_fields=["quantity", "status"])

        # Recalculate remaining
        remaining = (
            AddOn.objects.filter(user=user, addon_type="ai", status="active")
            .aggregate(total=Sum("quantity"))
            .get("total") or 0
        )

        progress, _ = CoachTrainingProgress.objects.update_or_create(
            user=user,
            coach=me,
            addon=addon,
            defaults={
                "status": "Done" if remaining <= 0 else "Pending",
                "notes": data.get("notes", ""),
            },
        )

        progress.save(update_fields=["status", "notes", "last_updated"])

        return Response(
            {
                "message": "Training progress updated successfully.",
                "status": progress.status,
                "remaining_quantity": remaining,
            },
            status=200,
        )

    return Response({"error": "Invalid PATCH data."}, status=400)

# --------------------------------------------------------------------
#  GET /coach/bookings/
# --------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def coach_list_bookings(request):
    """
    Returns one row per client with total Zoom quantity and their latest booking details.
    """
    me, err = _require_coach(request)
    if err:
        return err

    zoom_addons = (
        AddOn.objects.filter(addon_type="zoom", status="active")
        .values("user_id")
        .annotate(total_qty=Sum("quantity"))
        .order_by("user_id")
    )

    data = []
    for entry in zoom_addons:
        user_id = entry["user_id"]
        total_qty = entry["total_qty"] or 0
        user = User.objects.filter(id=user_id).first()
        if not user:
            continue

        booking = (
            CoachBooking.objects.filter(user=user)
            .order_by("-updated_at")
            .first()
        )

        data.append({
            "id": user.id,
            "user_email": user.email,
            "quantity": total_qty,
            "scheduled_date": booking.scheduled_date if booking else None,
            "completion_date": booking.completion_date if booking else None,
            "status": booking.status if booking else "Pending",
            "notes": booking.notes if booking else "",
            "last_updated": booking.updated_at if booking else timezone.now(),
        })

    return Response(data)

# --------------------------------------------------------------------
#  PATCH /coach/bookings/<int:user_id>/
# --------------------------------------------------------------------
@api_view(["PATCH"])
def coach_update_booking(request, user_id: int):
    """
    Allows the coach to update or complete a Zoom booking for a client.
    PATCH body may include:
      - scheduled_date
      - completion_date
      - notes
      - status ("Completed")
    """
    me, err = _require_coach(request)
    if err:
        return err

    user = User.objects.filter(id=user_id, role="user").first()
    if not user:
        return Response({"error": "Client not found."}, status=404)

    data = request.data or {}

    # Find an active Zoom Add-On for this client
    addon = (
        AddOn.objects.filter(user=user, addon_type="zoom")
        .order_by("-quantity")
        .first()
    )
    if not addon:
        return Response({"error": "No Zoom Add-On found for this client."}, status=400)

    # Create or update the booking linked to this addon
    booking, _ = CoachBooking.objects.update_or_create(
        user=user,
        coach=me,
        addon=addon,
        defaults={"status": "Pending"},
    )

    # --- Update fields if provided ---
    if "scheduled_date" in data:
        booking.scheduled_date = data["scheduled_date"]
    if "notes" in data:
        booking.notes = data["notes"]

    # --- Handle completion ---
    if data.get("status") == "Completed":
        booking.completion_date = timezone.now()

        # Decrement quantity
        if addon.status == "active" and addon.quantity > 0:
            addon.quantity -= 1
            if addon.quantity <= 0:
                addon.status = "used"
            addon.save(update_fields=["quantity", "status"])

        # Check remaining active quantity
        remaining = (
            AddOn.objects.filter(user=user, addon_type="zoom", status="active")
            .aggregate(total=Sum("quantity"))
            .get("total") or 0
        )

        # Update status based on remaining sessions
        if remaining <= 0:
            booking.status = "Completed"
        else:
            booking.status = "Pending"

        booking.save(update_fields=["status", "completion_date", "notes", "scheduled_date", "updated_at"])

        return Response(
            {
                "message": "Booking updated successfully.",
                "status": booking.status,
                "remaining_quantity": remaining,
            },
            status=200,
        )

    # Regular updates (not completion)
    booking.save(update_fields=["scheduled_date", "notes", "updated_at"])
    return Response({"message": "Booking updated successfully."})

@csrf_exempt  
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """
    1. Frontend sends: { total, plan, add_ons }
    2. We create a Stripe Checkout Session
    3. We store *all* needed info in session.metadata
    4. Webhook will read it and update DB *after* payment is confirmed
    """
    data = request.data
    total = float(data.get("total", 0))
    plan = data.get("plan", "none")
    add_ons = data.get("add_ons", {})

    # get current user
    auth0_id = request.user.payload.get("sub")
    email = request.user.payload.get("email")

    try:
        # ALL business info in metadata
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"PerfoEvolution purchase ({plan})"
                        },
                        "unit_amount": int(total * 100),
                    },
                    "quantity": 1,
                }
            ],
            customer_email=email,  # so webhook can find user by email
            success_url="http://localhost:3000/payment-success",
            cancel_url="http://localhost:3000/payment-cancel",
            metadata={
                "auth0_id": auth0_id or "",
                "email": email or "",
                "plan": plan,
                # store add-ons as json string
                "add_ons": json.dumps(add_ons),
                # you can also store "billing_period": "monthly"
                "billing_period": "monthly" if plan in ["basic", "advanced"] else "",
            },
        )
        return Response({"url": checkout_session.url})
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        print("[STRIPE WEBHOOK ERROR]", e)
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        print("[WEBHOOK] Received checkout.session.completed")

        metadata = session.get("metadata", {}) or {}
        plan = metadata.get("plan", "none")
        add_ons_raw = metadata.get("add_ons", "{}")
        billing_period = metadata.get("billing_period", "monthly")

        try:
            addons = json.loads(add_ons_raw)
        except json.JSONDecodeError:
            addons = {}

        email = metadata.get("email") or session.get("customer_email")
        auth0_id = metadata.get("auth0_id")

        user = None
        if auth0_id:
            user = User.objects.filter(auth0_id=auth0_id).first()
        if not user and email:
            user = User.objects.filter(email=email).first()

        if not user:
            print("[WEBHOOK] No user found for:", email)
            return HttpResponse(status=200)

        try:
            with transaction.atomic():
                # --- Update subscription ---
                if plan in ["basic", "advanced"]:
                    Subscription.objects.filter(user=user, status="active").update(status="expired")
                    start_date = timezone.now()
                    end_date = start_date + timedelta(days=30)
                    Subscription.objects.create(
                        user=user,
                        plan=plan,
                        start_date=start_date,
                        end_date=end_date,
                        status="active",
                    )
                    user.subscription_plan = plan

                # --- Update add-ons ---
                user_addons_dict = user.add_ons or {}
                for key, qty in addons.items():
                    qty = int(qty)
                    if qty <= 0:
                        continue
                    if key == "ebook":
                        exists = AddOn.objects.filter(
                            user=user, addon_type="ebook", status__in=["active", "used"]
                        ).exists()
                        if not exists:
                            AddOn.objects.create(
                                user=user,
                                addon_type="ebook",
                                quantity=1,
                                start_date=timezone.now(),
                                end_date=None,
                                status="active",
                            )
                            user_addons_dict["ebook"] = 1
                        continue
                    end_date = timezone.now() + timedelta(days=30)
                    AddOn.objects.create(
                        user=user,
                        addon_type=key,
                        quantity=qty,
                        start_date=timezone.now(),
                        end_date=end_date,
                        status="active",
                    )
                    user_addons_dict[key] = user_addons_dict.get(key, 0) + qty

                user.add_ons = user_addons_dict
                user.save(update_fields=["subscription_plan", "add_ons"])

                print(f"[WEBHOOK] Updated user {user.email}: plan={plan}, addons={user_addons_dict}")
        except Exception as e:
            print("[WEBHOOK ERROR during DB update]", e)
            return HttpResponse(status=500)

    return HttpResponse(status=200)
