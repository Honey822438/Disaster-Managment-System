# Smart Disaster Response Management Information System (MIS)

A full-stack enterprise web application for coordinating disaster response operations across multiple government stakeholders.

## Overview

The Smart Disaster Response MIS provides real-time emergency report management, rescue team coordination, warehouse inventory tracking, hospital capacity management, financial transaction recording, and approval-based workflows — all secured by role-based access control and backed by a fully auditable data layer.

## Technology Stack

### Backend
- **Node.js 18** with Express.js
- **Prisma ORM** with MySQL 8.0
- **JWT Authentication** with bcrypt
- **Docker** containerization

### Frontend
- **React 18** with Vite
- **React Router v6** for navigation
- **Axios** for API communication
- **Tailwind CSS** for styling
- **Recharts** for data visualization

### Database
- **MySQL 8.0** with custom views and triggers
- **Prisma Migrations** for schema management
- **Database Seeding** for initial data

## Features

### Core Functionality
- ✅ Role-based access control (5 roles: admin, operator, field_officer, warehouse_manager, finance_officer)
- ✅ Emergency report management with status tracking
- ✅ Rescue team coordination and assignment
- ✅ Warehouse inventory with low-stock alerts
- ✅ Hospital capacity tracking and patient management
- ✅ Financial management (donations and expenses)
- ✅ Approval workflows for resource allocation
- ✅ Comprehensive audit logging
- ✅ Analytics dashboard with visualizations

### Technical Features
- ✅ JWT-based authentication
- ✅ ACID-compliant transactions
- ✅ Database triggers for automated state management
- ✅ Custom database views for complex queries
- ✅ Performance indexes on high-frequency columns
- ✅ Responsive design (mobile-friendly)
- ✅ Dark emergency operations theme

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd smart-disaster-response-mis
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start all services**
```bash
docker-compose up --build
```

This single command will:
- Start MySQL database
- Run Prisma migrations
- Seed initial data
- Start backend API on port 5000
- Start frontend on port 3000

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Test Credentials

Use these credentials to test different role permissions:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@disaster.gov | admin123 |
| Operator | operator@disaster.gov | operator123 |
| Field Officer | field@disaster.gov | field123 |
| Warehouse Manager | warehouse@disaster.gov | warehouse123 |
| Finance Officer | finance@disaster.gov | finance123 |

## System Architecture

```
┌─────────────────┐
│  React Frontend │ :3000
│   (Vite + Tailwind)
└────────┬────────┘
         │ HTTP/REST + JWT
         ▼
┌─────────────────┐
│  Express API    │ :5000
│  (Node.js + Prisma)
└────────┬────────┘
         │ Prisma ORM
         ▼
┌─────────────────┐
│  MySQL Database │ :3306
│  (Views + Triggers)
└─────────────────┘
```

## Project Structure

```
.
├── backend/
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── routes/           # API routes
│   ├── middleware/       # Auth & RBAC
│   ├── utils/            # Helpers
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   ├── seed.js       # Initial data
│   │   └── migrations/   # SQL migrations
│   └── server.js         # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React Context (Auth)
│   │   ├── api/          # Axios client
│   │   └── App.jsx       # Main app component
│   └── index.html
│
└── docker-compose.yml    # Container orchestration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Update password

### Emergency Reports
- `GET /api/reports` - List reports (paginated, filterable)
- `POST /api/reports` - Create report
- `GET /api/reports/:id` - Get single report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report (admin only)

### Rescue Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `POST /api/teams/:id/assign` - Assign team to incident

### Resources
- `GET /api/resources` - List resources
- `POST /api/resources` - Create resource
- `POST /api/resources/:id/allocate` - Request allocation

### Hospitals
- `GET /api/hospitals` - List hospitals
- `POST /api/hospitals/:id/admit` - Admit patient
- `POST /api/hospitals/:id/discharge/:patientId` - Discharge patient

### Finance
- `GET /api/finance/donations` - List donations
- `POST /api/finance/donations` - Record donation
- `GET /api/finance/expenses` - List expenses
- `POST /api/finance/expenses` - Record expense
- `GET /api/finance/summary` - Financial summary

### Approvals
- `GET /api/approvals` - List approval workflows
- `POST /api/approvals/:id/resolve` - Approve/reject request

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/incidents` - Incident distribution
- `GET /api/analytics/resources` - Resource utilization
- `GET /api/analytics/finance` - Financial breakdown

### Admin
- `GET /api/users` - List users (admin only)
- `GET /api/audit` - Audit logs (admin only)

## Database Schema

The system uses 14 main models:
- User
- DisasterEvent
- EmergencyReport
- RescueTeam
- TeamAssignment
- Warehouse
- Resource
- ResourceAllocation
- Hospital
- Patient
- Donation
- Expense
- ApprovalWorkflow
- AuditLog

### Custom Database Features

**Views:**
- `v_active_incidents` - Active incidents with team assignments
- `v_resource_stock` - Inventory with low-stock flags
- `v_financial_summary` - Financial aggregates per event
- `v_hospital_capacity` - Hospital occupancy rates
- `v_team_history` - Team deployment history

**Triggers:**
- `after_allocation_approved` - Deduct stock on approval
- `prevent_negative_stock` - Prevent negative quantities
- `after_team_assignment_insert` - Update team status
- `after_team_assignment_complete` - Reset team status
- `log_report_status_change` - Audit status changes

## Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

## Role Permissions

| Feature | Admin | Operator | Field Officer | Warehouse Manager | Finance Officer |
|---------|-------|----------|---------------|-------------------|-----------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Emergency Reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| Rescue Teams | ✅ | ✅ | ✅ | ❌ | ❌ |
| Resources | ✅ | ❌ | ❌ | ✅ | ❌ |
| Hospitals | ✅ | ✅ | ❌ | ❌ | ❌ |
| Finance | ✅ | ❌ | ❌ | ❌ | ✅ |
| Approvals | ✅ | ❌ | ❌ | ✅ | ❌ |
| Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | ❌ | ❌ | ❌ |

## Security Features

- **JWT Authentication** - Stateless token-based auth
- **Password Hashing** - bcrypt with 12 salt rounds
- **RBAC Middleware** - Role-based endpoint protection
- **CORS Configuration** - Restricted origins
- **SQL Injection Prevention** - Prisma parameterized queries
- **Audit Logging** - Immutable activity tracking

## Performance Optimizations

- **Custom Indexes** - 8 strategic indexes on high-frequency columns
- **Database Views** - Pre-computed complex queries
- **Pagination** - All list endpoints support pagination
- **Connection Pooling** - Prisma connection management
- **Docker Volumes** - Persistent data storage

## Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
docker-compose ps

# View MySQL logs
docker-compose logs mysql

# Restart services
docker-compose restart
```

### Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up --build frontend
```

### Backend API Errors
```bash
# Check backend logs
docker-compose logs backend

# Run migrations manually
docker-compose exec backend npx prisma migrate deploy
```

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue in the repository.
