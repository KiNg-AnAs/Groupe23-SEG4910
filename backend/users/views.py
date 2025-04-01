from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import JsonResponse
from .models import User, UserProfile


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
        "role": "user"  # default role
    })

    return Response({
        "message": "User synced successfully",
        "created": created
    })


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_subscription(request):
    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if user:
        return Response({
            "subscription_plan": user.subscription_plan
        })
    return JsonResponse({"error": "User not found"}, status=404)


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def is_coach(request):
    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if user:
        return Response({"is_coach": user.role == "coach"})
    return JsonResponse({"error": "User not found"}, status=404)


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
