# Requirements Document

## Introduction

The Smart Disaster Response Management Information System (MIS) is a production-grade, full-stack enterprise web application designed to coordinate disaster response operations across multiple government stakeholders. The system serves emergency operators, field officers, warehouse managers, finance officers, and administrators during natural disasters such as floods, earthquakes, and urban fires.

The system handles high-frequency emergency report ingestion, real-time rescue team coordination, warehouse-level resource tracking, hospital capacity management, financial transaction recording, and approval-based workflows — all secured by role-based access control and backed by a fully auditable data layer. A React-based frontend provides role-specific dashboards, interactive analytics, and operational forms. The backend is built on Node.js/Express with a MySQL database managed via Prisma ORM, containerized with Docker Compose for single-command deployment.

---

## Glossary

- **System**: The Smart Disaster Response MIS application as a whole
- **API**: The Express.js REST API backend service
- **Frontend**: The React/Vite single-page application
- **Database**: The MySQL relational database managed via Prisma ORM
- **User**: An authenticated account with an assigned role
- **Administrator**: A User with the `admin` role who has full system access
- **Emergency_Operator**: A User with the `operator` role who manages emergency reports and team assignments
- **Field_Officer**: A User with the `field_officer` role who updates field-level status and team activities
- **Warehouse_Manager**: A User with the `warehouse_manager` role who manages inventory and resource allocations
- **Finance_Officer**: A User with the `finance_officer` role who manages donations, expenses, and financial records
- **DisasterEvent**: A named, categorized disaster occurrence to which reports and budgets are linked
- **EmergencyReport**: A citizen-submitted incident record containing location, disaster type, severity, and timestamp
- **RescueTeam**: A named team of a specific type (medical, fire, rescue) with a current location and availability status
- **TeamAssignment**: A record linking a RescueTeam to an EmergencyReport for a specific deployment
- **Warehouse**: A physical storage facility that holds Resources
- **Resource**: A tracked supply item (food, water, medicine, shelter equipment) stored in a Warehouse
- **ResourceAllocation**: A request to allocate a quantity of a Resource to a DisasterEvent, subject to approval
- **Hospital**: A medical facility with tracked bed capacity and patient load
- **Patient**: A person admitted to a Hospital, linked to an EmergencyReport
- **Donation**: A financial contribution from an individual or organization
- **Expense**: A recorded cost incurred during disaster response operations
- **ApprovalWorkflow**: A record representing a pending, approved, or rejected request for a critical action
- **AuditLog**: An immutable timestamped record of a user action or data modification
- **RBAC**: Role-Based Access Control restricting operations by user role
- **JWT**: JSON Web Token used for stateless authentication
- **ACID**: Atomicity, Consistency, Isolation, Durability properties of database transactions
- **Prisma**: The ORM used to interact with the MySQL database
- **Trigger**: A database-level automation that fires on data events
- **View**: A stored database query presenting a virtual table for reporting or access restriction
- **Index**: A database structure that accelerates query performance on specific columns
- **Seed**: Initial data loaded into the Database on first startup
- **Docker_Compose**: The container orchestration tool used to run all services with a single command

---

## Requirements

### Requirement 1: User Authentication and Session Management

