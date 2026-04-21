# Implementation Plan: Smart Disaster Response MIS

## Overview

This implementation plan breaks down the Smart Disaster Response Management Information System into discrete, actionable coding tasks. The system is a full-stack enterprise web application built with Node.js/Express backend, React frontend, MySQL database via Prisma ORM, all containerized with Docker Compose.

The implementation follows a bottom-up approach: infrastructure → database → backend API → frontend, ensuring each layer is functional before building the next.

## Tasks

- [ ] 1. Set up Docker infrastructure and environment configuration
  - Create `docker-compose.yml` with mysql, backend, and frontend services
  - Create `.env.example` with all required environment variables (DATABASE_URL, JWT_SECRET, NODE_ENV, MYSQL_ROOT_PASSWORD, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD)
  - Configure MySQL service with health check and named volume for persistence
  - Configure backend service with dependency on mysql health check
  - Configure frontend service with port 3000 exposure
  - _Requirements: 19.1, 19.2, 19.3, 19.6, 19.7_

- [ ] 2. Set up backend project structure and Prisma schema
  - [ ] 2.1 Create backend directory structure and package.json
    - Create `backend/package.json` with dependencies: express, @prisma/client, bcrypt, jsonwebtoken, express-validator, cors, dotenv
    - Create `backend/Dockerfile` with Node.js 18 base image
    - Create `backend/.dockerignore` to exclude node_modules
    - _Requirements: 20.1_
  
  - [ ] 2.2 Create complete Prisma schema with all models, enums, and indexes
    - Create `backend/prisma/schema.prisma` with all 14 models (User, DisasterEvent, EmergencyReport, RescueTeam, TeamAssignment, Warehouse, Resource, ResourceAllocation, Hospital, Patient, Donation, Expense, ApprovalWorkflow, AuditLog)
    - Define all 11 enums (Role, DisasterType, Severity, ReportStatus, TeamType, TeamStatus, ResourceType, AllocationStatus, PatientStatus, ExpenseCategory, ApprovalType, ApprovalStatus)
    - Add all 8 custom indexes as specified in design (idx_reports_location, idx_reports_type_severity, idx_reports_date_status, idx_resources_type_qty, idx_audit_date_user, idx_allocations_status_date, idx_donations_date, idx_expenses_category_date)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 20.1, 20.5, 20.6_

- [ ] 3. Create database views and triggers migration
  - Create `backend/prisma/migrations/001_views_triggers.sql` with:
    - 5 database views (v_active_incidents, v_resource_stock, v_financial_summary, v_hospital_capacity, v_team_history)
    - 5 database triggers (after_allocation_approved, prevent_negative_stock, after_team_assignment_insert, after_team_assignment_complete, log_report_status_change)
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 4. Implement backend middleware and utilities
  - [ ] 4.1 Create authentication middleware
    - Create `backend/middleware/auth.js` with authenticateToken function
    - Implement JWT verification with Bearer token extraction
    - Attach decoded user to req.user
    - Return 401 for missing token, 403 for invalid token
    - _Requirements: 1.4, 1.6_
  
  - [ ] 4.2 Create RBAC middleware
    - Create `backend/middleware/rbac.js` with requireRole function
    - Accept array of allowed roles as parameter
    - Return 403 when req.user.role not in allowed roles
    - _Requirements: 2.2, 2.9_
  
  - [ ] 4.3 Create audit logging utility
    - Create `backend/utils/audit.js` with createAuditLog function
    - Accept userId, action, entityType, entityId, previousState, newState
    - Insert record into AuditLog table via Prisma
    - _Requirements: 11.1, 11.2_
  
  - [ ] 4.4 Create pagination utility
    - Create `backend/utils/pagination.js` with paginate function
    - Accept page, limit, total count
    - Return { data, total, page, limit, totalPages } format
    - Default page=1, limit=20
    - _Requirements: 18.1, 18.2_

