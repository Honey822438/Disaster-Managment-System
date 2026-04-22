-- ============================================================
-- Smart Disaster Response MIS
-- Plain MySQL CREATE TABLE Statements
-- (For documentation/submission purposes)
-- ============================================================

CREATE TABLE User (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL,
    createdAt   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updatedAt   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE DisasterEvent (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(50)  NOT NULL,
    location    VARCHAR(255) NOT NULL,
    startDate   DATETIME     NOT NULL,
    endDate     DATETIME,
    description TEXT,
    totalBudget DECIMAL(15,2) DEFAULT 0.00,
    createdAt   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updatedAt   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE EmergencyReport (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    location        VARCHAR(255) NOT NULL,
    disasterType    VARCHAR(50)  NOT NULL,
    severity        VARCHAR(50)  NOT NULL,
    description     TEXT         NOT NULL,
    reportedBy      VARCHAR(100),
    contactNumber   VARCHAR(20),
    status          VARCHAR(50)  DEFAULT 'Pending',
    reportedAt      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    disasterEventId INT,
    FOREIGN KEY (disasterEventId) REFERENCES DisasterEvent(id) ON DELETE SET NULL
);

CREATE TABLE RescueTeam (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(50)  NOT NULL,
    location    VARCHAR(255) NOT NULL,
    status      VARCHAR(50)  DEFAULT 'Available',
    memberCount INT          NOT NULL,
    createdAt   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updatedAt   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE TeamAssignment (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    rescueTeamId      INT         NOT NULL,
    emergencyReportId INT         NOT NULL,
    assignedAt        DATETIME    DEFAULT CURRENT_TIMESTAMP,
    completedAt       DATETIME,
    status            VARCHAR(50) DEFAULT 'Assigned',
    notes             TEXT,
    FOREIGN KEY (rescueTeamId)      REFERENCES RescueTeam(id)      ON DELETE CASCADE,
    FOREIGN KEY (emergencyReportId) REFERENCES EmergencyReport(id)  ON DELETE CASCADE
);

CREATE TABLE Warehouse (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    location  VARCHAR(255) NOT NULL,
    capacity  INT          NOT NULL,
    createdAt DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE Resource (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    resourceType VARCHAR(50)  NOT NULL,
    quantity     INT          NOT NULL,
    threshold    INT          DEFAULT 100,
    unit         VARCHAR(50)  NOT NULL,
    warehouseId  INT          NOT NULL,
    createdAt    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updatedAt    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouseId) REFERENCES Warehouse(id) ON DELETE CASCADE
);

CREATE TABLE ResourceAllocation (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    resourceId      INT          NOT NULL,
    disasterEventId INT          NOT NULL,
    quantity        INT          NOT NULL,
    status          VARCHAR(50)  DEFAULT 'pending',
    requestedBy     VARCHAR(100) NOT NULL,
    createdAt       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resourceId)      REFERENCES Resource(id)      ON DELETE CASCADE,
    FOREIGN KEY (disasterEventId) REFERENCES DisasterEvent(id) ON DELETE CASCADE
);

CREATE TABLE Hospital (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    location      VARCHAR(255) NOT NULL,
    totalBeds     INT          NOT NULL,
    availableBeds INT          NOT NULL,
    contactNumber VARCHAR(20)  NOT NULL,
    createdAt     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updatedAt     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE Patient (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    age               INT          NOT NULL,
    gender            VARCHAR(10)  NOT NULL,
    condition         TEXT         NOT NULL,
    status            VARCHAR(50)  DEFAULT 'admitted',
    hospitalId        INT          NOT NULL,
    emergencyReportId INT,
    admittedAt        DATETIME     DEFAULT CURRENT_TIMESTAMP,
    dischargedAt      DATETIME,
    FOREIGN KEY (hospitalId)        REFERENCES Hospital(id)        ON DELETE CASCADE,
    FOREIGN KEY (emergencyReportId) REFERENCES EmergencyReport(id) ON DELETE SET NULL
);

CREATE TABLE Donation (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    donorName       VARCHAR(100)   NOT NULL,
    organization    VARCHAR(100),
    donorType       VARCHAR(50)    DEFAULT 'Individual',
    amount          DECIMAL(15, 2) NOT NULL,
    disasterEventId INT            NOT NULL,
    donatedAt       DATETIME       DEFAULT CURRENT_TIMESTAMP,
    createdAt       DATETIME       DEFAULT CURRENT_TIMESTAMP,
    recordedById    INT,
    FOREIGN KEY (disasterEventId) REFERENCES DisasterEvent(id) ON DELETE CASCADE,
    FOREIGN KEY (recordedById)    REFERENCES User(id) ON DELETE SET NULL,
    INDEX idx_donations_date (donatedAt),
    INDEX idx_donations_event (disasterEventId),
    INDEX idx_donations_type (donorType)
);

CREATE TABLE Expense (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    category        VARCHAR(50)    NOT NULL,
    amount          DECIMAL(15, 2) NOT NULL,
    description     TEXT           NOT NULL,
    disasterEventId INT            NOT NULL,
    status          VARCHAR(50)    DEFAULT 'pending',
    approvedById    INT,
    recordedById    INT,
    receiptRef      VARCHAR(200),
    createdAt       DATETIME       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disasterEventId) REFERENCES DisasterEvent(id) ON DELETE CASCADE,
    FOREIGN KEY (approvedById)    REFERENCES User(id) ON DELETE SET NULL,
    FOREIGN KEY (recordedById)    REFERENCES User(id) ON DELETE SET NULL,
    INDEX idx_expenses_category_date (category, createdAt),
    INDEX idx_expenses_event (disasterEventId),
    INDEX idx_expenses_status (status)
);

-- Budget tracking per disaster event
CREATE TABLE Budget (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    disasterEventId INT            NOT NULL UNIQUE,
    totalBudget     DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
    allocatedAmount DECIMAL(15,2)  DEFAULT 0.00,
    spentAmount     DECIMAL(15,2)  DEFAULT 0.00,
    createdAt       DATETIME       DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (disasterEventId) REFERENCES DisasterEvent(id) ON DELETE CASCADE
);

-- Financial transactions audit trail
CREATE TABLE FinancialTransaction (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    transactionType VARCHAR(50)    NOT NULL,
    referenceId     INT            NOT NULL,
    amount          DECIMAL(15,2)  NOT NULL,
    disasterEventId INT,
    performedById   INT,
    description     TEXT,
    createdAt       DATETIME       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disasterEventId) REFERENCES DisasterEvent(id) ON DELETE SET NULL,
    FOREIGN KEY (performedById)   REFERENCES User(id) ON DELETE SET NULL,
    INDEX idx_fin_tx_date (createdAt),
    INDEX idx_fin_tx_type (transactionType),
    INDEX idx_fin_tx_event (disasterEventId)
);

CREATE TABLE ApprovalWorkflow (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    type                 VARCHAR(50) NOT NULL,
    status               VARCHAR(50) DEFAULT 'pending',
    requesterId          INT         NOT NULL,
    resolverId           INT,
    resourceAllocationId INT         UNIQUE,
    comment              TEXT,
    createdAt            DATETIME    DEFAULT CURRENT_TIMESTAMP,
    resolvedAt           DATETIME,
    FOREIGN KEY (requesterId)          REFERENCES User(id)               ON DELETE CASCADE,
    FOREIGN KEY (resourceAllocationId) REFERENCES ResourceAllocation(id) ON DELETE CASCADE
);

CREATE TABLE AuditLog (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    userId        INT,
    action        VARCHAR(100) NOT NULL,
    entityType    VARCHAR(50)  NOT NULL,
    entityId      INT,
    previousState TEXT,
    newState      TEXT,
    createdAt     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL
);

-- ============================================================
-- FINANCE MODULE: VIEWS
-- ============================================================

-- Finance summary view per disaster event
CREATE OR REPLACE VIEW v_finance_summary AS
SELECT
    de.id              AS event_id,
    de.name            AS event_name,
    de.type            AS event_type,
    de.totalBudget     AS total_budget,
    COALESCE(SUM(d.amount), 0)  AS total_donations,
    COALESCE(SUM(e.amount), 0)  AS total_expenses,
    COALESCE(SUM(d.amount), 0) - COALESCE(SUM(e.amount), 0) AS net_balance,
    de.totalBudget - COALESCE(SUM(e.amount), 0)             AS remaining_budget,
    COUNT(DISTINCT d.id) AS donation_count,
    COUNT(DISTINCT e.id) AS expense_count
FROM DisasterEvent de
LEFT JOIN Donation d ON de.id = d.disasterEventId
LEFT JOIN Expense  e ON de.id = e.disasterEventId
GROUP BY de.id, de.name, de.type, de.totalBudget;

-- Finance officer view (approved expenses only)
CREATE OR REPLACE VIEW v_finance_officer_view AS
SELECT
    e.id,
    e.category,
    e.amount,
    e.description,
    e.status,
    e.createdAt,
    de.name  AS event_name,
    u.username AS recorded_by
FROM Expense e
LEFT JOIN DisasterEvent de ON e.disasterEventId = de.id
LEFT JOIN User u ON e.recordedById = u.id;

-- ============================================================
-- FINANCE MODULE: SAMPLE DML
-- ============================================================

-- Sample donations
INSERT INTO Donation (donorName, organization, donorType, amount, disasterEventId, recordedById)
VALUES
    ('Ahmed Khan',    'Red Crescent',  'NGO',          500000.00, 1, 5),
    ('Sara Ali',      NULL,            'Individual',    25000.00,  1, 5),
    ('UNICEF',        'UNICEF',        'Organization', 1000000.00, 2, 5);

-- Sample expenses
INSERT INTO Expense (category, amount, description, disasterEventId, status, recordedById)
VALUES
    ('Medical',    150000.00, 'Emergency medicines and first aid kits',    1, 'approved', 5),
    ('Transport',   75000.00, 'Helicopter fuel and vehicle maintenance',   1, 'approved', 5),
    ('Procurement', 200000.00,'Food packs and water bottles procurement',  2, 'pending',  5);
