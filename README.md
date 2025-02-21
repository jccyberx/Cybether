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

## 📋 Overview

Cybether is a comprehensive GRC dashboard that helps organizations monitor and manage their cybersecurity posture. It provides real-time insights into:

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

### Manual Installation
```bash
# Build and start containers
docker compose up --build

# Stop containers
docker compose down

```

## 🔍 Verification

After installation, verify that:
1. Frontend is accessible at http://localhost:3000
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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support or inquiries:
- Contact: Jean Carlos (JC)
- LinkedIn: [Connect with JC](https://www.linkedin.com/in/jeanpc/)
- Issues: [GitHub Issues](https://github.com/wandanti/cybether/issues)