**User Story:** As a system user, I want to securely log in with my credentials, so that I can access role-appropriate features without exposing the system to unauthorized access.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/auth/register` endpoint that accepts a username, email, password, and role, creates a User record with a bcrypt-hashed password, and returns a signed JWT.
2. THE API SHALL expose a `POST /api/auth/login` endpoint that accepts email and password, verifies the bcrypt hash, and returns a signed JWT containing `{ id, username, role, email }`.
3. WHEN a login attempt is made with an incorrect password or unrecognized email, THE API SHALL return an HTTP 401 response with a descriptive error message.
4. THE API SHALL expose a `GET /api/auth/me` endpoint that, when called with a valid JWT in the Authorization header, returns the authenticated User's profile.
5. THE API SHALL expose a `POST /api/auth/change-password` endpoint that accepts the current password and a new password, verifies the current password via bcrypt, and updates the stored hash.
6. WHEN a request is made to any protected endpoint without a valid JWT, THE API SHALL return an HTTP 401 response.
7. THE Frontend SHALL store the JWT in browser memory or localStorage and attach it as a Bearer token on every API request.
8. THE Frontend SHALL redirect unauthenticated users to the Login page and prevent access to all other routes.

---

### Requirement 2: Role-Based Access Control (RBAC)

**User Story:** As an Administrator, I want each user role to have strictly enforced permissions, so that sensitive operations cannot be performed by unauthorized roles.

#### Acceptance Criteria

1. THE System SHALL define five roles: `admin`, `operator`, `field_officer`, `warehouse_manager`, `finance_officer`.
2. THE API SHALL enforce role-based middleware on every protected endpoint, returning HTTP 403 when the authenticated User's role lacks permission for the requested operation.
3. THE Frontend SHALL NOT render navigation items, buttons, or forms for operations the authenticated User's role is not permitted to perform.
4. WHERE the role is `admin`, THE System SHALL grant full read and write access to all resources including user management and audit logs.
5. WHERE the role is `operator`, THE System SHALL grant access to emergency reports, rescue team assignments, and approval workflows.
6. WHERE the role is `field_officer`, THE System SHALL grant access to team status updates and field-level report status changes.
7. WHERE the role is `warehouse_manager`, THE System SHALL grant access to resource inventory, warehouse management, and resource allocation requests.
8. WHERE the role is `finance_officer`, THE System SHALL grant access to donations, expenses, and financial summaries.
9. THE API SHALL validate role permissions before executing any mutating operation, independent of Frontend-side restrictions.

---

### Requirement 3: Emergency Report Management

**User Story:** As an Emergency Operator, I want to receive, track, and prioritize emergency reports, so that I can coordinate an effective disaster response.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/reports` endpoint that accepts location, disaster type, severity level, and timestamp, creates an EmergencyReport record, and returns the created record.
2. THE API SHALL expose a `GET /api/reports` endpoint that returns a paginated list of EmergencyReport records in the format `{ data, total, page, limit, totalPages }`.
3. WHEN a `GET /api/reports` request includes query parameters for location, disaster type, severity, or status, THE API SHALL filter results to match all provided parameters.
4. THE API SHALL expose a `GET /api/reports/:id` endpoint that returns a single EmergencyReport by its identifier.
5. THE API SHALL expose a `PUT /api/reports/:id` endpoint that updates the status or details of an EmergencyReport.
6. THE API SHALL expose a `DELETE /api/reports/:id` endpoint restricted to the `admin` role.
7. WHEN an EmergencyReport status changes, THE Database Trigger `log_report_status_change` SHALL insert a record into the AuditLog table capturing the previous status, new status, report identifier, and timestamp.
8. THE Frontend SHALL display EmergencyReports in a filterable, paginated table with columns for location, type, severity, status, and reported time.
9. THE Frontend SHALL provide a form for creating new EmergencyReports accessible to `operator` and `admin` roles.

---

### Requirement 4: Disaster Event Management

**User Story:** As an Administrator, I want to create and manage named disaster events, so that reports, resources, and budgets can be grouped and tracked per event.

#### Acceptance Criteria

1. THE API SHALL expose CRUD endpoints under `/api/events` for creating, reading, updating, and deleting DisasterEvent records.
2. THE System SHALL associate EmergencyReports, ResourceAllocations, Donations, and Expenses with a DisasterEvent via a foreign key relationship.
3. WHEN a DisasterEvent deletion is requested and active EmergencyReports or open ResourceAllocations reference that event, THE API SHALL return an HTTP 409 response and abort the deletion.
4. THE Frontend SHALL allow `admin` and `operator` roles to create and manage DisasterEvents.

---

### Requirement 5: Rescue Team Management

