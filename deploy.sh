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

# Process command line arguments
CLEAN_INSTALL=false
HOSTNAME=""

# Print usage information
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  --clean             Perform a clean installation (removes existing data)"
    echo "  --hostname HOST     Set the hostname for deployment (e.g., example.com)"
    echo "  -h, --help          Display this help message"
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --clean)
      CLEAN_INSTALL=true
      shift
      ;;
    --hostname)
      HOSTNAME="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      print_error "Unknown option: $1"
      usage
      ;;
  esac
done

# Clean up any existing deployments
print_status "Stopping existing containers..."
docker-compose down

# Ensure we don't have network conflicts
print_status "Cleaning up any existing networks..."
docker network rm cybether-net 2>/dev/null || true

# Remove old volumes if requested
if [ "$CLEAN_INSTALL" = true ]; then
    print_status "Removing old volumes..."
    docker volume rm cybether-postgres-data 2>/dev/null || true
fi

# If hostname is provided, configure the environment accordingly
if [ -n "$HOSTNAME" ]; then
    print_status "Configuring for hostname: $HOSTNAME"
    
    # Create .env file with hostname settings
    cat > .env << EOF
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
REACT_APP_API_URL=http://${HOSTNAME}:5001
DB_PASSWORD=$(openssl rand -hex 16)
EOF
    print_success "Created environment configuration with hostname settings"
else
    # Generate .env file for local deployment
    print_status "Creating local environment configuration"
    
    cat > .env << EOF
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
REACT_APP_API_URL=http://localhost:5001
DB_PASSWORD=$(openssl rand -hex 16)
EOF
    print_success "Created local environment configuration"
fi

# Rebuild all containers
print_status "Building containers..."
docker-compose build

# Start containers
print_status "Starting containers..."
docker-compose up -d

# Check if backend container is running
print_status "Checking if backend container is running..."
if ! docker ps | grep -q "cybether-backend"; then
    print_error "Backend container is not running. Checking logs..."
    docker-compose logs backend
    exit 1
fi

# Check if frontend container is running
print_status "Checking if frontend container is running..."
if ! docker ps | grep -q "cybether-frontend"; then
    print_error "Frontend container is not running. Checking logs..."
    docker-compose logs frontend
    exit 1
fi

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
attempt=1
max_attempts=30

while [ $attempt -le $max_attempts ]; do
    if docker-compose ps | grep -q "healthy"; then
        print_success "All services are up and healthy!"
        
        if [ -n "$HOSTNAME" ]; then
            echo -e "\nCybether is now running!"
            echo -e "Frontend: http://${HOSTNAME}:3000"
            echo -e "Backend API: http://${HOSTNAME}:5001"
        else
            echo -e "\nCybether is now running!"
            echo -e "Frontend: http://localhost:3000"
            echo -e "Backend API: http://localhost:5001"
        fi
        
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