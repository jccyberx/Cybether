# Cybether

A modern, open-source Cybersecurity Governance, Risk, and Compliance (GRC) dashboard.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/jccyberx/Cybether.git
cd cybether

# Start the application
./deploy.sh
```

Visit http://localhost:3000 and login with:
- Username: `admin`
- Password: `admin123`

## 🌐 Deploying with Custom Hostname

To deploy Cybether with a custom hostname:

```bash
# Deploy with hostname
./deploy.sh --hostname example.com
```

For local development with a hostname:

```bash
# On macOS
sudo ./macOS-setup-hosts.sh cybether.local
./deploy.sh --hostname cybether.local
```

Then access Cybether at http://cybether.local:3000

## 🔒 Changing the Default Password

For security, you should change the default admin password after first login. You can do this in two ways:

### Option 1: Using the Password Reset Script

```bash
# Make sure you have Python and required packages installed
pip install bcrypt psycopg2-binary python-dotenv

# Run the reset script
python reset_password.py
```

Follow the prompts to change the admin password.

### Option 2: Through the Database

```bash
# Connect to the database container
docker exec -it cybether-db psql -U postgres -d grc_dashboard

# Update the password (replace 'your-hashed-password' with the actual bcrypt hash)
UPDATE "user" SET password_hash = 'your-hashed-password' WHERE username = 'admin';
```

## 📋 Overview

Cybether is a GRC dashboard that helps organisations monitor and manage their cyber security posture. It provides real-time insights into:

- 🛡️ Threat Level Monitoring
- 📈 Maturity Rating Tracking
- ⚠️ Risk Management
- 📊 Project Progress
- ✅ Compliance Framework Status

## 🛠️ Features

### Dashboard
- **Real-time Threat Monitoring**: Track and assess current threat levels
- **Maturity Tracking**: Monitor security maturity with trend analysis
- **Risk Overview**: Visualize and manage security risks
- **Project Management**: Track security initiatives
- **Compliance Status**: Monitor major framework compliance
  - PCI DSS
  - NIST CSF
  - ISO 27001
  - SOC 2
  - NCSC CAF
  - Cyber Essentials

### Administration
Access the admin interface at http://localhost:3000/admin to:
- Update threat levels
- Manage maturity ratings and trends
- Handle risk assessments
- Update project status
- Track compliance progress

## 🔧 Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/downloads)

## 📦 Installation

### Standard Installation
```bash
# Clone the repository
git clone https://github.com/jccyberx/Cybether.git
cd cybether

# Start the application
./deploy.sh
```

### Clean Installation
```bash
# For a fresh start (removes existing data)
./deploy.sh --clean
```

### Installation With Custom Hostname
```bash
# Deploy with hostname support
./deploy.sh --hostname your-hostname.com
```

### Manual Installation
```bash
# Build and start containers
docker compose up --build

# Stop containers
docker compose down
```

## 🔍 Verification

After installation, verify that:
1. Frontend is accessible at http://localhost:3000 (or your custom hostname)
2. You can log in with admin credentials
3. All dashboard components are loading
4. Admin functions are working

## 🏗️ Architecture

Cybether uses a modern three-tier architecture:
- **Frontend**: React with Tailwind CSS
- **Backend**: Python Flask REST API
- **Database**: PostgreSQL

All components are containerised using Docker for easy deployment and scaling.

## 📜 License

This project is licensed under the MIT License.

## 📞 Support

For support or inquiries:
- Contact: Jean Carlos (JC)
- LinkedIn: [Connect with JC](https://www.linkedin.com/in/jeanpc/)
- Issues: [GitHub Issues](https://github.com/jccyberx/Cybether/issues)