**User Story:** As an Emergency Operator, I want to assign rescue teams to incidents based on availability, so that response is fast and well-coordinated.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/teams` endpoint returning a paginated list of RescueTeam records with their current status and location.
2. THE API SHALL expose `POST`, `PUT`, and `DELETE` endpoints under `/api/teams` for creating, updating, and removing RescueTeam records, restricted to `admin` and `operator` roles.
3. THE API SHALL expose a `POST /api/teams/:id/assign` endpoint that creates a TeamAssignment linking a RescueTeam to an EmergencyReport and transitions the team status from `Available` to `Assigned`.
4. WHEN a TeamAssignment record is inserted, THE Database Trigger `after_team_assignment_insert` SHALL update the corresponding RescueTeam status to `Assigned`.
5. WHEN a TeamAssignment is marked as completed, THE Database Trigger `after_team_assignment_complete` SHALL update the corresponding RescueTeam status to `Available`.
6. THE System SHALL maintain a complete history of TeamAssignment records for each RescueTeam, preserving all past deployments.
7. THE Frontend SHALL display RescueTeams in a table showing team type, location, and current status, with an assign action available to `operator` and `admin` roles.
8. THE Frontend SHALL visually distinguish team status using color-coded badges: green for Available, orange for Assigned, red for Busy, and gray for Completed.

---

### Requirement 6: Resource and Warehouse Management

**User Story:** As a Warehouse Manager, I want to track inventory levels across warehouses and receive low-stock alerts, so that I can ensure adequate supplies are available during disaster response.

#### Acceptance Criteria

1. THE API SHALL expose CRUD endpoints under `/api/resources/warehouses` for managing Warehouse records, restricted to `warehouse_manager` and `admin` roles.
2. THE API SHALL expose CRUD endpoints under `/api/resources` for managing Resource records linked to a Warehouse.
3. THE API SHALL expose a `GET /api/resources` endpoint that returns Resources with their current quantity, warehouse association, and resource type.
4. WHEN a Resource's quantity falls below its defined threshold value, THE API SHALL include a `lowStock: true` flag in the resource response object.
5. THE Frontend SHALL display a visual warning indicator on any Resource where `lowStock` is true, visible to `warehouse_manager` and `admin` roles.
6. THE Frontend SHALL display a warehouse-grouped inventory view with quantity indicators and low-stock warnings.

---

### Requirement 7: Resource Allocation Approval Workflow

**User Story:** As a Warehouse Manager, I want resource distribution requests to go through an approval process, so that allocations are authorized before stock is deducted.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/resources/:id/allocate` endpoint that creates a ResourceAllocation record with status `pending` and creates a corresponding ApprovalWorkflow record.
2. THE API SHALL expose a `GET /api/approvals` endpoint returning paginated ApprovalWorkflow records filterable by status (`pending`, `approved`, `rejected`) and type.
3. THE API SHALL expose a `POST /api/approvals/:id/resolve` endpoint restricted to `admin` and `warehouse_manager` roles that accepts a decision of `approved` or `rejected` and an optional comment.
4. WHEN an ApprovalWorkflow is resolved as `approved`, THE API SHALL execute the associated ResourceAllocation within a `prisma.$transaction` block, deducting stock and updating the allocation status atomically.
5. WHEN an ApprovalWorkflow is resolved as `rejected`, THE API SHALL update the ResourceAllocation status to `rejected` without modifying stock levels.
6. WHEN an allocation approval would result in a Resource quantity below zero, THE Database Trigger `prevent_negative_stock` SHALL raise an error and THE API SHALL return an HTTP 409 response.
7. THE System SHALL maintain a complete history of all ApprovalWorkflow records including the resolver's identity, decision, comment, and timestamp.
8. THE Frontend SHALL display pending approvals to authorized roles with approve and reject action buttons.
9. THE Frontend SHALL display the full approval history for each request including decision, comment, and resolver identity.

---

### Requirement 8: Hospital Coordination

**User Story:** As an Emergency Operator, I want to track hospital capacity and assign patients to available hospitals, so that critical cases receive timely medical care.

#### Acceptance Criteria

