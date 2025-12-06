# Use official Python base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory inside the container
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy Django app code
COPY backend/ .

# Collect static files
RUN python manage.py collectstatic --no-input || true

# Expose port (for gunicorn)
EXPOSE 8000

# Create startup script
RUN echo '#!/bin/bash\n\
python manage.py migrate --no-input\n\
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --timeout 240 --workers 2\n\
' > /start.sh && chmod +x /start.sh

# Start Django with migrations
CMD ["/start.sh"]