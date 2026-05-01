# Transaction Handling Demonstration
## Smart Disaster Response MIS

---

## 1. Overview

A **database transaction** is a sequence of operations treated as a single logical unit. Either all operations succeed (COMMIT) or all are rolled back (ROLLBACK) on failure — ensuring ACID properties.

This system uses **Prisma's `$transaction()`** API which wraps multiple database operations in a single atomic MySQL transaction. If any step throws an error, MySQL automatically rolls back all changes made within that transaction.

---

## 2. ACID Properties in This System

| Property | Implementation |
|---|---|
| **Atomicity** | `prisma.$transaction()` — all steps succeed or all roll back |
| **Consistency** | Foreign key constraints, NOT NULL, UNIQUE enforced at DB level |
| **Isolation** | MySQL default isolation level (REPEATABLE READ) |
| **Durability** | MySQL InnoDB engine — committed data persists through crashes |

---

## 3. Transaction 1: Donation Recording

**File:** `backend/services/financeService.js` — `createDonation()`

**Business Rule:** Recording a donation must atomically:
1. Insert the donation record
2. Log to FinancialTransaction audit trail
3. Log to FinancialAuditLog (immutable)
4. Update or create the Budget record for the event

**Code:**
```javascript
const result = await prisma.$transaction(async (tx) => {
  // Step 1: Create donation
  const donation = await tx.donation.create({
    data: {
      donorName: data.donorName,
      amount: parseFloat(data.amount),
      disasterEventId: parseInt(data.disasterEventId),
      donatedAt: data.donatedAt ? new Date(data.donatedAt) : new Date(),
      recordedById: userId,
    }
  });

  // Step 2: Log to FinancialTransaction
  await tx.financialTransaction.create({
    data: {
      transactionType: 'DONATION',
      referenceId: donation.id,
      amount: parseFloat(data.amount),
      disasterEventId: parseInt(data.disasterEventId),
      performedById: userId,
      description: `Donation from ${data.donorName}`,
    }
  });

  // Step 3: Log to FinancialAuditLog
  await tx.financialAuditLog.create({
    data: {
      userId,
      action: 'DONATION_CREATED',
      entityType: 'Donation',
      entityId: donation.id,
      amount: parseFloat(data.amount),
      disasterEventId: parseInt(data.disasterEventId),
    }
  });

  // Step 4: Update Budget (upsert)
  await tx.budget.upsert({
    where: { disasterEventId: parseInt(data.disasterEventId) },
    update: { allocatedAmount: { increment: parseFloat(data.amount) } },
    create: {
      disasterEventId: parseInt(data.disasterEventId),
      totalBudget: parseFloat(data.amount),
      allocatedAmount: parseFloat(data.amount),
      spentAmount: 0,
    }
  });

  return donation;
});
```

**Rollback Scenario:**
If Step 4 (budget upsert) fails due to a constraint violation, MySQL rolls back Steps 1, 2, and 3. The donation is never saved, the financial log is never written, and the budget is unchanged. The database remains consistent.

---

## 4. Transaction 2: Expense Approval

**File:** `backend/services/financeService.js` — `approveExpense()`

**Business Rule:** Approving an expense must atomically:
1. Verify expense exists and is still pending
2. Check budget has sufficient remaining funds
3. Deduct from budget's `spentAmount`
4. Update expense status to `approved`
5. Log approval to FinancialAuditLog
6. Log to FinancialTransaction

**Code:**
```javascript
const result = await prisma.$transaction(async (tx) => {
  const expense = await tx.expense.findUnique({
    where: { id: parseInt(expenseId) }
  });

  if (!expense) throw new Error('Expense not found');
  if (expense.status !== 'pending') throw new Error('Expense already processed');

  const budget = await tx.budget.findUnique({
    where: { disasterEventId: expense.disasterEventId }
  });

  if (budget) {
    const remaining = parseFloat(budget.totalBudget) - parseFloat(budget.spentAmount);
    if (parseFloat(expense.amount) > remaining) {
      throw new Error(`Insufficient budget. Available: ${remaining}`);
    }
    // Deduct from budget
    await tx.budget.update({
      where: { disasterEventId: expense.disasterEventId },
      data: { spentAmount: { increment: parseFloat(expense.amount) } }
    });
  }

  // Approve expense
  const updated = await tx.expense.update({
    where: { id: parseInt(expenseId) },
    data: { status: 'approved', approvedById: approverId }
  });

  // Audit log
  await tx.financialAuditLog.create({
    data: {
      userId: approverId,
      action: 'EXPENSE_APPROVED',
      entityType: 'Expense',
      entityId: expense.id,
      amount: parseFloat(expense.amount),
      previousState: JSON.stringify({ status: 'pending' }),
      newState: JSON.stringify({ status: 'approved' }),
    }
  });

  return updated;
});
```

