# ai_program_generator/views.py
import os
import google.generativeai as genai
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import User, UserProfile
from users.authentication import Auth0JSONWebTokenAuthentication

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

@api_view(["GET"])
@authentication_classes([Auth0JSONWebTokenAuthentication])
@permission_classes([IsAuthenticated])
def generate_ai_program(request):
    # Auth0 user lookup
    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if not user:
        return Response({"error": "User not found"}, status=404)

    # Profile lookup
    profile = getattr(user, "userprofile", None)
    if not profile:
        return Response({"error": "User profile not found. Complete onboarding first."}, status=400)

    # Building prompt
    prompt = (
        "Create a 7-day personalized fitness program based on the following user data:\n"
        f"- Age: {profile.age} years\n"
        f"- Height: {profile.height_cm} cm\n"
        f"- Weight: {profile.weight_kg} kg\n"
        f"- Fitness Level: {profile.fitness_level}\n"
        f"- Primary Goal: {profile.primary_goal.replace('_', ' ').title()}\n"
        f"- Workout Frequency: {profile.workout_frequency}\n"
        f"- Daily Activity Level: {profile.daily_activity_level.replace('_', ' ').title()}\n"
        f"- Sleep Hours: {profile.sleep_hours} hours\n"
    )
    if profile.body_type:
        prompt += f"- Body Type: {profile.body_type.replace('_', ' ').title()}\n"
    if profile.body_fat_percentage:
        prompt += f"- Body Fat %: {profile.body_fat_percentage}\n"

    prompt += (
        "\nGenerate a motivating training program with:\n"
        "- A daily split (e.g. Monday: Strength, Tuesday: Cardio, etc.)\n"
        "- Types of exercises or activities\n"
        "- Any tips based on the user's data\n"
        "Return concise, readable markdown."
    )

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        resp = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.7,
                "max_output_tokens": 1500,
            },
        )

        program = (resp.text or "").strip()
        if not program:
            return Response({"error": "Empty response from Gemini"}, status=502)
        return Response({"program": program})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
