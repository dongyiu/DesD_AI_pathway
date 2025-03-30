# Use an official Python image as the base
FROM python:3.9-slim

# Environment variables to prevent Python from writing pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory
WORKDIR /app

# Install system dependencies (e.g., for compiling any Python dependencies)
RUN apt-get update && \
    apt-get install -y build-essential libpq-dev dos2unix && \
    apt-get clean

# Copy and install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy the Django project files
COPY . /app/

# Copy the entrypoint script to the image
COPY entrypoint.sh /app/
# Convert entrypoint.sh to use LF line endings
RUN dos2unix /app/entrypoint.sh
# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Set the port
EXPOSE 8000

# Entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]

# Start the application using Gunicorn
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]