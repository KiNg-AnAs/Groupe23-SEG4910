from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import JsonResponse
from .models import User, UserProfile, Subscription, AddOn
from django.utils import timezone
from datetime import timedelta

import json


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
    GET  -> Returns the current authenticated user's full database row
    PUT/PATCH -> Updates username, role, subscription_plan, and add_ons
    """

    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if not user:
        return JsonResponse({"error": "User not found"}, status=404)

    if request.method in ["PUT", "PATCH"]:
        data = request.data
        username = data.get("username")
        role = data.get("role")
        subscription_plan = data.get("subscription_plan")
        add_ons = data.get("add_ons", {})

        # Update basic user info
        if username is not None:
            user.username = username
        if role is not None:
            user.role = role

        # Handle subscription plan logic
        if subscription_plan is not None and subscription_plan != user.subscription_plan:
            # Update plan on user table
            user.subscription_plan = subscription_plan

            # Create a new Subscription record (start today, end in 1 year)
            Subscription.objects.create(
                user=user,
                plan=subscription_plan,
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=365),
                status="active",
            )

        # Handle add-ons creation logic
        for addon_type, qty in (add_ons or {}).items():
            if qty <= 0:
                continue

            # E-Book: allow only 1 total (prevent duplicates)
            if addon_type == "ebook":
                existing_ebook = AddOn.objects.filter(user=user, addon_type="ebook").first()
                if existing_ebook:
                    continue  # Skip if already purchased

            # Set expiration for zoom & ai (1 year)
            end_date = None
            if addon_type in ["zoom", "ai"]:
                end_date = timezone.now() + timedelta(days=365)

            # Create new AddOn record
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

    # GET -> return full user info
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

    # Also fetch subscription info if exists
    subscription = Subscription.objects.filter(user=user, status="active").order_by("-start_date").first()
    subscription_data = None
    if subscription:
        subscription_data = {
            "plan": subscription.plan,
            "start_date": subscription.start_date,
            "end_date": subscription.end_date,
            "status": subscription.status,
        }

    return Response({
        "id": user.id,
        "auth0_id": user.auth0_id,
        "email": user.email,
        "username": user.username,
        "role": user.role,
        "subscription_plan": user.subscription_plan,
        "subscription_details": subscription_data,
        "addons": addons_data,
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
