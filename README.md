# Cybether

A clean, open-source Cybersecurity Governance, Risk, and Compliance (GRC) dashboard built to give you real-time visibility into your security posture.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/jccyberx/Cybether.git
cd Cybether

# Start the application
./deploy.sh
```

Visit http://localhost:3000 and login with:
- **Username:** `admin`
- **Password:** `admin123`

## Deploying with Custom Hostname

If you want to run Cybether on a custom hostname (like cybether.local):

```bash
# Deploy with hostname
./deploy.sh --hostname example.com
```

For local development on macOS:

```bash
sudo ./macOS-setup-hosts.sh cybether.local
./deploy.sh --hostname cybether.local
```

Then access it at http://cybether.local:3000

## Changing the Default Password

After your first login, change the default admin password for security. You can do this in two ways:

### Using the Password Reset Script

```bash
# Install required packages if you haven't already
pip install bcrypt psycopg2-binary python-dotenv

# Run the reset script
python reset_password.py
```

Follow the prompts to set a new password.

### Through the Database

```bash
# Connect to the database container
docker exec -it cybether-db psql -U postgres -d grc_dashboard

# Update the password (replace 'your-hashed-password' with an actual bcrypt hash)
UPDATE "user" SET password_hash = 'your-hashed-password' WHERE username = 'admin';
```

## What's Inside

Cybether tracks the key areas that matter for your security governance:

- **Threat Levels** - Monitor current threat landscape
- **Maturity Ratings** - Track your security maturity over time with trend analysis
- **Risk Management** - Log and manage identified security risks with severity levels
- **Security Projects** - Track initiatives and projects with progress tracking
- **Compliance Frameworks** - Monitor compliance against major standards:
  - PCI DSS
  - NIST Cybersecurity Framework
  - ISO 27001
  - SOC 2
  - NCSC CAF
  - Cyber Essentials

## Features

### Dashboard View
- Real-time threat level display
- Security maturity score with historical trends
- Risk overview with severity breakdown
- Active projects and completion tracking
- Compliance framework status across multiple standards

### Admin Panel
Access the admin interface at http://localhost:3000/admin to:
- Update threat levels and descriptions
- Manage maturity ratings and add trend data
- Create and manage security risks
- Track and update project status
- Update compliance framework scores and assessments

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/downloads)

## Installation

### Standard Install

```bash
# Clone the repository
git clone https://github.com/jccyberx/Cybether.git
cd Cybether

# Start everything
./deploy.sh
```

### Fresh Install (Clean Database)

```bash
# Removes existing data and starts fresh
./deploy.sh --clean
```

### Custom Hostname Install

```bash
# Deploy with a custom hostname
./deploy.sh --hostname your-domain.com
```

### Manual Docker Setup

```bash
# Build and start all containers
docker compose up --build

# Stop containers
docker compose down
```

## Verify Installation

After startup, check that:
1. Frontend loads at http://localhost:3000 (or your custom hostname)
2. You can log in with the default admin credentials
3. Dashboard displays with all components visible
4. Admin panel is accessible and functional

## Architecture

Cybether is built with a straightforward three-tier architecture:

- **Frontend:** React 18.3.1 with Vite 5.4.6, Tailwind CSS for styling
- **Backend:** Python Flask REST API with JWT authentication
- **Database:** PostgreSQL with SQLAlchemy ORM

All components run in Docker containers for consistency across environments.

## Recent Updates

- **Frontend Migration:** Migrated from Create React App to Vite 5.4.6 for better build performance and smaller bundle sizes
- **Security Improvements:** Updated all dependencies to latest stable versions, reducing vulnerabilities from 19 to 2 moderate issues
- **Base Images:** Updated to Node.js 22-alpine and Python 3.12-slim for improved performance
- **Better ESM Support:** All config files now use ESM modules for consistency

## Tech Stack

**Frontend:**
- React 18.3.1
- Vite 5.4.6 (build tool)
- Tailwind CSS 3.4.13
- Chart.js 4.4.6 (dashboards & graphs)
- React Router 6.28.0
- Axios 1.7.7 (API client)

**Backend:**
- Flask 3.1.2
- Flask-SQLAlchemy 3.1.1
- Flask-JWT-Extended 4.7.0
- bcrypt 4.1.3 (password hashing)

**Database:**
- PostgreSQL 14

## License

MIT License - feel free to use and modify as needed.

## Get in Touch

Questions or need help?
- LinkedIn: [Connect with me](https://www.linkedin.com/in/jeanpc/)
- GitHub Issues: [Report bugs or request features](https://github.com/jccyberx/Cybether/issues)