- [ ] 5. Implement Authentication API module
  - [ ] 5.1 Create auth service layer
    - Create `backend/services/authService.js`
    - Implement registerUser function with bcrypt.hash (saltRounds=12)
    - Implement loginUser function with bcrypt.compare and JWT generation
    - Implement changePassword function with password verification
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [ ] 5.2 Create auth controller and routes
    - Create `backend/controllers/authController.js` with register, login, getMe, changePassword handlers
    - Create `backend/routes/auth.js` with POST /register, POST /login, GET /me, POST /change-password
    - Apply authenticateToken middleware to /me and /change-password
    - Return 401 for invalid credentials
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 5.3 Write unit tests for auth service
    - Test password hashing with bcrypt saltRounds=12
    - Test JWT payload structure
    - Test login with invalid credentials returns error
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 6. Checkpoint - Verify auth system
  - Run Prisma migrations
  - Test user registration and login endpoints
  - Verify JWT token generation and validation
  - Ensure all tests pass, ask the user if questions arise

- [ ] 7. Implement Emergency Reports API module
  - [ ] 7.1 Create reports service layer
    - Create `backend/services/reportsService.js`
    - Implement createReport, getReports (with filters), getReportById, updateReport, deleteReport functions
    - Apply pagination to getReports
    - Support filters: location, disasterType, severity, status
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 7.2 Create reports controller and routes
    - Create `backend/controllers/reportsController.js`
    - Create `backend/routes/reports.js` with full CRUD endpoints
    - Apply authenticateToken to all routes
    - Apply requireRole(['admin']) to DELETE endpoint
    - Create audit log entry on create, update, delete
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 11.1_
  
  - [ ]* 7.3 Write unit tests for reports service
    - Test filtering by location, disasterType, severity, status
    - Test pagination format
    - Test admin-only delete restriction
    - _Requirements: 3.2, 3.3, 3.6_

- [ ] 8. Implement Disaster Events API module
  - [ ] 8.1 Create events service layer
    - Create `backend/services/eventsService.js`
    - Implement createEvent, getEvents, getEventById, updateEvent, deleteEvent functions
    - Implement cascade check for deleteEvent (check for active EmergencyReports or ResourceAllocations)
    - Return 409 if cascade check fails
    - _Requirements: 4.1, 4.3_
  
  - [ ] 8.2 Create events controller and routes
    - Create `backend/controllers/eventsController.js`
    - Create `backend/routes/events.js` with full CRUD endpoints
    - Apply authenticateToken and requireRole(['admin', 'operator']) to mutating endpoints
    - Create audit log entry on create, update, delete
    - _Requirements: 4.1, 4.3, 4.4, 11.1_

- [ ] 9. Implement Rescue Teams API module
  - [ ] 9.1 Create teams service layer
    - Create `backend/services/teamsService.js`
    - Implement createTeam, getTeams (with filters), getTeamById, updateTeam, deleteTeam, assignTeam functions
    - assignTeam creates TeamAssignment record and triggers status update via database trigger
    - _Requirements: 5.1, 5.2, 5.3, 5.6_
  
  - [ ] 9.2 Create teams controller and routes
    - Create `backend/controllers/teamsController.js`
    - Create `backend/routes/teams.js` with CRUD endpoints plus POST /:id/assign
    - Apply authenticateToken and requireRole(['admin', 'operator']) to mutating endpoints
    - Create audit log entry on create, update, delete, assign
    - _Requirements: 5.1, 5.2, 5.3, 5.7, 11.1_
  
  - [ ]* 9.3 Write integration tests for team assignment workflow
    - Test team status changes from Available to Assigned on assignment
    - Test team status changes from Assigned to Available on completion
    - Verify database triggers fire correctly
    - _Requirements: 5.4, 5.5_

- [ ] 10. Implement Resources and Warehouses API module
  - [ ] 10.1 Create warehouses service layer
    - Create `backend/services/warehousesService.js`
    - Implement createWarehouse, getWarehouses, updateWarehouse, deleteWarehouse functions
    - _Requirements: 6.1_
  
  - [ ] 10.2 Create resources service layer
    - Create `backend/services/resourcesService.js`
    - Implement createResource, getResources, getResourceById, updateResource, deleteResource, allocateResource functions
    - getResources adds lowStock flag when quantity < threshold
    - allocateResource creates ResourceAllocation with status=pending and ApprovalWorkflow record
    - _Requirements: 6.2, 6.3, 6.4, 7.1_
  
  - [ ] 10.3 Create resources controller and routes
    - Create `backend/controllers/resourcesController.js` and `backend/controllers/warehousesController.js`
    - Create `backend/routes/resources.js` with warehouse and resource CRUD endpoints plus POST /:id/allocate
    - Apply authenticateToken and requireRole(['admin', 'warehouse_manager']) to mutating endpoints
    - Create audit log entry on all mutations
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 11.1_
  
  - [ ]* 10.4 Write unit tests for low-stock detection
    - Test lowStock flag is true when quantity < threshold
    - Test lowStock flag is false when quantity >= threshold
    - _Requirements: 6.4, 6.5_

