# Cybether

A comprehensive Cybersecurity Governance, Risk, and Compliance (GRC) dashboard designed to help organizations monitor and manage their cybersecurity posture effectively.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Docker](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/downloads)

## Quick Start Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/wandanti/cybether.git
cd cybether
```

### Step 2: Build and Start the Application
```bash
docker compose up --build
```
This command will:
- Build the frontend and backend containers
- Start the PostgreSQL database
- Set up all necessary networking
- Initialize the database with required tables

### Step 3: Access the Application
Once all containers are running, you can access:
- Dashboard: http://localhost:3000
- Admin Interface: http://localhost:3000/admin

### Step 4: Login Credentials
Use these default credentials to log in:
- Username: `admin`
- Password: `admin123`

## Features

### Dashboard Overview
- Threat Level Monitoring
- Maturity Rating Tracking
- Risk Management
- Project Progress Tracking
- Compliance Framework Monitoring (PCI DSS, NIST CSF, ISO 27001, SOC 2)

### Admin Interface
The admin interface at http://localhost:3000/admin allows you to:
- Manage threat levels
- Update maturity ratings
- Add/Edit risks
- Manage projects
- Track compliance frameworks

## Support

For support or inquiries, please contact Jean Carlos (JC) via [LinkedIn](https://www.linkedin.com/in/jeanpc/)