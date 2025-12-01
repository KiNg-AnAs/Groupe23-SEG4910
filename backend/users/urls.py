from django.urls import path
from . import views
from ai_program_generator.views import generate_ai_program

urlpatterns = [
    # ----- User endpoints -----
    path("auth0-login/", views.auth0_login, name="auth0_login"),
    path("user-info/", views.get_user_info, name="get_user_info"),
    path("user-subscription/", views.get_user_subscription, name="get_user_subscription"),
    path("set-username/", views.set_username, name="set_username"),
    path("is-coach/", views.is_coach, name="is_coach"),
    path("save-profile/", views.save_user_profile, name="save_user_profile"),
    path("user-detail/", views.user_detail, name="user_detail"),
    path("downgrade-plan/", views.downgrade_plan, name="downgrade_plan"),
    path("get-user-addons/", views.get_user_addons, name="get_user_addons"),

    # ----- Stripe endpoints -----
    path("create-checkout-session/", views.create_checkout_session, name="create_checkout_session"),
    path("stripe-webhook/", views.stripe_webhook, name="stripe_webhook"),

    # ----- Coach endpoints -----
    path("coach/clients/", views.coach_list_clients, name="coach_list_clients"),
    path("coach/clients/<int:user_id>/profile/", views.coach_update_client_profile, name="coach_update_client_profile"),
    path("coach/clients/<int:user_id>/delete/", views.coach_delete_client, name="coach_delete_client"),
    path("coach/training/", views.coach_training_list, name="coach_training_list"),
    path("coach/training/<int:user_id>/", views.coach_training_update, name="coach_training_update"),
    path("coach/bookings/", views.coach_list_bookings, name="coach_list_bookings"),
    path("coach/bookings/<int:user_id>/", views.coach_update_booking, name="coach_update_booking"),
]
