# Use the python 3.12 image
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Set environment variables 
# Prevents Python from writing pyc files to disk
ENV PYTHONDONTWRITEBYTECODE=1 
# Prevents Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED=1

# Upgrade pip
RUN pip install --upgrade pip 

# Copy the project dependencies in the WORKDIR (/app)  
COPY requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files in the working directory
COPY . .

# Documents that the container listens on port 8000
EXPOSE 8000

# Run Django’s development server
# CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]

# Run gunicorn production server
# "gunicorn" is the WSGI HTTP server that runs the Django app in production
# "car_notes_api.wsgi:application" tells gunicorn where the Django WSGI callable is located
# By default gunicorns binds to localhost (127.0.0.1), which is NOT accessible outside the container
# "--bind 0.0.0.0:8000" tells gunicorn to listen on all container network interfaces on port 8000
# (0.0.0.0 = accept connections from outside the container; required so Docker can forward host traffic to the container)
# (forward traffic = Docker receives requests on the host machine port and redirects them to the container’s internal port)
# (the internal port is the port on which the backend app runs inside the container. this is specified in the CMD command and is 8000)
# 8000 is the internal/container port — the Django app runs on this port inside the container
# When using: docker run -p 8000:8000 --> Host:8000 --> Container:8000
# Equivalent raw command: gunicorn car_notes_api.wsgi:application --bind 0.0.0.0:8000
CMD ["gunicorn", "ecommerce_api.wsgi:application", "--bind", "0.0.0.0:8000"]