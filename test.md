# API Testing – Postman Collection Overview

## 1. Endpoint Coverage

### Authentication & User Setup
- **POST /auth0_login/** – Create or sync user after Auth0 login  
- **GET /get_user_info/** – Retrieve basic user info (email, role, username)  
- **GET /get_user_subscription/** – Return current plan and add-ons  
- **POST /set_username/** – Update username (body: { "username": "yahya123" })  
- **GET /is_coach/** – Check if the current user is a coach  

---

### User Profile Management
- **POST /save_user_profile/** – Save or update user profile details  
- **GET /user-detail/** – Get full user data (subscriptions, add-ons, profile)
- **PUT/PATCH /user-detail/** – Update username, role, or downgrade plan  
  - Example: `{ "username": "yahya", "subscription_plan": "none" }`
- **POST /downgrade_plan/** – Downgrade plan to "none" or "basic"  
  - Example: `{ "target_plan": "none" }`
- **GET /get_user_addons/** – Retrieve list of purchased add-ons

---

### Coach Endpoints
- **GET /coach/clients/** – List all users (filters: `q`, `limit`, `offset`)
- **PUT/PATCH /coach/clients/<id>/profile/** – Update client profile or plan  
  - Example: `{ "age": 30, "subscription_plan": "basic" }`
- **DELETE /coach/clients/<id>/** – Delete client user
- **GET /coach/training/** – List clients with active AI add-ons
- **PATCH /coach/training/<id>/** – Update AI training progress or notes  
  - Example: `{ "status": "Done" }`
- **GET /coach/bookings/** – List clients with Zoom sessions
- **PATCH /coach/bookings/<id>/** – Update or complete a Zoom booking  
  - Example: `{ "status": "Completed" }`

---

### Stripe Integration
- **POST /create-checkout-session/** – Create Stripe Checkout Session  
  - Example body:
    ```json
    {
      "plan": "basic",
      "total": 9.99,
      "add_ons": { "zoom": 2 }
    }
    ```
- **POST /stripe_webhook/** – Stripe callback (no auth)  
  - Automatically updates user plan and add-ons in the database.

---

## 2. Argument Variations Tested
- With and without JWT → expected `401 Unauthorized`
- Missing required fields → expected `400 Bad Request`
- Invalid roles (non-coach accessing coach routes) → expected `403 Forbidden`
- Valid request → expected `200 OK` with JSON response
- Stripe webhook replay simulation → ensure idempotency and DB consistency

---

## 3. Testing Process
- Built complete Postman Collection covering all endpoints.
- Used environment variables for JWT and base URL.
- Added pre-request scripts to inject authorization headers.
- Verified positive and negative test cases.
- Confirmed correct JSON structure and HTTP status codes.
- Simulated Stripe flow with test card `4242 4242 4242 4242`.
- Checked DB integrity after webhook updates.

---

## 4. Summary Count

| Category          | Endpoints | Tested | Passed | Failed |
|-------------------|-----------|---------|---------|---------|
| Auth & User       | 5         | 5       | 5       | 0       |
| User Profile      | 5         | 5       | 5       | 0       |
| Coach Features    | 7         | 7       | 7       | 0       |
| Stripe Integration| 2         | 2       | 2       | 0       |
| **Total**         | **19**    | **19**  | **19**  | **0**   |

✅ All API routes returned expected responses  
⚠️ Edge cases under retry/webhook duplication still in progress

---

## 5. Visuals to Include
- Screenshot of Postman Collection (grouped by folders)
- Example request/response (e.g. `/create-checkout-session/`)
- Coverage graph (100% success rate)