- [ ] 11. Implement Approvals API module
  - [ ] 11.1 Create approvals service layer
    - Create `backend/services/approvalsService.js`
    - Implement getApprovals (with filters), resolveApproval functions
    - resolveApproval uses prisma.$transaction to atomically update ApprovalWorkflow, ResourceAllocation, and Resource quantity
    - On approved: deduct stock, update allocation status to approved
    - On rejected: update allocation status to rejected without stock change
    - Return 409 if stock would go negative
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ] 11.2 Create approvals controller and routes
    - Create `backend/controllers/approvalsController.js`
    - Create `backend/routes/approvals.js` with GET / and POST /:id/resolve
    - Apply authenticateToken and requireRole(['admin', 'warehouse_manager']) to resolve endpoint
    - Create audit log entry on resolve
    - _Requirements: 7.2, 7.3, 7.7, 11.1_
  
  - [ ]* 11.3 Write integration tests for approval workflow
    - Test approved allocation deducts stock atomically
    - Test rejected allocation does not modify stock
    - Test negative stock prevention returns 409
    - Test transaction rollback on failure
    - _Requirements: 7.4, 7.5, 7.6, 10.1, 10.2, 10.4_

- [ ] 12. Checkpoint - Verify core backend modules
  - Test all CRUD endpoints for reports, events, teams, resources, approvals
  - Verify RBAC enforcement on protected endpoints
  - Verify audit logging on all mutations
  - Ensure all tests pass, ask the user if questions arise

- [ ] 13. Implement Hospitals API module
  - [ ] 13.1 Create hospitals service layer
    - Create `backend/services/hospitalsService.js`
    - Implement createHospital, getHospitals, getAvailableHospitals, getHospitalById, updateHospital, deleteHospital, admitPatient, dischargePatient functions
    - admitPatient uses prisma.$transaction to create Patient and decrement availableBeds
    - Return 409 if availableBeds = 0
    - dischargePatient uses prisma.$transaction to update Patient status and increment availableBeds
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 13.2 Create hospitals controller and routes
    - Create `backend/controllers/hospitalsController.js`
    - Create `backend/routes/hospitals.js` with CRUD endpoints plus GET /available, POST /:id/admit, POST /:id/discharge/:patientId
    - Apply authenticateToken and requireRole(['admin', 'operator']) to mutating endpoints
    - Create audit log entry on all mutations
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 11.1_
  
  - [ ]* 13.3 Write integration tests for hospital capacity management
    - Test admit decrements availableBeds atomically
    - Test discharge increments availableBeds atomically
    - Test admit returns 409 when availableBeds = 0
    - Test transaction rollback on failure
    - _Requirements: 8.2, 8.3, 8.4, 10.1, 10.2_

- [ ] 14. Implement Finance API module
  - [ ] 14.1 Create finance service layer
    - Create `backend/services/financeService.js`
    - Implement createDonation, getDonations (with filters), createExpense, getExpenses (with filters), getFinancialSummary functions
    - Support filters: startDate, endDate, eventId
    - getFinancialSummary aggregates total donations, total expenses, net balance, breakdown by DisasterEvent
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 14.2 Create finance controller and routes
    - Create `backend/controllers/financeController.js`
    - Create `backend/routes/finance.js` with POST /donations, GET /donations, POST /expenses, GET /expenses, GET /summary
    - Apply authenticateToken and requireRole(['admin', 'finance_officer']) to mutating endpoints
    - Create audit log entry on all mutations
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 11.1_
  
  - [ ]* 14.3 Write unit tests for financial summary aggregation
    - Test total donations calculation
    - Test total expenses calculation
    - Test net balance calculation
    - Test breakdown by DisasterEvent
    - _Requirements: 9.5_