1. THE API SHALL expose CRUD endpoints under `/api/hospitals` for managing Hospital records including total beds, available beds, and current patient count.
2. THE API SHALL expose a `POST /api/hospitals/:id/admit` endpoint that creates a Patient record linked to a Hospital and an EmergencyReport, and decrements the Hospital's available bed count within a `prisma.$transaction` block.
3. WHEN a `POST /api/hospitals/:id/admit` request is made and the Hospital has zero available beds, THE API SHALL return an HTTP 409 response indicating the hospital is at full capacity.
4. THE API SHALL expose a `POST /api/hospitals/:id/discharge/:patientId` endpoint that updates the Patient record status to `discharged` and increments the Hospital's available bed count within a `prisma.$transaction` block.
5. THE API SHALL expose a `GET /api/hospitals/available` endpoint that returns Hospitals ordered by available bed count descending to support load balancing.
6. THE Frontend SHALL display a hospital capacity dashboard showing total beds, occupied beds, and available beds per hospital with a visual capacity bar.
7. THE Frontend SHALL provide admit and discharge patient actions accessible to `operator` and `admin` roles.

---

### Requirement 9: Financial Management

**User Story:** As a Finance Officer, I want to record donations and expenses with full categorization, so that I can track budget utilization per disaster event and produce financial audit trails.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/finance/donations` endpoint that creates a Donation record with donor name, amount, organization, and linked DisasterEvent.
2. THE API SHALL expose a `GET /api/finance/donations` endpoint returning paginated Donation records filterable by date range and DisasterEvent.
3. THE API SHALL expose a `POST /api/finance/expenses` endpoint that creates an Expense record with category, amount, description, and linked DisasterEvent, restricted to `finance_officer` and `admin` roles.
4. THE API SHALL expose a `GET /api/finance/expenses` endpoint returning paginated Expense records filterable by category, date range, and DisasterEvent.
5. THE API SHALL expose a `GET /api/finance/summary` endpoint that returns total donations, total expenses, net balance, and a breakdown by DisasterEvent.
6. WHEN a Donation or Expense record is created or modified, THE Database Trigger `log_financial_transaction` SHALL insert a record into the AuditLog table capturing the transaction type, amount, and actor identifier.
7. THE Frontend SHALL display a financial summary dashboard with total donations, total expenses, and net balance visible to `finance_officer` and `admin` roles.
8. THE Frontend SHALL provide forms for recording donations and expenses with DisasterEvent association.

---

### Requirement 10: High-Volume Transaction Processing and ACID Compliance

**User Story:** As a system architect, I want all multi-step database operations to be wrapped in transactions, so that data remains consistent under concurrent load and partial failures leave no corrupt state.

#### Acceptance Criteria

1. THE API SHALL wrap every multi-table mutating operation in a `prisma.$transaction([...])` block, ensuring atomicity.
2. WHEN a transaction fails at any step, THE Database SHALL roll back all changes made within that transaction, leaving all affected tables in their pre-transaction state.
3. THE System SHALL handle concurrent ResourceAllocation approvals for the same Resource using database-level locking within transactions to prevent race conditions.
4. THE System SHALL prevent negative Resource quantities through both the `prevent_negative_stock` database trigger and application-level validation before transaction execution.
5. WHEN a transaction is aborted due to a conflict or constraint violation, THE API SHALL return an HTTP 409 response with a message describing the conflict.
6. THE System SHALL log every transaction failure including the operation type, affected record identifiers, and failure reason in the AuditLog.

---

### Requirement 11: Audit Logging

**User Story:** As an Administrator, I want every significant user action and data modification to be recorded in an immutable audit log, so that I can trace all system activity for compliance and investigation.

#### Acceptance Criteria

1. THE API SHALL create an AuditLog entry for every mutating operation (create, update, delete, approve, reject) on any primary entity.
2. EACH AuditLog entry SHALL contain: actor user identifier, action type, affected entity type, affected entity identifier, previous state as JSON, new state as JSON, and UTC timestamp.
3. THE Database Trigger `log_report_status_change` SHALL create AuditLog entries for EmergencyReport status transitions at the database level, independent of application-layer logging.
4. THE Database Trigger `log_financial_transaction` SHALL create AuditLog entries for Donation and Expense mutations at the database level.
5. THE API SHALL expose a `GET /api/audit` endpoint restricted to the `admin` role, returning paginated AuditLog records filterable by actor, entity type, action type, and date range.
6. THE Frontend SHALL display a paginated, filterable AuditLog table accessible only to `admin` role users.
7. THE System SHALL NOT permit deletion or modification of AuditLog records through any API endpoint.

---

### Requirement 12: MIS Analytics and Reporting

**User Story:** As an Administrator or Emergency Operator, I want interactive dashboards and drill-down reports, so that I can make data-driven decisions during and after disaster events.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/analytics/dashboard` endpoint returning aggregate counts for active incidents, available teams, low-stock resources, hospital occupancy rate, total donations, and total expenses.
2. THE API SHALL expose a `GET /api/analytics/incidents` endpoint returning incident counts grouped by location, disaster type, and severity level, with optional date range filtering.
3. THE API SHALL expose a `GET /api/analytics/resources` endpoint returning resource utilization rates per warehouse and per resource type.
4. THE API SHALL expose a `GET /api/analytics/response-time` endpoint returning average time between EmergencyReport creation and first TeamAssignment per disaster type and severity.
5. THE API SHALL expose a `GET /api/analytics/finance` endpoint returning donation and expense totals grouped by DisasterEvent and time period.
6. THE Frontend Dashboard page SHALL display summary cards for active incidents, available teams, low-stock resources, and financial balance populated from the dashboard analytics endpoint.
7. THE Frontend Analytics page SHALL render bar charts, line charts, and pie charts using Recharts for incident distribution, resource utilization, and financial summaries.
8. THE Frontend SHALL support interactive filtering on all analytics views by date range, disaster type, and DisasterEvent.

