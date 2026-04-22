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
    amount          DECIMAL(15, 2) NOT NULL,
    disasterEventId INT            NOT NULL,
    donatedAt       DATETIME       DEFAULT CURRENT_TIMESTAMP,
    createdAt       DATETIME       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disasterEventId) REFERENCES DisasterEvent(id) ON DELETE CASCADE
);

CREATE TABLE Expense (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    category        VARCHAR(50)    NOT NULL,
    amount          DECIMAL(15, 2) NOT NULL,
    description     TEXT           NOT NULL,
    disasterEventId INT            NOT NULL,
    createdAt       DATETIME       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disasterEventId) REFERENCES DisasterEvent(id) ON DELETE CASCADE
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
