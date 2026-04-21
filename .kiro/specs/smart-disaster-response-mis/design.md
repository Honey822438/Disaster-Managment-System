# Design Document

## Overview

The Smart Disaster Response Management Information System (MIS) is a full-stack enterprise web application designed to coordinate disaster response operations across multiple government stakeholders. The system provides real-time emergency report management, rescue team coordination, warehouse inventory tracking, hospital capacity management, financial transaction recording, and approval-based workflows.

### System Architecture

The system follows a **3-tier architecture**:

1. **Presentation Layer**: React-based single-page application (SPA) with role-specific dashboards
2. **Application Layer**: Node.js/Express REST API with JWT authentication and RBAC middleware
3. **Data Layer**: MySQL relational database managed via Prisma ORM

All services are containerized using Docker Compose for single-command deployment.

### Technology Stack

**Backend:**
- Runtime: Node.js (v18+)
- Framework: Express.js
- ORM: Prisma
- Database: MySQL 8.0
- Authentication: JWT (jsonwebtoken) + bcrypt (saltRounds=12)
- Validation: express-validator

**Frontend:**
- Framework: React 18 (Vite)
- Routing: React Router v6
- HTTP Client: Axios
- Styling: Tailwind CSS
- Charts: Recharts
- State Management: React Context API

**DevOps:**
- Containerization: Docker + Docker Compose
- Database Migrations: Prisma Migrate
- Seeding: Prisma Seed

### Design Principles

1. **Role-Based Access Control**: All operations are restricted by user role at both API and UI levels
2. **ACID Compliance**: Multi-step operations use Prisma transactions to ensure atomicity
3. **Audit Trail**: All significant actions are logged immutably in the AuditLog table
4. **Performance**: Custom indexes on high-frequency query columns
5. **Separation of Concerns**: Clear boundaries between authentication, business logic, and data access layers

---

## Architecture

### System Context Diagram

```mermaid
graph TB
    subgraph "External Actors"
        Admin[Administrator]
        Operator[Emergency Operator]
        Field[Field Officer]
        Warehouse[Warehouse Manager]
        Finance[Finance Officer]
    end
    
    subgraph "Smart Disaster Response MIS"
        Frontend[React Frontend<br/>Port 3000]
        Backend[Express API<br/>Port 5000]
        Database[(MySQL Database<br/>Port 3306)]
    end
    
    Admin --> Frontend
    Operator --> Frontend
    Field --> Frontend
    Warehouse --> Frontend
    Finance --> Frontend
    
    Frontend -->|HTTP/REST + JWT| Backend
    Backend -->|Prisma ORM| Database
```

### Container Architecture

```mermaid
graph LR
    subgraph "Docker Compose Environment"
        Frontend[frontend<br/>React + Vite<br/>:3000]
        Backend[backend<br/>Node.js + Express<br/>:5000]
        MySQL[(mysql<br/>MySQL 8.0<br/>:3306)]
    end
    
    Frontend -->|API Requests| Backend
    Backend -->|Prisma Client| MySQL
    MySQL -->|Named Volume| Storage[Persistent Storage]
```

### Application Layer Architecture

```mermaid
graph TB
    subgraph "Express API"
        Router[Express Router]
        Auth[Auth Middleware<br/>JWT Verification]
        RBAC[RBAC Middleware<br/>Role Check]
        Controllers[Controllers Layer]
        Services[Services Layer]
        Prisma[Prisma Client]
    end
    
    Request[HTTP Request] --> Router
    Router --> Auth
    Auth --> RBAC
    RBAC --> Controllers
    Controllers --> Services
    Services --> Prisma
    Prisma --> DB[(MySQL)]
```

### Frontend Architecture

```mermaid
graph TB
    subgraph "React Application"
        Router[React Router]
        Auth[Auth Context<br/>JWT Storage]
        Pages[Page Components]
        Components[Reusable Components]
        API[Axios API Client]
    end
    
    Browser[Browser] --> Router
    Router --> Auth
    Auth --> Pages
    Pages --> Components
    Components --> API
    API -->|HTTP + JWT| Backend[Express API]
```

---

## Components and Interfaces

### Backend Components

#### 1. Authentication Module (`/api/auth`)

**Responsibilities:**
- User registration with bcrypt password hashing
- Login with JWT token generation
- Password change with verification
- Current user profile retrieval

**Endpoints:**
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and return JWT
- `GET /api/auth/me` - Get authenticated user profile
- `POST /api/auth/change-password` - Update user password

**JWT Payload Structure:**
```typescript
{
  id: number,
  username: string,
  email: string,
  role: 'admin' | 'operator' | 'field_officer' | 'warehouse_manager' | 'finance_officer'
}
```

#### 2. Emergency Reports Module (`/api/reports`)

**Responsibilities:**
- Create, read, update, delete emergency reports
- Filter by location, disaster type, severity, status
- Paginated list retrieval
- Status change tracking via database trigger

**Endpoints:**
- `POST /api/reports` - Create emergency report
- `GET /api/reports` - List reports (paginated, filterable)
- `GET /api/reports/:id` - Get single report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report (admin only)

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `location` (optional filter)
- `disasterType` (optional filter)
- `severity` (optional filter)
- `status` (optional filter)

#### 3. Disaster Events Module (`/api/events`)

**Responsibilities:**
- CRUD operations for disaster events
- Cascade protection for active events
- Event-based grouping for reports and resources

**Endpoints:**
- `POST /api/events` - Create disaster event
- `GET /api/events` - List events (paginated)
- `GET /api/events/:id` - Get single event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event (with cascade check)

#### 4. Rescue Teams Module (`/api/teams`)

**Responsibilities:**
- CRUD operations for rescue teams
- Team assignment to incidents
- Status management (Available, Assigned, Busy)
- Assignment history tracking