---

### Requirement 13: Database Views

**User Story:** As a database architect, I want pre-defined views to simplify complex reporting queries and enforce role-appropriate data visibility, so that application queries remain performant and secure.

#### Acceptance Criteria

1. THE Database SHALL define a view `v_active_incidents` that joins EmergencyReport, DisasterEvent, and TeamAssignment to present active incidents with their assigned team status.
2. THE Database SHALL define a view `v_resource_stock` that joins Resource and Warehouse to present current stock levels, thresholds, and low-stock flags per warehouse.
3. THE Database SHALL define a view `v_financial_summary` that aggregates Donation and Expense records per DisasterEvent to present net balance and transaction counts.
4. THE Database SHALL define a view `v_hospital_capacity` that joins Hospital and Patient to present current occupancy, available beds, and critical patient count per hospital.
5. THE Database SHALL define a view `v_team_history` that joins RescueTeam and TeamAssignment to present the full deployment history per team with timestamps.
6. THE System documentation SHALL include a comparative latency analysis demonstrating query execution time using views versus equivalent direct table joins for at least two representative queries.

---

### Requirement 14: Database Triggers

**User Story:** As a database architect, I want database-level triggers to enforce business rules and automate state transitions, so that data integrity is maintained even if application logic is bypassed.

#### Acceptance Criteria

1. THE Database SHALL define a trigger `after_allocation_approved` that fires AFTER an UPDATE on ResourceAllocation when the status changes to `approved`, deducting the allocated quantity from the corresponding Resource stock.
2. THE Database SHALL define a trigger `prevent_negative_stock` that fires BEFORE an UPDATE on Resource when the quantity column is modified, raising an error and aborting the update if the new quantity would be less than zero.
3. THE Database SHALL define a trigger `after_team_assignment_insert` that fires AFTER an INSERT on TeamAssignment, updating the corresponding RescueTeam status to `Assigned`.
4. THE Database SHALL define a trigger `after_team_assignment_complete` that fires AFTER an UPDATE on TeamAssignment when the status changes to `completed`, updating the corresponding RescueTeam status to `Available`.
5. THE Database SHALL define a trigger `log_report_status_change` that fires AFTER an UPDATE on EmergencyReport when the status column changes, inserting a record into AuditLog with the old status, new status, report identifier, and UTC timestamp.

