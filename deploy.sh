#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print status messages
print_status() {
    echo -e "${YELLOW}[*] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[+] $1${NC}"
}

print_error() {
    echo -e "${RED}[-] $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Generate random secure keys if not set
if [ -z "$SECRET_KEY" ]; then
    SECRET_KEY=$(openssl rand -hex 32)
    export SECRET_KEY
fi

if [ -z "$JWT_SECRET_KEY" ]; then
    JWT_SECRET_KEY=$(openssl rand -hex 32)
    export JWT_SECRET_KEY
fi

if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -hex 16)
    export DB_PASSWORD
fi

# Create .env file
cat > .env << EOF
SECRET_KEY=${SECRET_KEY}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
DB_PASSWORD=${DB_PASSWORD}
EOF

print_status "Starting Cybether deployment..."

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down

# Remove old volumes if requested
if [ "$1" == "--clean" ]; then
    print_status "Removing old volumes..."
    docker volume rm cybether-postgres-data || true
fi

# Build and start containers
print_status "Building and starting containers..."
docker-compose up -d --build

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
attempt=1
max_attempts=30

while [ $attempt -le $max_attempts ]; do
    if docker-compose ps | grep -q "healthy"; then
        print_success "All services are up and healthy!"
        echo -e "\nCybether is now running!"
        echo -e "Frontend: http://localhost:3000"
        echo -e "Backend API: http://localhost:5001"
        echo -e "\nDefault admin credentials:"
        echo -e "Username: admin"
        echo -e "Password: admin123"
        echo -e "\nPlease change the admin password after first login."
        exit 0
    fi
    print_status "Waiting for services to be ready (attempt $attempt/$max_attempts)..."
    sleep 10
    ((attempt++))
done

print_error "Services did not become healthy within the timeout period"
print_status "Checking container logs..."
docker-compose logs
exit 1