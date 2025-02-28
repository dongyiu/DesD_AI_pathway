# DESD Project

This repository contains two Dockerized applications:
- **Backend:** A Django application.
- **Frontend:** A React application built with Vite and served using Nginx.

## Backend (Django)

The backend is built using Django and containerized with Docker. It uses Gunicorn to serve the application.

### Prerequisites
- Ensure a `requirements.txt` exists in the `/backend` directory with your dependencies (e.g., Django, Gunicorn, etc.).
- Your Django project (named `DESD_Project`) should be set up properly.

### Dockerfile
The backend Dockerfile is located at: `/backend/Dockerfile`.





### Usage

1. Open your terminal and navigate to the `/backend` directory:
   ```bash
   cd backend
   ```
2. Build the Docker image:
   ```bash
   docker build -t desd_backend .
   ```
3. Run the container:
   ```bash
   docker run -p 8000:8000 desd_backend
   ```
4. The Django application will be available at [http://localhost:8000](http://localhost:8000).

> **Note:** For development, you may choose to run Django’s development server instead of Gunicorn by modifying the CMD in the Dockerfile.

---

## Frontend (React/Vite)

The frontend is built using React with Vite. It uses a multi-stage Docker build process that compiles the app and then serves it via Nginx.

### Prerequisites
- Ensure `package.json` and `package-lock.json` exist in the `/frontend` directory.
- Your Vite configuration should output the build files to the `dist` directory (Vite's default).

### Dockerfile
The frontend Dockerfile is located at: `/frontend/Dockerfile`.

### Usage

1. Open your terminal and navigate to the `/frontend` directory:
   ```bash
   cd frontend
   ```
2. Build the Docker image:
   ```bash
   docker build -t desd_frontend .
   ```
3. Run the container:
   ```bash
   docker run -p 80:80 desd_frontend
   ```
4. The React application will be accessible at [http://localhost](http://localhost).

---

## Optional: Running Both with Docker Compose

To run both containers simultaneously, you can use Docker Compose. Create a `docker-compose.yml` file in the root directory with the following content:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
    ports:
      - "8000:8000"
  frontend:
    build:
      context: ./frontend
    ports:
      - "80:80"
```

Then run:
```bash
docker-compose up --build
```

This will build and run both containers at once.

---