**Endpoints:**
- `POST /api/teams` - Create rescue team
- `GET /api/teams` - List teams (paginated, filterable)
- `GET /api/teams/:id` - Get single team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/assign` - Assign team to incident

#### 5. Resources Module (`/api/resources`)

**Responsibilities:**
- CRUD operations for warehouses and resources
- Stock level tracking with low-stock alerts
- Resource allocation request creation
- Warehouse-grouped inventory views

**Endpoints:**
- `POST /api/resources/warehouses` - Create warehouse
- `GET /api/resources/warehouses` - List warehouses
- `PUT /api/resources/warehouses/:id` - Update warehouse
- `DELETE /api/resources/warehouses/:id` - Delete warehouse
- `POST /api/resources` - Create resource
- `GET /api/resources` - List resources (with low-stock flags)
- `GET /api/resources/:id` - Get single resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource
- `POST /api/resources/:id/allocate` - Request resource allocation

#### 6. Hospitals Module (`/api/hospitals`)

**Responsibilities:**
- CRUD operations for hospitals
- Patient admission with bed count management
- Patient discharge with bed count restoration
- Capacity tracking and load balancing

**Endpoints:**
- `POST /api/hospitals` - Create hospital
- `GET /api/hospitals` - List hospitals
- `GET /api/hospitals/available` - List hospitals by available beds (descending)
- `GET /api/hospitals/:id` - Get single hospital
- `PUT /api/hospitals/:id` - Update hospital
- `DELETE /api/hospitals/:id` - Delete hospital
- `POST /api/hospitals/:id/admit` - Admit patient (transactional)
- `POST /api/hospitals/:id/discharge/:patientId` - Discharge patient (transactional)

#### 7. Finance Module (`/api/finance`)

**Responsibilities:**
- Record donations and expenses
- Financial summary aggregation
- Event-based financial tracking
- Audit logging for all transactions

**Endpoints:**
- `POST /api/finance/donations` - Record donation
- `GET /api/finance/donations` - List donations (paginated, filterable)
- `POST /api/finance/expenses` - Record expense
- `GET /api/finance/expenses` - List expenses (paginated, filterable)
- `GET /api/finance/summary` - Get financial summary

**Query Parameters:**
- `page`, `limit` (pagination)
- `startDate`, `endDate` (date range filter)
- `eventId` (disaster event filter)

#### 8. Approvals Module (`/api/approvals`)

**Responsibilities:**
- List pending approval workflows
- Approve or reject resource allocations
- Transactional stock deduction on approval
- Approval history tracking

**Endpoints:**
- `GET /api/approvals` - List approval workflows (paginated, filterable)
- `POST /api/approvals/:id/resolve` - Approve or reject request

**Resolve Request Body:**
```json
{
  "decision": "approved" | "rejected",
  "comment": "Optional comment"
}
```

#### 9. Analytics Module (`/api/analytics`)

**Responsibilities:**
- Dashboard summary metrics
- Incident distribution analysis
- Resource utilization tracking
- Response time calculation
- Financial summaries by event

**Endpoints:**
- `GET /api/analytics/dashboard` - Summary metrics
- `GET /api/analytics/incidents` - Incident distribution
- `GET /api/analytics/resources` - Resource utilization
- `GET /api/analytics/response-time` - Average response times
- `GET /api/analytics/finance` - Financial breakdown

#### 10. Audit Module (`/api/audit`)

**Responsibilities:**
- Retrieve audit log entries
- Filter by actor, entity type, action, date range
- Read-only access (admin only)

**Endpoints:**
- `GET /api/audit` - List audit logs (paginated, filterable)

#### 11. Users Module (`/api/users`)

**Responsibilities:**
- User account management (admin only)
- Role assignment
- User listing and search

**Endpoints:**
- `GET /api/users` - List users (paginated)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Frontend Components

#### Page Components

1. **LoginPage** - Authentication form
2. **DashboardPage** - Summary metrics and quick actions
3. **EmergencyReportsPage** - Report table with filters and create form
4. **RescueTeamsPage** - Team table with assignment actions
5. **ResourcesPage** - Warehouse-grouped inventory with allocation
6. **HospitalsPage** - Capacity dashboard with admit/discharge
7. **FinancePage** - Donation/expense tables with summary
8. **ApprovalsPage** - Pending approvals with resolve actions
9. **UsersPage** - User management (admin only)
10. **AuditLogsPage** - Audit log viewer (admin only)
11. **AnalyticsPage** - Charts and visualizations

#### Reusable Components

1. **Sidebar** - Role-based navigation
2. **MetricCard** - Dashboard summary card
3. **DataTable** - Paginated table with filters
4. **FilterBar** - Query parameter filter controls
5. **StatusBadge** - Color-coded status indicator
6. **CapacityBar** - Visual capacity indicator
7. **LoadingSpinner** - Loading state indicator
8. **Toast** - Error/success notification
9. **Modal** - Confirmation dialogs
10. **FormField** - Input with validation display

#### Context Providers

1. **AuthContext** - JWT storage, login/logout, user profile
2. **ThemeContext** - Dark mode emergency ops aesthetic

#### API Client

**Axios Instance Configuration:**
```typescript
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Interface Contracts

#### Pagination Response Format

All paginated endpoints return:
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

#### Error Response Format

All error responses follow:
```json
{
  "error": "Error message",
  "details": "Optional detailed explanation",
  "field": "Optional field name for validation errors"
}
```

---

## Data Models

### Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum Role {
  admin
  operator
  field_officer
  warehouse_manager
  finance_officer
}

enum DisasterType {
  Flood
  Earthquake
  Fire
  Cyclone
  Landslide
  Other
}

enum Severity {
  Low
  Medium
  High
  Critical
}

enum ReportStatus {
  Pending
  Assigned
  InProgress
  Resolved
  Closed
}

enum TeamType {
  Medical
  Fire
  Rescue
  Relief
}

enum TeamStatus {
  Available
  Assigned
  Busy
}

enum ResourceType {
  Food
  Water
  Medicine
  Shelter
  Equipment
  Other
}

enum AllocationStatus {
  pending
  approved
  rejected
}

enum PatientStatus {
  admitted
  discharged
  transferred
}

enum ExpenseCategory {
  Medical
  Transport
  Equipment
  Personnel
  Infrastructure
  Other
}

enum ApprovalType {
  ResourceAllocation
  BudgetRequest
  TeamDeployment
}

enum ApprovalStatus {
  pending
  approved
  rejected
}

// ============================================
// MODELS
// ============================================

model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique @db.VarChar(50)
  email     String   @unique @db.VarChar(100)
  password  String   @db.VarChar(255)
  role      Role
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  auditLogs         AuditLog[]
  approvalWorkflows ApprovalWorkflow[]

  @@index([email])
  @@index([role])
}

model DisasterEvent {
  id          Int          @id @default(autoincrement())
  name        String       @db.VarChar(100)
  type        DisasterType
  location    String       @db.VarChar(255)
  startDate   DateTime
  endDate     DateTime?
  description String?      @db.Text
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // Relations
  emergencyReports    EmergencyReport[]
  resourceAllocations ResourceAllocation[]
  donations           Donation[]
  expenses            Expense[]

  @@index([type])
  @@index([startDate])
}

model EmergencyReport {
  id             Int          @id @default(autoincrement())
  location       String       @db.VarChar(255)
  disasterType   DisasterType
  severity       Severity
  description    String       @db.Text
  reportedBy     String?      @db.VarChar(100)
  contactNumber  String?      @db.VarChar(20)
  status         ReportStatus @default(Pending)
  reportedAt     DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  disasterEventId Int?

  // Relations
  disasterEvent    DisasterEvent?    @relation(fields: [disasterEventId], references: [id], onDelete: SetNull)
  teamAssignments  TeamAssignment[]
  patients         Patient[]

  // Custom Indexes (Requirement 15)
  @@index([location], name: "idx_reports_location")
  @@index([disasterType, severity], name: "idx_reports_type_severity")
  @@index([reportedAt, status], name: "idx_reports_date_status")
}

model RescueTeam {
  id          Int        @id @default(autoincrement())
  name        String     @db.VarChar(100)
  type        TeamType
  location    String     @db.VarChar(255)
  status      TeamStatus @default(Available)
  memberCount Int
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relations
  teamAssignments TeamAssignment[]

  @@index([status])
  @@index([type])
}

model TeamAssignment {
  id                Int          @id @default(autoincrement())
  rescueTeamId      Int
  emergencyReportId Int
  assignedAt        DateTime     @default(now())
  completedAt       DateTime?
  status            ReportStatus @default(Assigned)
  notes             String?      @db.Text

  // Relations
  rescueTeam      RescueTeam      @relation(fields: [rescueTeamId], references: [id], onDelete: Cascade)
  emergencyReport EmergencyReport @relation(fields: [emergencyReportId], references: [id], onDelete: Cascade)

  @@index([rescueTeamId])
  @@index([emergencyReportId])
  @@index([status])
}

model Warehouse {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(100)
  location  String   @db.VarChar(255)
  capacity  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  resources Resource[]

  @@index([location])
}

model Resource {
  id           Int          @id @default(autoincrement())
  name         String       @db.VarChar(100)
  resourceType ResourceType
  quantity     Int
  threshold    Int          @default(100)
  unit         String       @db.VarChar(50)
  warehouseId  Int
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  // Relations
  warehouse           Warehouse            @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  resourceAllocations ResourceAllocation[]

  // Custom Index (Requirement 15)
  @@index([resourceType, quantity], name: "idx_resources_type_qty")
  @@index([warehouseId])
}

