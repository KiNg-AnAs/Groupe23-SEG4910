# Use official Python base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory inside the container
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .

RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy Django app code
COPY backend/ .

# Expose port (for gunicorn)
EXPOSE 8000

# Start Django with gunicorn
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000","--timeout","180","--workers","2"]
