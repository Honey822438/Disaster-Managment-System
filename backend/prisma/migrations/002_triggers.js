/**
 * Applies database triggers using mysql2 directly (root connection)
 * Run with: node prisma/migrations/002_triggers.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const url = new URL(process.env.DATABASE_URL);

// Use root credentials to enable log_bin_trust_function_creators
const rootConfig = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: 'root',
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: url.pathname.replace('/', ''),
};

// Regular user config for trigger creation
const userConfig = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.replace('/', ''),
};

const triggers = [
  {
    name: 'after_allocation_approved',
    drop: 'DROP TRIGGER IF EXISTS after_allocation_approved',
    create: [
      'CREATE TRIGGER after_allocation_approved',
      'AFTER UPDATE ON ResourceAllocation',
      'FOR EACH ROW',
      'BEGIN',
      "  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN",
      '    UPDATE Resource SET quantity = quantity - NEW.quantity WHERE id = NEW.resourceId;',
      '  END IF;',
      'END'
    ].join('\n')
  },
  {
    name: 'prevent_negative_stock',
    drop: 'DROP TRIGGER IF EXISTS prevent_negative_stock',
    create: [
      'CREATE TRIGGER prevent_negative_stock',
      'BEFORE UPDATE ON Resource',
      'FOR EACH ROW',
      'BEGIN',
      '  IF NEW.quantity < 0 THEN',
      "    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Resource quantity cannot be negative';",
      '  END IF;',
      'END'
    ].join('\n')
  },
  {
    name: 'after_team_assignment_insert',
    drop: 'DROP TRIGGER IF EXISTS after_team_assignment_insert',
    create: [
      'CREATE TRIGGER after_team_assignment_insert',
      'AFTER INSERT ON TeamAssignment',
      'FOR EACH ROW',
      'BEGIN',
      "  UPDATE RescueTeam SET status = 'Assigned' WHERE id = NEW.rescueTeamId;",
      'END'
    ].join('\n')
  },
  {
    name: 'after_team_assignment_complete',
    drop: 'DROP TRIGGER IF EXISTS after_team_assignment_complete',
    create: [
      'CREATE TRIGGER after_team_assignment_complete',
      'AFTER UPDATE ON TeamAssignment',
      'FOR EACH ROW',
      'BEGIN',
      "  IF NEW.status IN ('Resolved', 'Closed') AND OLD.status NOT IN ('Resolved', 'Closed') THEN",
      "    UPDATE RescueTeam SET status = 'Available' WHERE id = NEW.rescueTeamId;",
      '  END IF;',
      'END'
    ].join('\n')
  },
  {
    name: 'log_report_status_change',
    drop: 'DROP TRIGGER IF EXISTS log_report_status_change',
    create: [
      'CREATE TRIGGER log_report_status_change',
      'AFTER UPDATE ON EmergencyReport',
      'FOR EACH ROW',
      'BEGIN',
      '  IF NEW.status != OLD.status THEN',
      '    INSERT INTO AuditLog (userId, action, entityType, entityId, previousState, newState, createdAt)',
      "    VALUES (NULL, 'STATUS_CHANGE', 'EmergencyReport', NEW.id,",
      "      JSON_OBJECT('status', OLD.status), JSON_OBJECT('status', NEW.status), NOW());",
      '  END IF;',
      'END'
    ].join('\n')
  }
];

async function applyTriggers() {
  console.log('🔧 Applying database triggers...');

  // Step 1: Enable log_bin_trust_function_creators as root
  try {
    const rootConn = await mysql.createConnection(rootConfig);
    await rootConn.query('SET GLOBAL log_bin_trust_function_creators = 1');
    await rootConn.end();
    console.log('  ✅ Enabled log_bin_trust_function_creators');
  } catch (err) {
    console.warn(`  ⚠️  Could not set log_bin_trust_function_creators (${err.message})`);
    console.warn('     Trying to create triggers anyway...');
  }

  // Step 2: Create triggers as regular user
  const conn = await mysql.createConnection(userConfig);

  for (const trigger of triggers) {
    try {
      await conn.query(trigger.drop);
      await conn.query(trigger.create);
      console.log(`  ✅ ${trigger.name}`);
    } catch (err) {
      console.error(`  ❌ ${trigger.name}: ${err.message}`);
    }
  }

  await conn.end();
  console.log('✨ Triggers done!');
}

applyTriggers().catch(e => {
  console.error('Failed:', e.message);
  process.exit(1);
});