- [ ] 15. Implement Analytics API module
  - [ ] 15.1 Create analytics service layer
    - Create `backend/services/analyticsService.js`
    - Implement getDashboardSummary, getIncidentDistribution, getResourceUtilization, getResponseTime, getFinanceBreakdown functions
    - getDashboardSummary returns counts for active incidents, available teams, low-stock resources, hospital occupancy, total donations, total expenses
    - getIncidentDistribution groups by location, disasterType, severity with optional date range filter
    - getResourceUtilization calculates utilization rates per warehouse and resource type
    - getResponseTime calculates average time between EmergencyReport creation and first TeamAssignment
    - getFinanceBreakdown groups donations and expenses by DisasterEvent and time period
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 15.2 Create analytics controller and routes
    - Create `backend/controllers/analyticsController.js`
    - Create `backend/routes/analytics.js` with GET /dashboard, GET /incidents, GET /resources, GET /response-time, GET /finance
    - Apply authenticateToken to all routes
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 16. Implement Audit Logs API module
  - Create `backend/services/auditService.js` with getAuditLogs function
  - Create `backend/controllers/auditController.js`
  - Create `backend/routes/audit.js` with GET / endpoint
  - Apply authenticateToken and requireRole(['admin'])
  - Support filters: actor (userId), entityType, action, startDate, endDate
  - Apply pagination
  - _Requirements: 11.5, 11.6_

- [ ] 17. Implement Users API module
  - Create `backend/services/usersService.js` with getUsers, getUserById, updateUser, deleteUser functions
  - Create `backend/controllers/usersController.js`
  - Create `backend/routes/users.js` with GET /, GET /:id, PUT /:id, DELETE /:id
  - Apply authenticateToken and requireRole(['admin']) to all routes
  - Create audit log entry on update and delete
  - _Requirements: 11.1_

- [ ] 18. Wire backend routes and create main server file
  - [ ] 18.1 Create Express app with middleware
    - Create `backend/server.js`
    - Initialize Express app
    - Configure CORS to allow http://localhost:3000
    - Add express.json() middleware
    - Add error handling middleware for 400, 403, 404, 500 responses
    - _Requirements: 19.5, 21.1, 21.2, 21.3, 21.4_
  
  - [ ] 18.2 Mount all route modules
    - Mount /api/auth, /api/reports, /api/events, /api/teams, /api/resources, /api/hospitals, /api/finance, /api/approvals, /api/analytics, /api/audit, /api/users
    - Start server on port 5000
    - _Requirements: 19.6_

- [ ] 19. Create database seed script
  - Create `backend/prisma/seed.js`
  - Create at least one User for each role (admin, operator, field_officer, warehouse_manager, finance_officer) with bcrypt-hashed passwords (saltRounds=12)
  - Create sample DisasterEvents, EmergencyReports, RescueTeams, Warehouses, Resources, Hospitals
  - Add seed script to package.json prisma.seed configuration
  - _Requirements: 19.4_

- [ ] 20. Checkpoint - Verify complete backend system
  - Run docker-compose up --build for backend and mysql services
  - Verify database migrations and seed data execute successfully
  - Test all API endpoints with Postman or curl
  - Verify RBAC, audit logging, pagination, transactions work correctly
  - Ensure all tests pass, ask the user if questions arise

- [x] 21. Set up frontend project structure
  - [ ] 21.1 Create frontend directory and package.json
    - Create `frontend/package.json` with dependencies: react, react-dom, react-router-dom, axios, tailwindcss, recharts
    - Create `frontend/Dockerfile` with Node.js 18 base image and nginx for production
    - Create `frontend/.dockerignore` to exclude node_modules
    - _Requirements: 19.6_
  
  - [ ] 21.2 Configure Vite and Tailwind
    - Create `frontend/vite.config.js` with proxy to http://backend:5000
    - Create `frontend/tailwind.config.js` with dark theme colors (gray-950, gray-900, gray-800)
    - Create `frontend/src/index.css` with Tailwind directives
    - _Requirements: 16.3_
  
  - [ ] 21.3 Create frontend directory structure
    - Create directories: src/components, src/pages, src/context, src/api, src/utils
    - Create `frontend/src/main.jsx` as entry point
    - _Requirements: 16.1_

