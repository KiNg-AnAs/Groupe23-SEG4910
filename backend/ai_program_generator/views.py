# ai_program_generator/views.py
import os
import json
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import User, UserProfile
from users.authentication import Auth0JSONWebTokenAuthentication
from .models import AIProgram, ProgramDay, Exercise
from django.db import transaction
from django.conf import settings
import requests


def get_ollama_url():
    """Get Ollama URL from settings or use default."""
    return getattr(settings, "OLLAMA_URL", "http://host.docker.internal:11434")


def validate_program_json(data):
    """
    Validate that the JSON matches our expected structure.
    Returns (is_valid, error_message).
    """
    if not isinstance(data, dict):
        return False, "Response is not a JSON object"

    # Check top-level keys
    if "program_summary" not in data or "week_plan" not in data:
        return False, "Missing 'program_summary' or 'week_plan'"

    summary = data["program_summary"]
    if not isinstance(summary, dict) or "goal" not in summary or "difficulty" not in summary:
        return False, "Invalid 'program_summary' structure"

    # Check week_plan
    week_plan = data["week_plan"]
    if not isinstance(week_plan, list) or len(week_plan) != 7:
        return False, f"'week_plan' must be a list of 7 days, got {len(week_plan) if isinstance(week_plan, list) else 'not a list'}"

    # Validate each day
    required_day_keys = ["day_name", "focus", "is_rest_day", "sessions"]
    for idx, day in enumerate(week_plan):
        if not isinstance(day, dict):
            return False, f"Day {idx + 1} is not a JSON object"

        for key in required_day_keys:
            if key not in day:
                return False, f"Day {idx + 1} missing key '{key}'"

        # Validate sessions
        if not isinstance(day["sessions"], list):
            return False, f"Day {idx + 1} 'sessions' is not a list"

        for session_idx, session in enumerate(day["sessions"]):
            required_session_keys = ["exercise_name", "sets", "reps", "intensity", "notes"]
            for key in required_session_keys:
                if key not in session:
                    return False, f"Day {idx + 1}, Session {session_idx + 1} missing key '{key}'"

    return True, None