**Rollback Scenario:**
If the budget check fails (`Insufficient budget`), the `throw new Error()` causes Prisma to roll back the entire transaction. The expense status remains `pending`, the budget `spentAmount` is unchanged, and no audit log is written.

---

## 5. Transaction 3: Resource Allocation Request

**File:** `backend/services/resourcesService.js` — `allocateResource()`

**Business Rule:** Creating a resource allocation must atomically:
1. Verify resource and disaster event exist
2. Check sufficient quantity is available
3. Create ResourceAllocation record (status: pending)
4. Create ApprovalWorkflow record linked to the allocation

**Code:**
```javascript
const result = await prisma.$transaction(async (tx) => {
  const allocation = await tx.resourceAllocation.create({
    data: {
      resourceId: parseInt(resourceId),
      disasterEventId: parseInt(disasterEventId),
      quantity: parseInt(quantity),
      status: 'pending',
      requestedBy
    }
  });

  const approval = await tx.approvalWorkflow.create({
    data: {
      type: 'ResourceAllocation',
      status: 'pending',
      requesterId: requesterId,
      resourceAllocationId: allocation.id
    }
  });

  return { allocation, approval };
});
```

**Rollback Scenario:**
If the ApprovalWorkflow creation fails (e.g., invalid requesterId foreign key), the ResourceAllocation is also rolled back. No orphaned allocation exists without a corresponding approval workflow.

---

## 6. Transaction 4: Approval Resolution (Resource Deduction)

**File:** `backend/services/approvalsService.js` — `resolveApproval()`

**Business Rule:** Approving a resource allocation must atomically:
1. Update ApprovalWorkflow status
2. Update ResourceAllocation status
3. Deduct quantity from Resource stock
4. Verify stock does not go negative

**Code:**
```javascript
const result = await prisma.$transaction(async (tx) => {
  const updatedApproval = await tx.approvalWorkflow.update({
    where: { id: parseInt(id) },
    data: { status: decision, resolverId, resolvedAt: new Date(), comment }
  });

  if (decision === 'approved') {
    await tx.resourceAllocation.update({
      where: { id: approval.resourceAllocationId },
      data: { status: 'approved' }
    });

    const newQuantity = resource.quantity - approval.resourceAllocation.quantity;
    if (newQuantity < 0) {
      throw new Error('Insufficient stock: approval would result in negative quantity');
    }

    await tx.resource.update({
      where: { id: resource.id },
      data: { quantity: newQuantity }
    });
  }

  return updatedApproval;
});
```

**Rollback Scenario:**
If `newQuantity < 0`, the error is thrown inside the transaction. MySQL rolls back the approval status update and the allocation status update. The resource quantity is unchanged. The approval remains `pending`.

---

## 7. Transaction 5: Resource Procurement

**File:** `backend/services/financeService.js` — `purchaseResource()`

**Business Rule:** Buying resources must atomically:
1. Increase resource stock quantity
2. Record approved Procurement expense
3. Log to FinancialTransaction
4. Log to FinancialAuditLog

**Rollback Scenario:**
If the expense creation fails, the resource quantity increment is rolled back. Stock is never increased without a corresponding financial record.

---

## 8. Transaction 6: Team Assignment

**File:** `backend/services/teamsService.js` — `assignTeam()`

**Business Rule:** Assigning a team must atomically:
1. Create TeamAssignment record (triggers DB trigger to set team status)
2. Update EmergencyReport status from `Pending` to `Assigned`

**Code:**
```javascript
const result = await prisma.$transaction(async (tx) => {
  const assignment = await tx.teamAssignment.create({
    data: {
      rescueTeamId: parseInt(teamId),
      emergencyReportId: parseInt(emergencyReportId),
      notes
    }
  });

  if (report.status === 'Pending') {
    await tx.emergencyReport.update({
      where: { id: parseInt(emergencyReportId) },
      data: { status: 'Assigned' }
    });
  }

  return assignment;
});
```

**Rollback Scenario:**
If the report status update fails, the TeamAssignment is rolled back. No assignment exists without the report being updated, preventing inconsistent state.

---

## 9. Summary Table

| Transaction | Tables Involved | Rollback Trigger |
|---|---|---|
| Donation Recording | Donation, FinancialTransaction, FinancialAuditLog, Budget | Any step failure |
| Expense Approval | Expense, Budget, FinancialAuditLog, FinancialTransaction | Insufficient budget |
| Resource Allocation | ResourceAllocation, ApprovalWorkflow | FK violation or error |
| Approval Resolution | ApprovalWorkflow, ResourceAllocation, Resource | Negative stock check |
| Resource Procurement | Resource, Expense, FinancialTransaction, FinancialAuditLog | Any step failure |
| Team Assignment | TeamAssignment, EmergencyReport | Any step failure |