- [ ] 22. Implement frontend API client and auth context
  - [ ] 22.1 Create Axios API client
    - Create `frontend/src/api/client.js`
    - Configure baseURL to /api (proxied to backend)
    - Add request interceptor to attach JWT from localStorage
    - Add response interceptor to handle 401 (redirect to login), 403, 404, 500 errors
    - _Requirements: 1.7, 21.6_
  
  - [ ] 22.2 Create AuthContext
    - Create `frontend/src/context/AuthContext.jsx`
    - Provide login, logout, user state, isAuthenticated
    - Store JWT in localStorage
    - Implement ProtectedRoute component that redirects to /login if not authenticated
    - _Requirements: 1.7, 1.8_

- [ ] 23. Implement frontend reusable components
  - [ ] 23.1 Create layout components
    - Create `frontend/src/components/Sidebar.jsx` with role-based navigation links
    - Create `frontend/src/components/Layout.jsx` with Sidebar and main content area
    - Apply dark theme styling (bg-gray-950, bg-gray-900, bg-gray-800)
    - _Requirements: 16.1, 16.3_
  
  - [ ] 23.2 Create UI components
    - Create `frontend/src/components/MetricCard.jsx` for dashboard summary cards
    - Create `frontend/src/components/DataTable.jsx` for paginated tables with filters
    - Create `frontend/src/components/FilterBar.jsx` for query parameter filters
    - Create `frontend/src/components/StatusBadge.jsx` with color coding (red-600 critical, orange-500 warning, green-500 success, blue-500 info)
    - Create `frontend/src/components/CapacityBar.jsx` for visual capacity indicators
    - Create `frontend/src/components/LoadingSpinner.jsx`
    - Create `frontend/src/components/Toast.jsx` for notifications
    - Create `frontend/src/components/Modal.jsx` for confirmation dialogs
    - Create `frontend/src/components/FormField.jsx` for inputs with validation display
    - _Requirements: 16.3, 16.4, 16.6, 21.5, 21.6_

- [ ] 24. Implement frontend authentication pages
  - Create `frontend/src/pages/LoginPage.jsx`
  - Implement login form with email and password fields
  - Call POST /api/auth/login on submit
  - Store JWT in localStorage via AuthContext
  - Redirect to /dashboard on success
  - Display error toast on failure
  - _Requirements: 1.7, 1.8, 21.6_

- [ ] 25. Implement Dashboard page
  - Create `frontend/src/pages/DashboardPage.jsx`
  - Fetch data from GET /api/analytics/dashboard
  - Display MetricCard components for active incidents, available teams, low-stock resources, financial balance
  - Apply dark theme styling
  - Show LoadingSpinner while fetching
  - _Requirements: 12.1, 12.6, 16.2, 16.3, 16.6_

- [ ] 26. Implement Emergency Reports page
  - Create `frontend/src/pages/EmergencyReportsPage.jsx`
  - Fetch data from GET /api/reports with pagination and filters
  - Display DataTable with columns: location, type, severity, status, reported time
  - Implement FilterBar for location, disasterType, severity, status
  - Implement create report form (accessible to operator and admin roles)
  - Call POST /api/reports on form submit
  - Display success/error toast
  - _Requirements: 3.8, 3.9, 17.2, 18.5_

- [ ] 27. Implement Rescue Teams page
  - Create `frontend/src/pages/RescueTeamsPage.jsx`
  - Fetch data from GET /api/teams
  - Display DataTable with columns: name, type, location, status
  - Display StatusBadge for team status (green Available, orange Assigned, red Busy)
  - Implement assign-to-incident action (accessible to operator and admin roles)
  - Call POST /api/teams/:id/assign on action
  - _Requirements: 5.7, 5.8, 17.3_

- [ ] 28. Implement Resources page
  - Create `frontend/src/pages/ResourcesPage.jsx`
  - Fetch data from GET /api/resources
  - Display warehouse-grouped inventory with quantity bars
  - Display visual warning indicator for lowStock resources
  - Implement allocate action (accessible to warehouse_manager and admin roles)
  - Call POST /api/resources/:id/allocate on action
  - _Requirements: 6.5, 6.6, 17.4_