@api_view(["POST"])
@authentication_classes([Auth0JSONWebTokenAuthentication])
@permission_classes([IsAuthenticated])
def generate_ai_program(request):
    """
    Generate a 7-day AI fitness program based on user profile.
    Stores the program in the database and returns it.
    """
    # Auth0 user lookup
    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if not user:
        return Response({"error": "User not found"}, status=404)

    # Profile lookup
    profile = UserProfile.objects.filter(user=user).first()
    if not profile:
        return Response({"error": "User profile not found. Complete onboarding first."}, status=400)

    # -------------------------------
    # Build user data block
    # -------------------------------
    user_block = f"""
User Profile:
- Age: {profile.age}
- Height: {profile.height_cm} cm
- Weight: {profile.weight_kg} kg
- Fitness Level: {profile.fitness_level}
- Primary Goal: {profile.primary_goal.replace('_', ' ').title()}
- Workout Frequency: {profile.workout_frequency}
- Daily Activity Level: {profile.daily_activity_level.replace('_', ' ').title()}
- Sleep Hours: {profile.sleep_hours}
"""
    if profile.body_type:
        user_block += f"- Body Type: {profile.body_type.replace('_', ' ').title()}\n"
    if profile.body_fat_percentage:
        user_block += f"- Body Fat %: {profile.body_fat_percentage}\n"

    # -------------------------------
    # JSON STRUCTURE ENFORCED PROMPT
    # -------------------------------
    prompt = f"""
    You are an expert strength and conditioning coach.

    Based on the following user data, create a 7-day personalized fitness program:

    {user_block}

    CRITICAL REQUIREMENTS:
    1. Return ONLY valid JSON (no markdown, no explanations)
    2. Include EXACTLY 7 days (Monday-Sunday)
    3. Each TRAINING day must have AT LEAST 4 exercises
    4. Rest days should have "is_rest_day": true and empty sessions
    5. Use lowercase for difficulty: "beginner", "intermediate", or "advanced"

    JSON STRUCTURE (MUST FOLLOW EXACTLY):

    {{
      "program_summary": {{
        "goal": "clear objective based on user's primary_goal",
        "difficulty": "beginner" | "intermediate" | "advanced"
      }},
      "week_plan": [
        {{
          "day_name": "Monday",
          "focus": "e.g., Upper Body Strength",
          "is_rest_day": false,
          "sessions": [
            {{
              "exercise_name": "Exercise 1",
              "sets": 3,
              "reps": "8-12",
              "intensity": "RPE 7-8",
              "notes": "Short tip"
            }},
            {{
              "exercise_name": "Exercise 2",
              "sets": 3,
              "reps": "8-12",
              "intensity": "moderate",
              "notes": ""
            }},
            {{
              "exercise_name": "Exercise 3",
              "sets": 3,
              "reps": "8-12",
              "intensity": "moderate",
              "notes": ""
            }},
            {{
              "exercise_name": "Exercise 4",
              "sets": 3,
              "reps": "8-12",
              "intensity": "moderate",
              "notes": ""
            }}
          ]
        }},
        ... (repeat for all 7 days)
      ]
    }}

    IMPORTANT: 
    - Training days MUST normally have 6 exercices
    - Include 2-3 rest days in the week
    - Keep notes short (under 10 words) or empty
    - Respond with ONLY the JSON object, nothing else
    """
    try:
        # Ollama model call
        ollama_url = get_ollama_url()
        ollama_resp = requests.post(
            f"{ollama_url}/api/generate",
            json={
                "model": "llama3.1:8b",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": -1,
                    "temperature": 0.3,
                }
            },
            timeout=120  # 2 minutes timeout for large responses
        )

        if ollama_resp.status_code != 200:
            return Response(
                {
                    "error": "Ollama returned non-200 status",
                    "status_code": ollama_resp.status_code,
                    "body": ollama_resp.text,
                },
                status=502,
            )

        data = ollama_resp.json()
        raw_text = (data.get("response") or "").strip()
        if not raw_text:
            return Response(
                {
                    "error": "Empty content from Ollama",
                    "ollama_raw": data,
                },
                status=502,
            )

        # -------------------------------
        # Clean possible code fences
        # -------------------------------
        cleaned = raw_text.strip()

        if cleaned.startswith("```"):
            cleaned = cleaned.lstrip("`").lstrip()
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].lstrip("\r\n ").lstrip()
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3].rstrip()

        # -------------------------------
        # Parse JSON
        # -------------------------------
        try:
            program_data = json.loads(cleaned)
        except json.JSONDecodeError as e:
            return Response(
                {
                    "error": "Model returned invalid JSON",
                    "json_error": str(e),
                    "raw_response": raw_text[:500],  # First 500 chars
                    "cleaned_attempt": cleaned[:500],
                },
                status=502,
            )

        # -------------------------------
        # Validate JSON structure
        # -------------------------------
        is_valid, validation_error = validate_program_json(program_data)
        if not is_valid:
            return Response(
                {
                    "error": "Generated program has invalid structure",
                    "validation_error": validation_error,
                    "program_data": program_data,
                },
                status=502,
            )

        # -------------------------------
        # Save to Database (Atomic Transaction)
        # -------------------------------
        with transaction.atomic():
            # Create AIProgram
            ai_program = AIProgram.objects.create(
                user=user,
                goal=program_data["program_summary"]["goal"],
                difficulty=program_data["program_summary"]["difficulty"].lower(),
                is_active=True,  # This will auto-deactivate other programs
                raw_json=program_data
            )

            # Create ProgramDays and Exercises
            for day_idx, day_data in enumerate(program_data["week_plan"]):
                program_day = ProgramDay.objects.create(
                    program=ai_program,
                    day_number=day_idx + 1,
                    day_name=day_data["day_name"],
                    focus=day_data["focus"],
                    is_rest_day=day_data["is_rest_day"]
                )

                # Create exercises for this day (skip if rest day)
                if not day_data["is_rest_day"]:
                    for exercise_idx, exercise_data in enumerate(day_data["sessions"]):
                        Exercise.objects.create(
                            program_day=program_day,
                            order=exercise_idx + 1,
                            exercise_name=exercise_data["exercise_name"],
                            sets=exercise_data["sets"],
                            reps=exercise_data["reps"],
                            intensity=exercise_data["intensity"],
                            notes=exercise_data.get("notes", "")
                        )

        # -------------------------------
        # Return success with program ID
        # -------------------------------
        return Response({
            "success": True,
            "message": "AI program generated and saved successfully",
            "program_id": ai_program.id,
            "program": program_data
        }, status=201)

    except requests.exceptions.Timeout:
        return Response({"error": "Ollama request timed out. Try again."}, status=504)
    except requests.exceptions.RequestException as e:
        return Response({"error": f"Failed to connect to Ollama: {str(e)}"}, status=502)
    except Exception as e:
        return Response({"error": f"Unexpected error: {str(e)}"}, status=500)


