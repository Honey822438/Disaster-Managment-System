-- ============================================
-- DATABASE VIEWS
-- ============================================

CREATE OR REPLACE VIEW v_active_incidents AS
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

CREATE OR REPLACE VIEW v_resource_stock AS
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

CREATE OR REPLACE VIEW v_financial_summary AS
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

CREATE OR REPLACE VIEW v_hospital_capacity AS
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

CREATE OR REPLACE VIEW v_team_history AS
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