model ResourceAllocation {
  id              Int              @id @default(autoincrement())
  resourceId      Int
  disasterEventId Int
  quantity        Int
  status          AllocationStatus @default(pending)
  requestedBy     String           @db.VarChar(100)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  // Relations
  resource      Resource         @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  disasterEvent DisasterEvent    @relation(fields: [disasterEventId], references: [id], onDelete: Cascade)
  approvalWorkflow ApprovalWorkflow?

  // Custom Index (Requirement 15)
  @@index([status, createdAt], name: "idx_allocations_status_date")
  @@index([resourceId])
  @@index([disasterEventId])
}

model Hospital {
  id            Int      @id @default(autoincrement())
  name          String   @db.VarChar(100)
  location      String   @db.VarChar(255)
  totalBeds     Int
  availableBeds Int
  contactNumber String   @db.VarChar(20)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  patients Patient[]

  @@index([location])
}

model Patient {
  id                Int           @id @default(autoincrement())
  name              String        @db.VarChar(100)
  age               Int
  gender            String        @db.VarChar(10)
  condition         String        @db.Text
  status            PatientStatus @default(admitted)
  hospitalId        Int
  emergencyReportId Int?
  admittedAt        DateTime      @default(now())
  dischargedAt      DateTime?

  // Relations
  hospital        Hospital         @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  emergencyReport EmergencyReport? @relation(fields: [emergencyReportId], references: [id], onDelete: SetNull)

  @@index([hospitalId])
  @@index([status])
}

model Donation {
  id              Int       @id @default(autoincrement())
  donorName       String    @db.VarChar(100)
  organization    String?   @db.VarChar(100)
  amount          Decimal   @db.Decimal(15, 2)
  disasterEventId Int
  donatedAt       DateTime  @default(now())
  createdAt       DateTime  @default(now())

  // Relations
  disasterEvent DisasterEvent @relation(fields: [disasterEventId], references: [id], onDelete: Cascade)

  // Custom Index (Requirement 15)
  @@index([donatedAt], name: "idx_donations_date")
  @@index([disasterEventId])
}

model Expense {
  id              Int             @id @default(autoincrement())
  category        ExpenseCategory
  amount          Decimal         @db.Decimal(15, 2)
  description     String          @db.Text
  disasterEventId Int
  createdAt       DateTime        @default(now())

  // Relations
  disasterEvent DisasterEvent @relation(fields: [disasterEventId], references: [id], onDelete: Cascade)

  // Custom Index (Requirement 15)
  @@index([category, createdAt], name: "idx_expenses_category_date")
  @@index([disasterEventId])
}

model ApprovalWorkflow {
  id                   Int            @id @default(autoincrement())
  type                 ApprovalType
  status               ApprovalStatus @default(pending)
  requesterId          Int
  resolverId           Int?
  resourceAllocationId Int?           @unique
  comment              String?        @db.Text
  createdAt            DateTime       @default(now())
  resolvedAt           DateTime?

  // Relations
  requester          User                @relation(fields: [requesterId], references: [id], onDelete: Cascade)
  resourceAllocation ResourceAllocation? @relation(fields: [resourceAllocationId], references: [id], onDelete: Cascade)

  @@index([status])
  @@index([type])
  @@index([requesterId])
}

model AuditLog {
  id            Int      @id @default(autoincrement())
  userId        Int?
  action        String   @db.VarChar(100)
  entityType    String   @db.VarChar(50)
  entityId      Int?
  previousState String?  @db.Text
  newState      String?  @db.Text
  createdAt     DateTime @default(now())

  // Relations
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  // Custom Index (Requirement 15)
  @@index([createdAt, userId], name: "idx_audit_date_user")
  @@index([entityType])
  @@index([action])
}
```

### Database Views (Requirement 13)

The following views simplify complex reporting queries and enforce role-appropriate data visibility:

#### 1. v_active_incidents

Joins EmergencyReport, DisasterEvent, and TeamAssignment to present active incidents with assigned team status.

```sql
CREATE VIEW v_active_incidents AS
SELECT 
  er.id AS report_id,
  er.location,
  er.disasterType,
  er.severity,
  er.status AS report_status,
  er.reportedAt,
  de.name AS event_name,
  de.type AS event_type,
  rt.name AS team_name,
  rt.type AS team_type,
  ta.status AS assignment_status,
  ta.assignedAt
FROM EmergencyReport er
LEFT JOIN DisasterEvent de ON er.disasterEventId = de.id
LEFT JOIN TeamAssignment ta ON er.id = ta.emergencyReportId
LEFT JOIN RescueTeam rt ON ta.rescueTeamId = rt.id
WHERE er.status IN ('Pending', 'Assigned', 'InProgress');
```

#### 2. v_resource_stock

Joins Resource and Warehouse to present current stock levels, thresholds, and low-stock flags per warehouse.

```sql
CREATE VIEW v_resource_stock AS
SELECT 
  r.id AS resource_id,
  r.name AS resource_name,
  r.resourceType,
  r.quantity,
  r.threshold,
  r.unit,
  w.name AS warehouse_name,
  w.location AS warehouse_location,
  CASE WHEN r.quantity < r.threshold THEN TRUE ELSE FALSE END AS lowStock
FROM Resource r
INNER JOIN Warehouse w ON r.warehouseId = w.id;
```

#### 3. v_financial_summary

Aggregates Donation and Expense records per DisasterEvent to present net balance and transaction counts.

```sql
CREATE VIEW v_financial_summary AS
SELECT 
  de.id AS event_id,
  de.name AS event_name,
  COALESCE(SUM(d.amount), 0) AS total_donations,
  COALESCE(SUM(e.amount), 0) AS total_expenses,
  COALESCE(SUM(d.amount), 0) - COALESCE(SUM(e.amount), 0) AS net_balance,
  COUNT(DISTINCT d.id) AS donation_count,
  COUNT(DISTINCT e.id) AS expense_count
FROM DisasterEvent de
LEFT JOIN Donation d ON de.id = d.disasterEventId
LEFT JOIN Expense e ON de.id = e.disasterEventId
GROUP BY de.id, de.name;
```

#### 4. v_hospital_capacity

Joins Hospital and Patient to present current occupancy, available beds, and critical patient count per hospital.

```sql
CREATE VIEW v_hospital_capacity AS
SELECT 
  h.id AS hospital_id,
  h.name AS hospital_name,
  h.location,
  h.totalBeds,
  h.availableBeds,
  h.totalBeds - h.availableBeds AS occupied_beds,
  COUNT(p.id) AS current_patients,
  SUM(CASE WHEN p.status = 'admitted' THEN 1 ELSE 0 END) AS admitted_count,
  ROUND((h.totalBeds - h.availableBeds) / h.totalBeds * 100, 2) AS occupancy_rate
FROM Hospital h
LEFT JOIN Patient p ON h.id = p.hospitalId AND p.status = 'admitted'
GROUP BY h.id, h.name, h.location, h.totalBeds, h.availableBeds;
```

#### 5. v_team_history

Joins RescueTeam and TeamAssignment to present the full deployment history per team with timestamps.

```sql
CREATE VIEW v_team_history AS
SELECT 
  rt.id AS team_id,
  rt.name AS team_name,
  rt.type AS team_type,
  ta.id AS assignment_id,
  er.location AS incident_location,
  er.disasterType,
  er.severity,
  ta.assignedAt,
  ta.completedAt,
  ta.status AS assignment_status,
  TIMESTAMPDIFF(HOUR, ta.assignedAt, COALESCE(ta.completedAt, NOW())) AS duration_hours