---

### Requirement 15: Performance Indexing

**User Story:** As a database architect, I want custom indexes on high-frequency query columns, so that the system maintains acceptable response times under high-volume concurrent load.

#### Acceptance Criteria

1. THE Database SHALL define a single-column index `idx_reports_location` on the `location` column of the EmergencyReport table.
2. THE Database SHALL define a composite index `idx_reports_type_severity` on the `disasterType` and `severity` columns of the EmergencyReport table.
3. THE Database SHALL define a composite index `idx_reports_date_status` on the `reportedAt` and `status` columns of the EmergencyReport table.
4. THE Database SHALL define a composite index `idx_resources_type_qty` on the `resourceType` and `quantity` columns of the Resource table.
5. THE Database SHALL define a composite index `idx_audit_date_user` on the `createdAt` and `userId` columns of the AuditLog table.
6. THE Database SHALL define a composite index `idx_allocations_status_date` on the `status` and `createdAt` columns of the ResourceAllocation table.
7. THE Database SHALL define a single-column index `idx_donations_date` on the `donatedAt` column of the Donation table.
8. THE Database SHALL define a composite index `idx_expenses_category_date` on the `category` and `createdAt` columns of the Expense table.
9. THE System documentation SHALL include a query performance report comparing execution time and response latency for representative queries with and without each index applied.

---

### Requirement 16: Frontend Dashboard and Navigation

**User Story:** As any authenticated user, I want a role-specific dashboard and navigation, so that I can quickly access the tools relevant to my responsibilities.

#### Acceptance Criteria

1. THE Frontend SHALL implement a persistent sidebar navigation that renders only the links permitted for the authenticated User's role.
2. THE Frontend Dashboard page SHALL display summary metric cards for active incidents, available rescue teams, low-stock resources, and financial balance, populated from `GET /api/analytics/dashboard`.
3. THE Frontend SHALL apply a dark emergency operations center aesthetic using `bg-gray-950` as the main background, `bg-gray-900` for cards, and `bg-gray-800` for input fields.
4. THE Frontend SHALL use `red-600` for critical severity indicators, `orange-500` for warnings, `green-500` for success states, and `blue-500` for informational elements.
5. THE Frontend SHALL be fully responsive and usable on mobile screen widths of 375px and above.
6. THE Frontend SHALL display a loading state indicator while API requests are in flight.
7. WHEN an API request fails, THE Frontend SHALL display a toast notification or alert with the error message returned by the API.

---

### Requirement 17: Frontend Operational Pages

**User Story:** As an operational user, I want dedicated pages for each system domain with appropriate forms and tables, so that I can perform my role's tasks efficiently through the web interface.

#### Acceptance Criteria

1. THE Frontend SHALL implement the following pages: Login, Dashboard, EmergencyReports, RescueTeams, Resources, Hospitals, Finance, Approvals, Users, AuditLogs, and Analytics.
2. THE Frontend EmergencyReports page SHALL display a filterable, paginated table and a form for creating new reports, with filters for location, type, severity, and status.
3. THE Frontend RescueTeams page SHALL display team status, location, and type with an assign-to-incident action for authorized roles.
4. THE Frontend Resources page SHALL display warehouse-grouped inventory with quantity bars, low-stock warnings, and an allocate action for `warehouse_manager` and `admin` roles.
5. THE Frontend Hospitals page SHALL display capacity bars per hospital and provide admit and discharge patient forms for authorized roles.
6. THE Frontend Finance page SHALL display donation and expense tables with a financial summary card and forms for recording new entries.
7. THE Frontend Approvals page SHALL display pending approval requests with approve and reject buttons for authorized roles, and a history section showing resolved approvals.
8. THE Frontend Users page SHALL be accessible only to the `admin` role and SHALL display a paginated user list with role assignment and account management actions.
9. THE Frontend AuditLogs page SHALL be accessible only to the `admin` role and SHALL display a filterable, paginated log table.
10. THE Frontend Analytics page SHALL display Recharts-based visualizations for incident distribution, resource utilization, response time trends, and financial summaries.

