import json
import requests
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from jose import jwt

class Auth0JSONWebTokenAuthentication(JWTAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', None)

        if not auth_header:
            return None

        try:
            token = auth_header.split()[1]
            payload = self.verify_jwt(token)

            class Auth0User:
                def __init__(self, payload):
                    self.payload = payload
                    self.is_authenticated = True

                def __getattr__(self, attr):
                    return self.payload.get(attr, None)

            user = Auth0User(payload)
            return (user, token)

        except Exception as e:
            raise AuthenticationFailed(f"JWT Authentication failed: {str(e)}")

    def verify_jwt(self, token):
        auth0_domain = "dev-w3nk36t6hbc8zq2s.us.auth0.com"
        auth0_audience = "http://localhost:8000"

        #Step 1: Get JSON Web Key Set (JWKS) from Auth0
        jwks_url = f"https://{auth0_domain}/.well-known/jwks.json"
        jwks = requests.get(jwks_url).json()

        #Step 2: Decode the token header to get the key ID
        header = jwt.get_unverified_header(token)
        rsa_key = {}

        for key in jwks["keys"]:
            if key["kid"] == header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }

        if not rsa_key:
            raise AuthenticationFailed("No valid key found")

        #Step 3: Verify and Decode the JWT Token
        try:
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience=auth0_audience,
                issuer=f"https://{auth0_domain}/"
            )
            return payload  #Returns Auth0 user data
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired")
        except jwt.JWTClaimsError:
            raise AuthenticationFailed("Invalid claims, check audience and issuer")
        except Exception as e:
            raise AuthenticationFailed(f"JWT Verification failed: {str(e)}")