@api_view(["GET"])
@authentication_classes([Auth0JSONWebTokenAuthentication])
@permission_classes([IsAuthenticated])
def get_active_program(request):
    """
    Get the user's currently active AI program with all days and exercises.
    """
    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if not user:
        return Response({"error": "User not found"}, status=404)

    # Get active program
    program = AIProgram.objects.filter(user=user, is_active=True).first()
    if not program:
        return Response({"error": "No active program found. Generate one first."}, status=404)

    # Build response with all days and exercises
    week_plan = []
    for day in program.days.all():
        exercises = [
            {
                "exercise_name": ex.exercise_name,
                "sets": ex.sets,
                "reps": ex.reps,
                "intensity": ex.intensity,
                "notes": ex.notes
            }
            for ex in day.exercises.all()
        ]

        week_plan.append({
            "day_name": day.day_name,
            "focus": day.focus,
            "is_rest_day": day.is_rest_day,
            "sessions": exercises
        })

    return Response({
        "program_id": program.id,
        "program_summary": {
            "goal": program.goal,
            "difficulty": program.difficulty
        },
        "created_at": program.created_at,
        "week_plan": week_plan
    })


@api_view(["GET"])
@authentication_classes([Auth0JSONWebTokenAuthentication])
@permission_classes([IsAuthenticated])
def get_program_history(request):
    """
    Get all past programs for the user (for history/comparison).
    """
    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if not user:
        return Response({"error": "User not found"}, status=404)

    programs = AIProgram.objects.filter(user=user).order_by("-created_at")

    history = [
        {
            "program_id": prog.id,
            "goal": prog.goal,
            "difficulty": prog.difficulty,
            "is_active": prog.is_active,
            "created_at": prog.created_at
        }
        for prog in programs
    ]

    return Response({"history": history})


@api_view(["POST"])
@authentication_classes([Auth0JSONWebTokenAuthentication])
@permission_classes([IsAuthenticated])
def set_active_program(request, program_id):
    """
    Set a specific program as the active one.
    """
    auth0_id = request.user.payload.get("sub")
    user = User.objects.filter(auth0_id=auth0_id).first()
    if not user:
        return Response({"error": "User not found"}, status=404)

    program = AIProgram.objects.filter(id=program_id, user=user).first()
    if not program:
        return Response({"error": "Program not found or doesn't belong to you"}, status=404)

    # Deactivate all programs and activate this one
    AIProgram.objects.filter(user=user, is_active=True).update(is_active=False)
    program.is_active = True
    program.save()

    return Response({"success": True, "message": f"Program {program_id} is now active"})