FROM RescueTeam rt
LEFT JOIN TeamAssignment ta ON rt.id = ta.rescueTeamId
LEFT JOIN EmergencyReport er ON ta.emergencyReportId = er.id
ORDER BY rt.id, ta.assignedAt DESC;
```

### Database Triggers (Requirement 14)

#### 1. after_allocation_approved

Fires AFTER an UPDATE on ResourceAllocation when status changes to `approved`, deducting allocated quantity from Resource stock.

```sql
DELIMITER $$

CREATE TRIGGER after_allocation_approved
AFTER UPDATE ON ResourceAllocation
FOR EACH ROW
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE Resource
    SET quantity = quantity - NEW.quantity
    WHERE id = NEW.resourceId;
  END IF;
END$$

DELIMITER ;
```

#### 2. prevent_negative_stock

Fires BEFORE an UPDATE on Resource when quantity is modified, raising an error if new quantity would be negative.

```sql
DELIMITER $$

CREATE TRIGGER prevent_negative_stock
BEFORE UPDATE ON Resource
FOR EACH ROW
BEGIN
  IF NEW.quantity < 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Resource quantity cannot be negative';
  END IF;
END$$

DELIMITER ;
```

#### 3. after_team_assignment_insert

Fires AFTER an INSERT on TeamAssignment, updating corresponding RescueTeam status to `Assigned`.

```sql
DELIMITER $$

CREATE TRIGGER after_team_assignment_insert
AFTER INSERT ON TeamAssignment
FOR EACH ROW
BEGIN
  UPDATE RescueTeam
  SET status = 'Assigned'
  WHERE id = NEW.rescueTeamId;
END$$

DELIMITER ;
```

#### 4. after_team_assignment_complete

Fires AFTER an UPDATE on TeamAssignment when status changes to `Resolved` or `Closed`, updating RescueTeam status to `Available`.

```sql
DELIMITER $$

CREATE TRIGGER after_team_assignment_complete
AFTER UPDATE ON TeamAssignment
FOR EACH ROW
BEGIN
  IF NEW.status IN ('Resolved', 'Closed') AND OLD.status NOT IN ('Resolved', 'Closed') THEN
    UPDATE RescueTeam
    SET status = 'Available'
    WHERE id = NEW.rescueTeamId;
  END IF;
END$$

DELIMITER ;
```

#### 5. log_report_status_change

Fires AFTER an UPDATE on EmergencyReport when status changes, inserting a record into AuditLog.

```sql
DELIMITER $$

CREATE TRIGGER log_report_status_change
AFTER UPDATE ON EmergencyReport
FOR EACH ROW
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO AuditLog (userId, action, entityType, entityId, previousState, newState, createdAt)
    VALUES (
      NULL,
      'STATUS_CHANGE',
      'EmergencyReport',
      NEW.id,
      JSON_OBJECT('status', OLD.status),
      JSON_OBJECT('status', NEW.status),
      NOW()
    );
  END IF;
END$$

DELIMITER ;
```

---

## Security Design

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    
    User->>Frontend: Enter credentials
    Frontend->>API: POST /api/auth/login
    API->>Database: Query User by email
    Database-->>API: User record
    API->>API: bcrypt.compare(password, hash)
    alt Password valid
        API->>API: jwt.sign(payload, secret)
        API-->>Frontend: { token, user }
        Frontend->>Frontend: localStorage.setItem('token')
        Frontend-->>User: Redirect to Dashboard
    else Password invalid
        API-->>Frontend: 401 Unauthorized
        Frontend-->>User: Display error
    end
```

### JWT Authentication

**Token Generation:**
```javascript
const jwt = require('jsonwebtoken');

function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
}
```

**Token Verification Middleware:**
```javascript
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}
```

### Password Hashing

**Registration:**
```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

async function registerUser(username, email, password, role) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role
    }
  });
  
  return user;
}
```

**Login Verification:**
```javascript
async function loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    throw new Error('Invalid password');
  }
  
  const token = generateToken(user);
  return { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } };
}
```

### Role-Based Access Control (RBAC)

**RBAC Middleware:**
```javascript
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }
    
    next();
  };
}
```

**Usage Example:**
```javascript
// Only admin and operator can create emergency reports
router.post('/reports', 
  authenticateToken, 
  requireRole('admin', 'operator'), 
  createEmergencyReport
);

// Only admin can delete users
router.delete('/users/:id', 
  authenticateToken, 
  requireRole('admin'), 
  deleteUser
);
```

### Role Permission Matrix

| Resource | Create | Read | Update | Delete | Special Actions |
|----------|--------|------|--------|--------|-----------------|
| **EmergencyReport** | admin, operator | all | admin, operator, field_officer | admin | - |
| **RescueTeam** | admin, operator | all | admin, operator | admin | assign: admin, operator |
| **Resource** | admin, warehouse_manager | all | admin, warehouse_manager | admin | allocate: admin, warehouse_manager |
| **Hospital** | admin | all | admin, operator | admin | admit/discharge: admin, operator |
| **Donation** | admin, finance_officer | all | admin, finance_officer | admin | - |
| **Expense** | admin, finance_officer | all | admin, finance_officer | admin | - |
| **ApprovalWorkflow** | system | all | admin, warehouse_manager | - | resolve: admin, warehouse_manager |
| **User** | admin | admin | admin | admin | - |
| **AuditLog** | system | admin | - | - | - |

### CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Input Validation

**Using express-validator:**
```javascript
const { body, validationResult } = require('express-validator');

const validateEmergencyReport = [
  body('location').notEmpty().trim().isLength({ max: 255 }),
  body('disasterType').isIn(['Flood', 'Earthquake', 'Fire', 'Cyclone', 'Landslide', 'Other']),
  body('severity').isIn(['Low', 'Medium', 'High', 'Critical']),
  body('description').notEmpty().trim(),
  body('contactNumber').optional().isMobilePhone(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

router.post('/reports', authenticateToken, requireRole('admin', 'operator'), validateEmergencyReport, createEmergencyReport);
```

### SQL Injection Prevention

Prisma ORM provides automatic parameterization and escaping, preventing SQL injection:

```javascript
// Safe - Prisma parameterizes automatically
const reports = await prisma.emergencyReport.findMany({
  where: {
    location: userInput, // Automatically escaped
    severity: 'High'
  }
});
```

---

## Transaction Design

### Transactional Operations

All multi-step database operations use Prisma transactions to ensure ACID compliance.

#### 1. Patient Admission (Hospital Bed Management)

```javascript
async function admitPatient(hospitalId, patientData) {
  return await prisma.$transaction(async (tx) => {
    // Check hospital capacity
    const hospital = await tx.hospital.findUnique({
      where: { id: hospitalId }
    });
    
    if (!hospital) {
      throw new Error('Hospital not found');
    }
    
    if (hospital.availableBeds <= 0) {
      throw new Error('Hospital at full capacity');
    }
    
    // Create patient record
    const patient = await tx.patient.create({
      data: {
        ...patientData,
        hospitalId,
        status: 'admitted'
      }
    });
    
    // Decrement available beds
    await tx.hospital.update({
      where: { id: hospitalId },
      data: {
        availableBeds: {
          decrement: 1
        }
      }
    });
    
    // Create audit log
    await tx.auditLog.create({
      data: {
        userId: patientData.admittedBy,
        action: 'PATIENT_ADMITTED',
        entityType: 'Patient',
        entityId: patient.id,
        newState: JSON.stringify(patient)
      }
    });
    
    return patient;
  });
}
```

#### 2. Patient Discharge

