from .settings import *

# Use in-memory SQLite DB for testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Optional: faster hashing and simplified config
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
DEBUG = False