- [ ] 29. Implement Hospitals page
  - Create `frontend/src/pages/HospitalsPage.jsx`
  - Fetch data from GET /api/hospitals
  - Display CapacityBar for each hospital showing total beds, occupied beds, available beds
  - Implement admit patient form (accessible to operator and admin roles)
  - Implement discharge patient action
  - Call POST /api/hospitals/:id/admit and POST /api/hospitals/:id/discharge/:patientId
  - _Requirements: 8.6, 8.7, 17.5_

- [ ] 30. Implement Finance page
  - Create `frontend/src/pages/FinancePage.jsx`
  - Fetch data from GET /api/finance/donations, GET /api/finance/expenses, GET /api/finance/summary
  - Display DataTable for donations and expenses
  - Display financial summary card with total donations, total expenses, net balance
  - Implement forms for recording donations and expenses (accessible to finance_officer and admin roles)
  - Call POST /api/finance/donations and POST /api/finance/expenses
  - _Requirements: 9.7, 9.8, 17.6_

- [ ] 31. Implement Approvals page
  - Create `frontend/src/pages/ApprovalsPage.jsx`
  - Fetch data from GET /api/approvals with filter for status=pending
  - Display DataTable with pending approval requests
  - Implement approve and reject buttons (accessible to admin and warehouse_manager roles)
  - Call POST /api/approvals/:id/resolve with decision and optional comment
  - Display approval history section showing resolved approvals
  - _Requirements: 7.8, 7.9, 17.7_

- [ ] 32. Implement Users page
  - Create `frontend/src/pages/UsersPage.jsx`
  - Fetch data from GET /api/users
  - Display DataTable with columns: username, email, role
  - Implement user management actions: update role, delete user (admin only)
  - Call PUT /api/users/:id and DELETE /api/users/:id
  - _Requirements: 17.8_

- [ ] 33. Implement Audit Logs page
  - Create `frontend/src/pages/AuditLogsPage.jsx`
  - Fetch data from GET /api/audit
  - Display DataTable with columns: timestamp, user, action, entity type, entity ID
  - Implement FilterBar for actor, entityType, action, date range
  - Admin-only access
  - _Requirements: 11.6, 17.9_

- [ ] 34. Implement Analytics page
  - Create `frontend/src/pages/AnalyticsPage.jsx`
  - Fetch data from GET /api/analytics/incidents, GET /api/analytics/resources, GET /api/analytics/response-time, GET /api/analytics/finance
  - Render Recharts bar charts, line charts, pie charts for incident distribution, resource utilization, response time trends, financial summaries
  - Implement interactive filtering by date range, disaster type, DisasterEvent
  - _Requirements: 12.7, 12.8, 17.10_

- [ ] 35. Wire frontend routing and finalize App component
  - Create `frontend/src/App.jsx`
  - Configure React Router with routes for all pages
  - Wrap protected routes with ProtectedRoute component
  - Apply role-based route restrictions
  - Wrap app with AuthContext provider
  - _Requirements: 16.1, 16.2_

- [ ] 36. Final integration and deployment verification
  - Run `docker-compose up --build` to start all services
  - Verify mysql service starts and migrations execute
  - Verify backend service starts on port 5000 after mysql health check
  - Verify frontend service starts on port 3000
  - Verify seed data is loaded
  - Test complete user workflow: login → dashboard → create report → assign team → allocate resource → approve allocation → view audit logs
  - Verify responsive design on mobile screen widths (375px+)
  - _Requirements: 19.1, 19.2, 19.3, 19.6, 16.5_

- [ ] 37. Final checkpoint - System acceptance
  - Verify all 21 requirements are satisfied
  - Verify all RBAC restrictions work correctly
  - Verify all audit logging captures mutations
  - Verify all database triggers fire correctly
  - Verify all transactions maintain ACID properties
  - Verify all pagination and filtering work correctly
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- All multi-table operations MUST use `prisma.$transaction([...])` for atomicity
- All mutating endpoints MUST create AuditLog entries
- All passwords MUST be hashed with bcrypt saltRounds=12
- All list endpoints MUST support pagination format: `{ data, total, page, limit, totalPages }`
- System MUST run with single `docker-compose up --build` command
- Use plain JavaScript (NOT TypeScript)
- Dark emergency operations center aesthetic: bg-gray-950, bg-gray-900, bg-gray-800