```javascript
async function dischargePatient(hospitalId, patientId, userId) {
  return await prisma.$transaction(async (tx) => {
    // Update patient status
    const patient = await tx.patient.update({
      where: { id: patientId },
      data: {
        status: 'discharged',
        dischargedAt: new Date()
      }
    });
    
    // Increment available beds
    await tx.hospital.update({
      where: { id: hospitalId },
      data: {
        availableBeds: {
          increment: 1
        }
      }
    });
    
    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: 'PATIENT_DISCHARGED',
        entityType: 'Patient',
        entityId: patientId,
        newState: JSON.stringify(patient)
      }
    });
    
    return patient;
  });
}
```

#### 3. Resource Allocation Approval

```javascript
async function approveResourceAllocation(approvalId, resolverId, comment) {
  return await prisma.$transaction(async (tx) => {
    // Get approval workflow
    const approval = await tx.approvalWorkflow.findUnique({
      where: { id: approvalId },
      include: { resourceAllocation: true }
    });
    
    if (!approval) {
      throw new Error('Approval not found');
    }
    
    if (approval.status !== 'pending') {
      throw new Error('Approval already resolved');
    }
    
    const allocation = approval.resourceAllocation;
    
    // Check resource availability
    const resource = await tx.resource.findUnique({
      where: { id: allocation.resourceId }
    });
    
    if (resource.quantity < allocation.quantity) {
      throw new Error('Insufficient resource quantity');
    }
    
    // Update approval workflow
    await tx.approvalWorkflow.update({
      where: { id: approvalId },
      data: {
        status: 'approved',
        resolverId,
        comment,
        resolvedAt: new Date()
      }
    });
    
    // Update resource allocation
    await tx.resourceAllocation.update({
      where: { id: allocation.id },
      data: {
        status: 'approved'
      }
    });
    
    // Deduct resource quantity
    await tx.resource.update({
      where: { id: allocation.resourceId },
      data: {
        quantity: {
          decrement: allocation.quantity
        }
      }
    });
    
    // Create audit log
    await tx.auditLog.create({
      data: {
        userId: resolverId,
        action: 'ALLOCATION_APPROVED',
        entityType: 'ResourceAllocation',
        entityId: allocation.id,
        newState: JSON.stringify({ status: 'approved', quantity: allocation.quantity })
      }
    });
    
    return approval;
  });
}
```

#### 4. Team Assignment

```javascript
async function assignTeamToIncident(teamId, reportId, userId) {
  return await prisma.$transaction(async (tx) => {
    // Check team availability
    const team = await tx.rescueTeam.findUnique({
      where: { id: teamId }
    });
    
    if (!team) {
      throw new Error('Team not found');
    }
    
    if (team.status !== 'Available') {
      throw new Error('Team not available');
    }
    
    // Create team assignment
    const assignment = await tx.teamAssignment.create({
      data: {
        rescueTeamId: teamId,
        emergencyReportId: reportId,
        status: 'Assigned'
      }
    });
    
    // Update team status (trigger will also do this, but we do it explicitly)
    await tx.rescueTeam.update({
      where: { id: teamId },
      data: {
        status: 'Assigned'
      }
    });
    
    // Update report status
    await tx.emergencyReport.update({
      where: { id: reportId },
      data: {
        status: 'Assigned'
      }
    });
    
    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: 'TEAM_ASSIGNED',
        entityType: 'TeamAssignment',
        entityId: assignment.id,
        newState: JSON.stringify(assignment)
      }
    });
    
    return assignment;
  });
}
```

### Concurrency Control

Prisma uses database-level locking within transactions to prevent race conditions:

```javascript
// Pessimistic locking for critical operations
async function allocateResourceWithLock(resourceId, quantity) {
  return await prisma.$transaction(async (tx) => {
    // Lock the resource row for update
    const resource = await tx.$queryRaw`
      SELECT * FROM Resource WHERE id = ${resourceId} FOR UPDATE
    `;
    
    if (resource[0].quantity < quantity) {
      throw new Error('Insufficient quantity');
    }
    
    // Perform allocation
    await tx.resource.update({
      where: { id: resourceId },
      data: {
        quantity: {
          decrement: quantity
        }
      }
    });
  });
}
```

---

## Performance Design

### Custom Indexes (Requirement 15)

The following indexes are defined in the Prisma schema to optimize high-frequency queries:

1. **idx_reports_location** - Single-column index on `EmergencyReport.location`
   - Optimizes: Location-based filtering in emergency report queries
   
2. **idx_reports_type_severity** - Composite index on `EmergencyReport.disasterType` and `severity`
   - Optimizes: Filtering reports by disaster type and severity level
   
3. **idx_reports_date_status** - Composite index on `EmergencyReport.reportedAt` and `status`
   - Optimizes: Time-range queries with status filtering
   
4. **idx_resources_type_qty** - Composite index on `Resource.resourceType` and `quantity`
   - Optimizes: Low-stock queries and resource type filtering
   
5. **idx_audit_date_user** - Composite index on `AuditLog.createdAt` and `userId`
   - Optimizes: Audit log queries by date range and user
   
6. **idx_allocations_status_date** - Composite index on `ResourceAllocation.status` and `createdAt`
   - Optimizes: Pending approval queries and allocation history
   
7. **idx_donations_date** - Single-column index on `Donation.donatedAt`
   - Optimizes: Financial reports by date range
   
8. **idx_expenses_category_date** - Composite index on `Expense.category` and `createdAt`
   - Optimizes: Expense reports by category and time period

### Query Optimization Strategies

#### 1. Pagination

All list endpoints use cursor-based or offset pagination:

```javascript
async function getEmergencyReports(page = 1, limit = 20, filters = {}) {
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    prisma.emergencyReport.findMany({
      where: filters,
      skip,
      take: limit,
      orderBy: { reportedAt: 'desc' },
      include: {
        disasterEvent: true,
        teamAssignments: {
          include: {
            rescueTeam: true
          }
        }
      }
    }),
    prisma.emergencyReport.count({ where: filters })
  ]);
  
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
```

#### 2. Selective Field Loading

Use Prisma's `select` to load only required fields:

```javascript
// Load only necessary fields for list views
const teams = await prisma.rescueTeam.findMany({
  select: {
    id: true,
    name: true,
    type: true,
    status: true,
    location: true
    // Exclude createdAt, updatedAt, memberCount if not needed
  }
});
```

#### 3. Eager Loading with Include

Prevent N+1 queries by using `include`:

```javascript
// Bad - N+1 query problem
const reports = await prisma.emergencyReport.findMany();
for (const report of reports) {
  const event = await prisma.disasterEvent.findUnique({
    where: { id: report.disasterEventId }
  });
}

// Good - Single query with join
const reports = await prisma.emergencyReport.findMany({
  include: {
    disasterEvent: true
  }
});
```

#### 4. Database Views for Complex Queries

Use pre-defined views for frequently accessed complex queries:

```javascript
// Query the v_active_incidents view instead of joining tables
const activeIncidents = await prisma.$queryRaw`
  SELECT * FROM v_active_incidents
  WHERE severity = 'Critical'
  ORDER BY reportedAt DESC
  LIMIT 20
`;
```

#### 5. Caching Strategy

Implement Redis caching for frequently accessed, slowly changing data:

```javascript
const redis = require('redis');
const client = redis.createClient();

async function getDashboardMetrics() {
  const cacheKey = 'dashboard:metrics';
  
  // Try cache first
  const cached = await client.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Compute metrics
  const metrics = {
    activeIncidents: await prisma.emergencyReport.count({
      where: { status: { in: ['Pending', 'Assigned', 'InProgress'] } }
    }),
    availableTeams: await prisma.rescueTeam.count({
      where: { status: 'Available' }
    }),
    lowStockResources: await prisma.resource.count({
      where: { quantity: { lt: prisma.raw('threshold') } }
    })
  };
  
  // Cache for 5 minutes
  await client.setEx(cacheKey, 300, JSON.stringify(metrics));
  
  return metrics;
}
```