---

### Requirement 18: API Pagination and Filtering

**User Story:** As a frontend developer, I want all list endpoints to support consistent pagination and filtering, so that the UI can handle large datasets without performance degradation.

#### Acceptance Criteria

1. THE API SHALL accept `page` and `limit` query parameters on all list endpoints, defaulting to `page=1` and `limit=20` when not provided.
2. THE API SHALL return all paginated responses in the format `{ data, total, page, limit, totalPages }`.
3. THE API SHALL accept filter query parameters specific to each resource type, including `status`, `disasterType`, `severity`, `category`, `startDate`, and `endDate` where applicable.
4. WHEN filter parameters are provided, THE API SHALL apply all filters as AND conditions, returning only records matching every specified filter.
5. THE Frontend SHALL pass active filter values as query parameters on all paginated list requests and update the displayed results without a full page reload.

---

### Requirement 19: Containerization and Deployment

**User Story:** As a DevOps engineer, I want the entire system to start with a single command, so that deployment and local development setup are reproducible and environment-independent.

#### Acceptance Criteria

1. THE System SHALL include a `docker-compose.yml` file defining three services: `mysql`, `backend`, and `frontend`.
2. WHEN `docker-compose up --build` is executed, THE System SHALL start all three services, run database migrations, execute seed data, and serve the application without manual intervention.
3. THE Backend service SHALL wait for the MySQL service to be healthy before starting, using a Docker health check dependency.
4. THE Seed script SHALL create at least one User for each of the five roles with bcrypt-hashed passwords.
5. THE Backend service SHALL configure CORS to allow requests from `http://localhost:3000`.
6. THE Frontend service SHALL be served on port 3000 and the Backend service SHALL be served on port 5000.
7. THE MySQL service SHALL persist data using a named Docker volume so that data survives container restarts.

---

### Requirement 20: Database Schema and Documentation

**User Story:** As a database architect, I want a fully normalized relational schema with supporting documentation, so that the data model is free of redundancy and supports all system operations.

#### Acceptance Criteria

1. THE Database schema SHALL include the following models: User, DisasterEvent, EmergencyReport, RescueTeam, TeamAssignment, Warehouse, Resource, ResourceAllocation, Hospital, Patient, Donation, Expense, ApprovalWorkflow, and AuditLog.
2. THE System documentation SHALL include an Entity Relationship Diagram showing all entities, attributes, primary keys, foreign keys, and cardinality relationships.
3. THE System documentation SHALL include a relational schema listing all tables with column names, data types, constraints, and foreign key references.
4. THE System documentation SHALL include normalization steps demonstrating that the schema satisfies First Normal Form, Second Normal Form, and Third Normal Form.
5. THE Database SHALL enforce referential integrity through foreign key constraints on all relationship columns.
6. THE Database SHALL use `DECIMAL` for monetary amounts, `DATETIME` for timestamps, and constrained string types for status and role fields.

---

### Requirement 21: Error Handling and Data Validation

**User Story:** As a developer, I want consistent error handling and input validation across all API endpoints, so that the system rejects malformed requests and communicates failures clearly.

#### Acceptance Criteria

1. THE API SHALL validate all required fields on every POST and PUT request, returning an HTTP 400 response with a field-level error message when required fields are missing or malformed.
2. WHEN a requested resource is not found by identifier, THE API SHALL return an HTTP 404 response.
3. WHEN an operation is forbidden due to insufficient role permissions, THE API SHALL return an HTTP 403 response.
4. WHEN an unhandled server error occurs, THE API SHALL return an HTTP 500 response with a generic error message and SHALL log the full error details server-side.
5. THE Frontend SHALL display field-level validation errors inline on forms when the API returns an HTTP 400 response.
6. THE Frontend SHALL display a toast notification for HTTP 403, HTTP 404, and HTTP 500 responses with a human-readable message.
