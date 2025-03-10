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

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then
  print_error "Please run as root (use sudo)"
  exit 1
fi

# Check if hostname argument is provided
if [ -z "$1" ]; then
  print_error "Please provide a hostname"
  echo "Usage: sudo $0 hostname"
  echo "Example: sudo $0 cybether.local"
  exit 1
fi

HOSTNAME=$1

# Get the local IP address on macOS
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
if [ -z "$LOCAL_IP" ]; then
  print_error "Could not determine local IP address"
  exit 1
fi

print_status "Setting up local hostname: $HOSTNAME -> $LOCAL_IP"

# Check if entry already exists
if grep -q "$HOSTNAME" /etc/hosts; then
  print_status "Updating existing entry in /etc/hosts"
  sed -i '' "s/.*$HOSTNAME/$LOCAL_IP $HOSTNAME/" /etc/hosts
else
  print_status "Adding new entry to /etc/hosts"
  echo "$LOCAL_IP $HOSTNAME" >> /etc/hosts
fi

print_success "Hostname setup complete!"
print_status "Run the deployment with: ./deploy.sh --hostname $HOSTNAME"
print_status "Then access the application at: http://$HOSTNAME:3000"