### Connection Pooling

Prisma automatically manages connection pooling. Configure in `schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  
  // Connection pool configuration
  // DATABASE_URL format: mysql://user:password@host:port/database?connection_limit=10
}
```

---

## Error Handling

### API Error Response Format

All errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: string;           // Human-readable error message
  details?: string;        // Optional detailed explanation
  field?: string;          // Optional field name for validation errors
  code?: string;           // Optional error code
}
```

### Error Handling Middleware

```javascript
// Global error handler
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Unique constraint violation',
      details: `${err.meta.target} already exists`,
      code: 'DUPLICATE_ENTRY'
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found',
      code: 'NOT_FOUND'
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.message,
      code: 'VALIDATION_ERROR'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
}

app.use(errorHandler);
```

### Frontend Error Handling

```javascript
// Axios error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorResponse = error.response?.data;
    
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden - show permission error
      toast.error('You do not have permission to perform this action');
    } else if (error.response?.status === 404) {
      // Not found
      toast.error(errorResponse?.error || 'Resource not found');
    } else if (error.response?.status === 400) {
      // Validation error - handled by form
      return Promise.reject(errorResponse);
    } else {
      // Generic error
      toast.error(errorResponse?.error || 'An error occurred');
    }
    
    return Promise.reject(error);
  }
);
```

### Validation Error Display

```jsx
function EmergencyReportForm() {
  const [errors, setErrors] = useState({});
  
  const handleSubmit = async (formData) => {
    try {
      await apiClient.post('/reports', formData);
      toast.success('Report created successfully');
    } catch (error) {
      if (error.response?.status === 400) {
        // Display field-level errors
        const fieldErrors = {};
        error.response.data.errors?.forEach(err => {
          fieldErrors[err.param] = err.msg;
        });
        setErrors(fieldErrors);
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="location" />
      {errors.location && <span className="error">{errors.location}</span>}
      {/* ... */}
    </form>
  );
}
```

---

## Testing Strategy

### Testing Approach

The Smart Disaster Response MIS requires a comprehensive testing strategy covering:

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test API endpoints with database interactions
3. **End-to-End Tests**: Test complete user workflows through the UI
4. **Property-Based Tests**: Test universal properties across randomized inputs (where applicable)

### Backend Testing

**Framework**: Jest + Supertest

**Unit Tests:**
- Authentication functions (bcrypt hashing, JWT generation)
- RBAC middleware logic
- Input validation functions
- Business logic in service layer

**Integration Tests:**
- API endpoint responses
- Database transactions
- Trigger behavior
- View queries

**Example Integration Test:**
```javascript
describe('POST /api/hospitals/:id/admit', () => {
  it('should admit patient and decrement available beds', async () => {
    const hospital = await prisma.hospital.create({
      data: {
        name: 'Test Hospital',
        location: 'Test City',
        totalBeds: 100,
        availableBeds: 50,
        contactNumber: '1234567890'
      }
    });
    
    const response = await request(app)
      .post(`/api/hospitals/${hospital.id}/admit`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'John Doe',
        age: 35,
        gender: 'Male',
        condition: 'Fracture'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.patient.name).toBe('John Doe');
    
    const updatedHospital = await prisma.hospital.findUnique({
      where: { id: hospital.id }
    });
    
    expect(updatedHospital.availableBeds).toBe(49);
  });
  
  it('should reject admission when hospital is at capacity', async () => {
    const hospital = await prisma.hospital.create({
      data: {
        name: 'Full Hospital',
        location: 'Test City',
        totalBeds: 10,
        availableBeds: 0,
        contactNumber: '1234567890'
      }
    });
    
    const response = await request(app)
      .post(`/api/hospitals/${hospital.id}/admit`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Jane Doe',
        age: 28,
        gender: 'Female',
        condition: 'Burns'
      });
    
    expect(response.status).toBe(409);
    expect(response.body.error).toContain('capacity');
  });
});
```

### Frontend Testing

**Framework**: Vitest + React Testing Library

**Unit Tests:**
- Component rendering
- User interactions
- State management
- Form validation

**Example Component Test:**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmergencyReportForm from './EmergencyReportForm';

describe('EmergencyReportForm', () => {
  it('should display validation error for empty location', async () => {
    const onSubmit = vi.fn();
    render(<EmergencyReportForm onSubmit={onSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/location is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
  
  it('should submit form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<EmergencyReportForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/location/i), {
      target: { value: 'Downtown' }
    });
    fireEvent.change(screen.getByLabelText(/disaster type/i), {
      target: { value: 'Fire' }
    });
    fireEvent.change(screen.getByLabelText(/severity/i), {
      target: { value: 'High' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(onSubmit).toHaveBeenCalledWith({
      location: 'Downtown',
      disasterType: 'Fire',
      severity: 'High'
    });
  });
});
```

### Database Testing

**Trigger Tests:**
```javascript
describe('Database Triggers', () => {
  it('should update team status when assignment is created', async () => {
    const team = await prisma.rescueTeam.create({
      data: {
        name: 'Fire Team 1',
        type: 'Fire',
        location: 'Station A',
        status: 'Available',
        memberCount: 10
      }
    });
    
    const report = await prisma.emergencyReport.create({
      data: {
        location: 'Building Fire',
        disasterType: 'Fire',
        severity: 'High',
        description: 'Fire in commercial building'
      }
    });
    
    await prisma.teamAssignment.create({
      data: {
        rescueTeamId: team.id,
        emergencyReportId: report.id
      }
    });
    
    const updatedTeam = await prisma.rescueTeam.findUnique({
      where: { id: team.id }
    });
    
    expect(updatedTeam.status).toBe('Assigned');
  });
  
  it('should prevent negative resource quantity', async () => {
    const warehouse = await prisma.warehouse.create({
      data: {
        name: 'Main Warehouse',
        location: 'Central',
        capacity: 1000
      }
    });
    
    const resource = await prisma.resource.create({
      data: {
        name: 'Water Bottles',
        resourceType: 'Water',
        quantity: 10,
        threshold: 50,
        unit: 'bottles',
        warehouseId: warehouse.id
      }
    });
    
    await expect(
      prisma.resource.update({
        where: { id: resource.id },
        data: { quantity: -5 }
      })
    ).rejects.toThrow(/cannot be negative/);
  });
});
```

### Property-Based Testing Applicability

**Assessment**: This system is primarily a CRUD application with infrastructure coordination. Most requirements involve:
- Database operations (CRUD)
- UI rendering and forms
- External service coordination (hospitals, teams)
- Configuration and setup

**Conclusion**: Property-based testing is **NOT broadly applicable** to this system because:
1. Most operations are CRUD with specific business rules, not universal properties
2. UI rendering and form validation are better tested with example-based tests
3. Infrastructure coordination (team assignments, hospital admissions) involves specific state transitions, not universal properties
4. Database triggers and views are deterministic and better tested with integration tests

**Limited PBT Opportunities**:
- Input validation functions (e.g., testing that all whitespace strings are rejected)
- Serialization/deserialization if custom formats are used
- Calculation functions (e.g., financial summaries, response time calculations)

Since PBT is not broadly applicable, **the Correctness Properties section will be omitted** from this design document.

### Test Coverage Goals

- **Backend**: 80% code coverage
- **Frontend**: 70% code coverage
- **Critical paths**: 100% coverage (authentication, transactions, RBAC)

---

## Deployment Configuration

### Docker Compose Setup

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: disaster_response_db
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: disaster_response
      MYSQL_USER: app_user
      MYSQL_PASSWORD: app_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - disaster_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: disaster_response_api
    environment:
      DATABASE_URL: mysql://app_user:app_password@mysql:3306/disaster_response
      JWT_SECRET: your_jwt_secret_key_change_in_production
      PORT: 5000
      NODE_ENV: production
    ports:
      - "5000:5000"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - disaster_network
    command: sh -c "npx prisma migrate deploy && npx prisma db seed && npm start"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: disaster_response_ui
    environment:
      VITE_API_URL: http://localhost:5000/api
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - disaster_network

volumes:
  mysql_data:
    driver: local

networks:
  disaster_network:
    driver: bridge
```

### Backend Dockerfile

**backend/Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

### Frontend Dockerfile

**frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

**frontend/nginx.conf:**
```nginx
server {
    listen 3000;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment Variables

**backend/.env:**
```env
DATABASE_URL="mysql://app_user:app_password@localhost:3306/disaster_response"
JWT_SECRET="your_jwt_secret_key_change_in_production"
PORT=5000
NODE_ENV=development
BCRYPT_SALT_ROUNDS=12
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:5000/api
```

### Database Seeding

**prisma/seed.js:**
```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users for each role
  const users = [
    {
      username: 'admin',
      email: 'admin@disaster.gov',
      password: await bcrypt.hash('admin123', 12),
      role: 'admin'
    },
    {
      username: 'operator1',
      email: 'operator@disaster.gov',
      password: await bcrypt.hash('operator123', 12),
      role: 'operator'
    },
    {
      username: 'field1',
      email: 'field@disaster.gov',
      password: await bcrypt.hash('field123', 12),
      role: 'field_officer'
    },
    {
      username: 'warehouse1',
      email: 'warehouse@disaster.gov',
      password: await bcrypt.hash('warehouse123', 12),
      role: 'warehouse_manager'
    },
    {
      username: 'finance1',
      email: 'finance@disaster.gov',
      password: await bcrypt.hash('finance123', 12),
      role: 'finance_officer'
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    });
  }

  console.log('Users created');

  // Create sample disaster event
  const event = await prisma.disasterEvent.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Flood 2024',
      type: 'Flood',
      location: 'Northern Region',
      startDate: new Date('2024-01-15'),
      description: 'Major flooding in northern districts'
    }
  });

  console.log('Disaster event created');

  // Create warehouses
  const warehouses = [
    { name: 'Central Warehouse', location: 'Capital City', capacity: 10000 },
    { name: 'Northern Depot', location: 'Northern Region', capacity: 5000 },
    { name: 'Southern Storage', location: 'Southern Region', capacity: 7000 }
  ];

  for (const warehouse of warehouses) {
    await prisma.warehouse.upsert({
      where: { id: warehouses.indexOf(warehouse) + 1 },
      update: {},
      create: warehouse
    });
  }

  console.log('Warehouses created');

  // Create resources
  const resources = [
    { name: 'Water Bottles', resourceType: 'Water', quantity: 5000, threshold: 1000, unit: 'bottles', warehouseId: 1 },
    { name: 'Food Packets', resourceType: 'Food', quantity: 3000, threshold: 500, unit: 'packets', warehouseId: 1 },
    { name: 'Medical Kits', resourceType: 'Medicine', quantity: 500, threshold: 100, unit: 'kits', warehouseId: 1 },
    { name: 'Tents', resourceType: 'Shelter', quantity: 200, threshold: 50, unit: 'units', warehouseId: 2 },
    { name: 'Blankets', resourceType: 'Shelter', quantity: 1000, threshold: 200, unit: 'pieces', warehouseId: 2 }
  ];

  for (const resource of resources) {
    await prisma.resource.create({ data: resource });
  }

  console.log('Resources created');

  // Create rescue teams
  const teams = [
    { name: 'Medical Team Alpha', type: 'Medical', location: 'Capital City', status: 'Available', memberCount: 15 },
    { name: 'Fire Brigade 1', type: 'Fire', location: 'Capital City', status: 'Available', memberCount: 20 },
    { name: 'Rescue Squad Beta', type: 'Rescue', location: 'Northern Region', status: 'Available', memberCount: 12 },
    { name: 'Relief Team Gamma', type: 'Relief', location: 'Southern Region', status: 'Available', memberCount: 10 }
  ];

  for (const team of teams) {
    await prisma.rescueTeam.create({ data: team });
  }

  console.log('Rescue teams created');

  // Create hospitals
  const hospitals = [
    { name: 'Central Hospital', location: 'Capital City', totalBeds: 500, availableBeds: 350, contactNumber: '123-456-7890' },
    { name: 'Northern Medical Center', location: 'Northern Region', totalBeds: 300, availableBeds: 200, contactNumber: '123-456-7891' },
    { name: 'Southern Clinic', location: 'Southern Region', totalBeds: 150, availableBeds: 100, contactNumber: '123-456-7892' }
  ];

  for (const hospital of hospitals) {
    await prisma.hospital.create({ data: hospital });
  }

  console.log('Hospitals created');

  // Create sample emergency reports
  const reports = [
    {
      location: 'Downtown Area',
      disasterType: 'Flood',
      severity: 'High',
      description: 'Severe flooding in downtown commercial district',
      reportedBy: 'John Citizen',
      contactNumber: '555-0101',
      status: 'Pending',
      disasterEventId: event.id
    },
    {
      location: 'Residential Zone A',
      disasterType: 'Flood',
      severity: 'Critical',
      description: 'Multiple buildings submerged, residents trapped',
      reportedBy: 'Emergency Services',
      contactNumber: '555-0102',
      status: 'Pending',
      disasterEventId: event.id
    }
  ];

  for (const report of reports) {
    await prisma.emergencyReport.create({ data: report });
  }

  console.log('Emergency reports created');

  console.log('Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**package.json (backend):**
```json
{
  "name": "disaster-response-backend",
  "version": "1.0.0",
  "prisma": {
    "seed": "node prisma/seed.js"
  },
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "migrate": "npx prisma migrate dev",
    "seed": "npx prisma db seed"
  }
}
```

### Deployment Steps

1. **Clone repository and navigate to project root**
2. **Configure environment variables** in `.env` files
3. **Start all services:**
   ```bash
   docker-compose up --build
   ```
4. **Access application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - MySQL: localhost:3306

### Health Checks

**Backend Health Endpoint:**
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected'
  });
});
```

---

## Frontend Implementation Details

### Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── CapacityBar.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── FormField.jsx
│   │   ├── reports/
│   │   │   ├── ReportTable.jsx
│   │   │   ├── ReportForm.jsx
│   │   │   └── ReportFilters.jsx
│   │   ├── teams/
│   │   │   ├── TeamTable.jsx
│   │   │   ├── TeamForm.jsx
│   │   │   └── AssignTeamModal.jsx
│   │   ├── resources/
│   │   │   ├── ResourceTable.jsx
│   │   │   ├── ResourceForm.jsx
│   │   │   └── AllocationModal.jsx
│   │   ├── hospitals/
│   │   │   ├── HospitalTable.jsx
│   │   │   ├── CapacityDashboard.jsx
│   │   │   ├── AdmitPatientModal.jsx
│   │   │   └── DischargePatientModal.jsx
│   │   ├── finance/
│   │   │   ├── DonationTable.jsx
│   │   │   ├── ExpenseTable.jsx
│   │   │   ├── FinancialSummary.jsx
│   │   │   └── TransactionForm.jsx
│   │   ├── approvals/
│   │   │   ├── ApprovalTable.jsx
│   │   │   └── ApprovalModal.jsx
│   │   ├── analytics/
│   │   │   ├── IncidentChart.jsx
│   │   │   ├── ResourceChart.jsx
│   │   │   ├── ResponseTimeChart.jsx
│   │   │   └── FinanceChart.jsx
│   │   └── users/
│   │       ├── UserTable.jsx
│   │       └── UserForm.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── EmergencyReportsPage.jsx
│   │   ├── RescueTeamsPage.jsx
│   │   ├── ResourcesPage.jsx
│   │   ├── HospitalsPage.jsx
│   │   ├── FinancePage.jsx
│   │   ├── ApprovalsPage.jsx
│   │   ├── UsersPage.jsx
│   │   ├── AuditLogsPage.jsx
│   │   └── AnalyticsPage.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── api/
│   │   └── client.js
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── constants.js
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

### Routing Configuration

**App.jsx:**
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/common/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmergencyReportsPage from './pages/EmergencyReportsPage';
import RescueTeamsPage from './pages/RescueTeamsPage';
import ResourcesPage from './pages/ResourcesPage';
import HospitalsPage from './pages/HospitalsPage';
import FinancePage from './pages/FinancePage';
import ApprovalsPage from './pages/ApprovalsPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AnalyticsPage from './pages/AnalyticsPage';

function PrivateRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={
            <PrivateRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/reports" element={
            <PrivateRoute>
              <AppLayout>
                <EmergencyReportsPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/teams" element={
            <PrivateRoute>
              <AppLayout>
                <RescueTeamsPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/resources" element={
            <PrivateRoute allowedRoles={['admin', 'warehouse_manager']}>
              <AppLayout>
                <ResourcesPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/hospitals" element={
            <PrivateRoute allowedRoles={['admin', 'operator']}>
              <AppLayout>
                <HospitalsPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/finance" element={
            <PrivateRoute allowedRoles={['admin', 'finance_officer']}>
              <AppLayout>
                <FinancePage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/approvals" element={
            <PrivateRoute allowedRoles={['admin', 'warehouse_manager']}>
              <AppLayout>
                <ApprovalsPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/users" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AppLayout>
                <UsersPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/audit" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AppLayout>
                <AuditLogsPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/analytics" element={
            <PrivateRoute>
              <AppLayout>
                <AnalyticsPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### Auth Context

**context/AuthContext.jsx:**
```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchCurrentUser() {
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    setUser(user);
    setIsAuthenticated(true);
    
    return user;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
```

### Sidebar Component

**components/common/Sidebar.jsx:**
```jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CubeIcon,
  BuildingOffice2Icon,
  BanknotesIcon,
  CheckCircleIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon, roles: ['admin', 'operator', 'field_officer', 'warehouse_manager', 'finance_officer'] },
  { name: 'Emergency Reports', path: '/reports', icon: ExclamationTriangleIcon, roles: ['admin', 'operator', 'field_officer'] },
  { name: 'Rescue Teams', path: '/teams', icon: UserGroupIcon, roles: ['admin', 'operator', 'field_officer'] },
  { name: 'Resources', path: '/resources', icon: CubeIcon, roles: ['admin', 'warehouse_manager'] },
  { name: 'Hospitals', path: '/hospitals', icon: BuildingOffice2Icon, roles: ['admin', 'operator'] },
  { name: 'Finance', path: '/finance', icon: BanknotesIcon, roles: ['admin', 'finance_officer'] },
  { name: 'Approvals', path: '/approvals', icon: CheckCircleIcon, roles: ['admin', 'warehouse_manager'] },
  { name: 'Users', path: '/users', icon: UsersIcon, roles: ['admin'] },
  { name: 'Audit Logs', path: '/audit', icon: DocumentTextIcon, roles: ['admin'] },
  { name: 'Analytics', path: '/analytics', icon: ChartBarIcon, roles: ['admin', 'operator'] }
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const allowedItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-red-500">Disaster Response MIS</h1>
        <p className="text-sm text-gray-400 mt-1">{user.username}</p>
        <p className="text-xs text-gray-500">{user.role.replace('_', ' ')}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
```

### Tailwind Configuration

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a0a',
          900: '#121212',
          800: '#1e1e1e',
        }
      }
    },
  },
  plugins: [],
}
```

### Vite Configuration

**vite.config.js:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

---

## Design Decisions and Rationale

### 1. Why 3-Tier Architecture?

**Decision**: Separate presentation, application, and data layers.

**Rationale**:
- **Maintainability**: Each layer can be modified independently
- **Scalability**: Layers can be scaled horizontally as needed
- **Security**: Clear boundaries for access control
- **Testability**: Each layer can be tested in isolation

### 2. Why Prisma ORM?

**Decision**: Use Prisma instead of raw SQL or other ORMs.

**Rationale**:
- **Type Safety**: Auto-generated TypeScript types
- **Migration Management**: Built-in migration system
- **Query Builder**: Intuitive API reduces SQL injection risk
- **Performance**: Efficient query generation and connection pooling

### 3. Why JWT for Authentication?

**Decision**: Use JWT tokens instead of session-based auth.

**Rationale**:
- **Stateless**: No server-side session storage required
- **Scalability**: Easy to scale horizontally
- **Mobile-Friendly**: Works well with mobile apps
- **Cross-Domain**: Can be used across multiple services

### 4. Why Database Triggers?

**Decision**: Implement business logic in database triggers.

**Rationale**:
- **Data Integrity**: Enforced at database level, cannot be bypassed
- **Consistency**: Works even if application logic is buggy
- **Audit Trail**: Automatic logging of critical state changes
- **Performance**: Reduces round trips for multi-step operations

### 5. Why Separate Frontend Interfaces?

**Decision**: Create distinct UI sections for hospitals, rescue teams, and citizens.

**Rationale**:
- **User Experience**: Each stakeholder sees only relevant information
- **Security**: Role-based rendering prevents information leakage
- **Usability**: Simplified workflows for specific tasks
- **Performance**: Reduced data loading for focused views

### 6. Why Docker Compose?

**Decision**: Use Docker Compose for deployment.

**Rationale**:
- **Reproducibility**: Same environment across dev, test, prod
- **Simplicity**: Single command to start all services
- **Isolation**: Services run in isolated containers
- **Portability**: Works on any platform with Docker

### 7. Why Custom Indexes?

**Decision**: Define 8 custom indexes on high-frequency columns.

**Rationale**:
- **Performance**: Dramatically reduces query execution time
- **Scalability**: System remains responsive under high load
- **Cost**: Minimal storage overhead for significant performance gain
- **Targeted**: Indexes designed for specific query patterns

### 8. Why Transactional Operations?

**Decision**: Wrap multi-step operations in Prisma transactions.

**Rationale**:
- **ACID Compliance**: Ensures data consistency
- **Concurrency**: Prevents race conditions
- **Reliability**: Partial failures don't corrupt data
- **Audit**: Failed transactions are logged for investigation

---

## Summary

The Smart Disaster Response MIS design provides a comprehensive, production-ready architecture for coordinating disaster response operations. Key design highlights:

1. **3-tier architecture** with clear separation of concerns
2. **14 database models** with full normalization and referential integrity
3. **5 database views** for complex reporting queries
4. **5 database triggers** for automated state management and audit logging
5. **8 custom indexes** for query performance optimization
6. **JWT + bcrypt** authentication with role-based access control
7. **Prisma transactions** for ACID-compliant multi-step operations
8. **React + Tailwind** frontend with role-specific dashboards
9. **Docker Compose** deployment for single-command startup
10. **Comprehensive error handling** and validation at all layers

The system is designed to handle high-frequency emergency report ingestion, real-time team coordination, warehouse inventory management, hospital capacity tracking, and financial transaction recording — all with full audit trails and role-based security.

