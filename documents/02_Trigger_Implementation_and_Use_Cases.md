# Trigger Implementation & Use Cases
## Smart Disaster Response MIS

---

## 1. Overview

Database triggers are stored procedures that automatically execute in response to specific events on a table (INSERT, UPDATE, DELETE). This system implements **5 MySQL triggers** that enforce business rules at the database level — independent of application logic.

**Why triggers?**
- Enforce rules even if the application is bypassed (e.g., direct DB access)
- Reduce application complexity for cross-table updates
- Guarantee consistency without relying solely on backend code
- Provide automatic audit logging at the database level

**Implementation File:** `backend/prisma/migrations/002_triggers.js`
**Applied via:** `node prisma/migrations/002_triggers.js` during Docker startup

---

## 2. Trigger 1: `after_allocation_approved`

**Type:** AFTER UPDATE  
**Table:** `ResourceAllocation`

### Purpose
When a resource allocation request is approved, automatically deduct the allocated quantity from the warehouse resource stock.

### SQL Definition
```sql
CREATE TRIGGER after_allocation_approved
AFTER UPDATE ON ResourceAllocation
FOR EACH ROW
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE Resource
    SET quantity = quantity - NEW.quantity
    WHERE id = NEW.resourceId;
  END IF;
END
```

### Use Case
1. A field officer requests 200 water bottles for a flood event
2. ResourceAllocation record is created with `status = 'pending'`
3. Warehouse manager approves the request → status changes to `'approved'`
4. **Trigger fires automatically** → Resource quantity decreases by 200
5. No application code needed to update the stock — the database handles it

### Condition Check
The `IF NEW.status = 'approved' AND OLD.status != 'approved'` condition ensures the trigger only fires on the transition to approved, not on every update to the allocation record.

---

## 3. Trigger 2: `prevent_negative_stock`

**Type:** BEFORE UPDATE  
**Table:** `Resource`

### Purpose
Enforce a business rule that resource quantities can never go below zero. This acts as a database-level safety net.

### SQL Definition
```sql
CREATE TRIGGER prevent_negative_stock
BEFORE UPDATE ON Resource
FOR EACH ROW
BEGIN
  IF NEW.quantity < 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Resource quantity cannot be negative';
  END IF;
END
```

### Use Case
1. An allocation approval attempts to deduct 500 units from a resource with only 300 in stock
2. The `after_allocation_approved` trigger fires and tries to set quantity to -200
3. **`prevent_negative_stock` fires BEFORE the update** → raises a SQL error
4. The entire transaction is rolled back
5. The allocation approval fails with a clear error message

### Why BEFORE UPDATE?
BEFORE triggers can cancel the operation by raising a SIGNAL. AFTER triggers cannot prevent the change. This trigger must be BEFORE to block the invalid update.

---

## 4. Trigger 3: `after_team_assignment_insert`

**Type:** AFTER INSERT  
**Table:** `TeamAssignment`

### Purpose
When a rescue team is assigned to an emergency report, automatically update the team's status from `Available` to `Assigned`.

### SQL Definition
```sql
CREATE TRIGGER after_team_assignment_insert
AFTER INSERT ON TeamAssignment
FOR EACH ROW
BEGIN
  UPDATE RescueTeam
  SET status = 'Assigned'
  WHERE id = NEW.rescueTeamId;
END
```

### Use Case
1. Emergency operator assigns Alpha Medical Team to a flood report
2. A new `TeamAssignment` record is inserted
3. **Trigger fires automatically** → `RescueTeam.status` changes to `'Assigned'`
4. The team no longer appears in the "Available Teams" list
5. Real-time dashboard reflects the updated team count

### Impact
Without this trigger, the application would need to manually update the team status in a separate query. The trigger guarantees the status is always updated, even if the application code is modified or bypassed.

---

## 5. Trigger 4: `after_team_assignment_complete`

**Type:** AFTER UPDATE  
**Table:** `TeamAssignment`

### Purpose
When a team assignment is marked as Resolved or Closed, automatically set the team's status back to `Available` so it can be assigned to new missions.

### SQL Definition
```sql
CREATE TRIGGER after_team_assignment_complete
AFTER UPDATE ON TeamAssignment
FOR EACH ROW
BEGIN
  IF NEW.status IN ('Resolved', 'Closed')
     AND OLD.status NOT IN ('Resolved', 'Closed') THEN
    UPDATE RescueTeam
    SET status = 'Available'
    WHERE id = NEW.rescueTeamId;
  END IF;
END
```

### Use Case
1. Rescue team completes their mission at the flood site
2. Operator marks the TeamAssignment as `'Resolved'`
3. **Trigger fires automatically** → `RescueTeam.status` changes back to `'Available'`
4. Team reappears in the available teams list
5. Can now be assigned to new emergency reports

### Condition Check
The `IF NEW.status IN ('Resolved', 'Closed') AND OLD.status NOT IN (...)` condition prevents the trigger from firing on every update — only on the transition to a completed state.

---

## 6. Trigger 5: `log_report_status_change`

**Type:** AFTER UPDATE  
**Table:** `EmergencyReport`

### Purpose
Automatically log every status change on an emergency report to the AuditLog table. This creates an immutable audit trail of how each report progressed through its lifecycle.

### SQL Definition
```sql
CREATE TRIGGER log_report_status_change
AFTER UPDATE ON EmergencyReport
FOR EACH ROW
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO AuditLog (
      userId, action, entityType, entityId,
      previousState, newState, createdAt
    )
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
END
```

### Use Case
1. Emergency report #42 is created with status `'Pending'`
2. Operator assigns a team → status changes to `'Assigned'`
3. **Trigger fires** → AuditLog entry: `{status: 'Pending'} → {status: 'Assigned'}`
4. Field officer updates to `'InProgress'`
5. **Trigger fires again** → AuditLog entry: `{status: 'Assigned'} → {status: 'InProgress'}`
6. Report resolved → **Trigger fires** → Final audit entry logged

### Audit Trail Value
The admin can view the complete lifecycle of any emergency report in the Audit Logs page, with timestamps for every status transition. This satisfies compliance and accountability requirements.

---

## 7. Trigger Interaction Summary

```
INSERT TeamAssignment
    └─► after_team_assignment_insert
            └─► UPDATE RescueTeam.status = 'Assigned'
                    └─► prevent_negative_stock (not applicable here)

UPDATE ResourceAllocation (status → 'approved')
    └─► after_allocation_approved
            └─► UPDATE Resource.quantity -= allocation.quantity
                    └─► prevent_negative_stock (BEFORE UPDATE)
                            └─► SIGNAL if quantity < 0 → ROLLBACK

UPDATE TeamAssignment (status → 'Resolved')
    └─► after_team_assignment_complete
            └─► UPDATE RescueTeam.status = 'Available'

UPDATE EmergencyReport (status changes)
    └─► log_report_status_change
            └─► INSERT AuditLog
```

---

## 8. Trigger vs Application Logic Comparison

| Scenario | Without Trigger | With Trigger |
|---|---|---|
| Team assigned | App must manually update team status | DB handles it automatically |
| Allocation approved | App must manually deduct stock | DB handles it automatically |
| Negative stock | App must check before every update | DB blocks it at the lowest level |
| Report status change | App must manually write audit log | DB writes it automatically |
| Direct DB access | Rules bypassed | Rules enforced regardless |
