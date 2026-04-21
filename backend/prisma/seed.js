const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create users for each role
  console.log('Creating users...');
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@disaster.gov' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@disaster.gov',
        password: await bcrypt.hash('admin123', SALT_ROUNDS),
        role: 'admin'
      }
    }),
    prisma.user.upsert({
      where: { email: 'operator@disaster.gov' },
      update: {},
      create: {
        username: 'operator',
        email: 'operator@disaster.gov',
        password: await bcrypt.hash('operator123', SALT_ROUNDS),
        role: 'operator'
      }
    }),
    prisma.user.upsert({
      where: { email: 'field@disaster.gov' },
      update: {},
      create: {
        username: 'field_officer',
        email: 'field@disaster.gov',
        password: await bcrypt.hash('field123', SALT_ROUNDS),
        role: 'field_officer'
      }
    }),
    prisma.user.upsert({
      where: { email: 'warehouse@disaster.gov' },
      update: {},
      create: {
        username: 'warehouse_manager',
        email: 'warehouse@disaster.gov',
        password: await bcrypt.hash('warehouse123', SALT_ROUNDS),
        role: 'warehouse_manager'
      }
    }),
    prisma.user.upsert({
      where: { email: 'finance@disaster.gov' },
      update: {},
      create: {
        username: 'finance_officer',
        email: 'finance@disaster.gov',
        password: await bcrypt.hash('finance123', SALT_ROUNDS),
        role: 'finance_officer'
      }
    }),
    // Dedicated citizen portal user
    prisma.user.upsert({
      where: { email: 'citizen@disaster.gov' },
      update: {},
      create: {
        username: 'citizen_user',
        email: 'citizen@disaster.gov',
        password: await bcrypt.hash('citizen123', SALT_ROUNDS),
        role: 'field_officer'
      }
    }),
    // Dedicated rescue team portal user
    prisma.user.upsert({
      where: { email: 'rescue@disaster.gov' },
      update: {},
      create: {
        username: 'rescue_officer',
        email: 'rescue@disaster.gov',
        password: await bcrypt.hash('rescue123', SALT_ROUNDS),
        role: 'field_officer'
      }
    }),
    // Dedicated hospital portal user
    prisma.user.upsert({
      where: { email: 'hospital@disaster.gov' },
      update: {},
      create: {
        username: 'hospital_staff',
        email: 'hospital@disaster.gov',
        password: await bcrypt.hash('hospital123', SALT_ROUNDS),
        role: 'operator'
      }
    })
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create disaster events
  console.log('Creating disaster events...');
  
  const events = await Promise.all([
    prisma.disasterEvent.create({
      data: {
        name: 'Metro City Flood 2024',
        type: 'Flood',
        location: 'Metro City Downtown',
        startDate: new Date('2024-01-15'),
        description: 'Heavy rainfall causing severe flooding in downtown area'
      }
    }),
    prisma.disasterEvent.create({
      data: {
        name: 'Northern Earthquake',
        type: 'Earthquake',
        location: 'Northern Province',
        startDate: new Date('2024-02-20'),
        description: '6.5 magnitude earthquake affecting multiple districts'
      }
    }),
    prisma.disasterEvent.create({
      data: {
        name: 'Coastal Cyclone Alert',
        type: 'Cyclone',
        location: 'Coastal Region',
        startDate: new Date('2024-03-10'),
        description: 'Category 3 cyclone approaching coastal areas'
      }
    })
  ]);

  console.log(`✅ Created ${events.length} disaster events`);

  // Create emergency reports
  console.log('Creating emergency reports...');
  
  const reports = await Promise.all([
    prisma.emergencyReport.create({
      data: {
        location: 'Metro City, Block A',
        disasterType: 'Flood',
        severity: 'Critical',
        description: 'Multiple families trapped on rooftops, water level rising',
        reportedBy: 'John Doe',
        contactNumber: '+1234567890',
        status: 'Pending',
        disasterEventId: events[0].id
      }
    }),
    prisma.emergencyReport.create({
      data: {
        location: 'Metro City, Block B',
        disasterType: 'Flood',
        severity: 'High',
        description: 'Road blocked, need evacuation support',
        reportedBy: 'Jane Smith',
        contactNumber: '+1234567891',
        status: 'Pending',
        disasterEventId: events[0].id
      }
    }),
    prisma.emergencyReport.create({
      data: {
        location: 'Northern Province, District 1',
        disasterType: 'Earthquake',
        severity: 'Critical',
        description: 'Building collapse, people trapped under debris',
        reportedBy: 'Emergency Services',
        contactNumber: '+1234567892',
        status: 'Assigned',
        disasterEventId: events[1].id
      }
    })
  ]);

  console.log(`✅ Created ${reports.length} emergency reports`);

  // Create rescue teams
  console.log('Creating rescue teams...');
  
  const teams = await Promise.all([
    prisma.rescueTeam.create({
      data: {
        name: 'Alpha Medical Team',
        type: 'Medical',
        location: 'Metro City Base',
        status: 'Available',
        memberCount: 12
      }
    }),
    prisma.rescueTeam.create({
      data: {
        name: 'Bravo Fire Brigade',
        type: 'Fire',
        location: 'Metro City Station 1',
        status: 'Available',
        memberCount: 15
      }
    }),
    prisma.rescueTeam.create({
      data: {
        name: 'Charlie Rescue Squad',
        type: 'Rescue',
        location: 'Northern Province HQ',
        status: 'Assigned',
        memberCount: 20
      }
    }),
    prisma.rescueTeam.create({
      data: {
        name: 'Delta Relief Team',
        type: 'Relief',
        location: 'Coastal Region Center',
        status: 'Available',
        memberCount: 10
      }
    })
  ]);

  console.log(`✅ Created ${teams.length} rescue teams`);

  // Create warehouses
  console.log('Creating warehouses...');
  
  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        name: 'Central Warehouse',
        location: 'Metro City',
        capacity: 10000
      }
    }),
    prisma.warehouse.create({
      data: {
        name: 'Northern Storage Facility',
        location: 'Northern Province',
        capacity: 8000
      }
    }),
    prisma.warehouse.create({
      data: {
        name: 'Coastal Supply Depot',
        location: 'Coastal Region',
        capacity: 6000
      }
    })
  ]);

  console.log(`✅ Created ${warehouses.length} warehouses`);

  // Create resources
  console.log('Creating resources...');
  
  const resources = await Promise.all([
    prisma.resource.create({
      data: {
        name: 'Bottled Water',
        resourceType: 'Water',
        quantity: 5000,
        threshold: 1000,
        unit: 'bottles',
        warehouseId: warehouses[0].id
      }
    }),
    prisma.resource.create({
      data: {
        name: 'Emergency Food Packs',
        resourceType: 'Food',
        quantity: 3000,
        threshold: 500,
        unit: 'packs',
        warehouseId: warehouses[0].id
      }
    }),
    prisma.resource.create({
      data: {
        name: 'First Aid Kits',
        resourceType: 'Medicine',
        quantity: 800,
        threshold: 200,
        unit: 'kits',
        warehouseId: warehouses[1].id
      }
    }),
    prisma.resource.create({
      data: {
        name: 'Emergency Tents',
        resourceType: 'Shelter',
        quantity: 150,
        threshold: 300,
        unit: 'tents',
        warehouseId: warehouses[2].id
      }
    }),
    prisma.resource.create({
      data: {
        name: 'Rescue Equipment',
        resourceType: 'Equipment',
        quantity: 50,
        threshold: 100,
        unit: 'sets',
        warehouseId: warehouses[1].id
      }
    })
  ]);

  console.log(`✅ Created ${resources.length} resources`);

  // Create hospitals
  console.log('Creating hospitals...');
  
  const hospitals = await Promise.all([
    prisma.hospital.create({
      data: {
        name: 'Metro General Hospital',
        location: 'Metro City',
        totalBeds: 200,
        availableBeds: 150,
        contactNumber: '+1234560001'
      }
    }),
    prisma.hospital.create({
      data: {
        name: 'Northern Medical Center',
        location: 'Northern Province',
        totalBeds: 150,
        availableBeds: 100,
        contactNumber: '+1234560002'
      }
    }),
    prisma.hospital.create({
      data: {
        name: 'Coastal Emergency Hospital',
        location: 'Coastal Region',
        totalBeds: 100,
        availableBeds: 80,
        contactNumber: '+1234560003'
      }
    })
  ]);

  console.log(`✅ Created ${hospitals.length} hospitals`);

  // Create donations
  console.log('Creating donations...');
  
  const donations = await Promise.all([
    prisma.donation.create({
      data: {
        donorName: 'Tech Corp Foundation',
        organization: 'Tech Corp',
        amount: 100000.00,
        disasterEventId: events[0].id
      }
    }),
    prisma.donation.create({
      data: {
        donorName: 'Citizens Relief Fund',
        amount: 50000.00,
        disasterEventId: events[0].id
      }
    }),
    prisma.donation.create({
      data: {
        donorName: 'International Aid Organization',
        organization: 'IAO',
        amount: 200000.00,
        disasterEventId: events[1].id
      }
    })
  ]);

  console.log(`✅ Created ${donations.length} donations`);

  // Create expenses
  console.log('Creating expenses...');
  
  const expenses = await Promise.all([
    prisma.expense.create({
      data: {
        category: 'Medical',
        amount: 25000.00,
        description: 'Emergency medical supplies and equipment',
        disasterEventId: events[0].id
      }
    }),
    prisma.expense.create({
      data: {
        category: 'Transport',
        amount: 15000.00,
        description: 'Helicopter rescue operations',
        disasterEventId: events[1].id
      }
    }),
    prisma.expense.create({
      data: {
        category: 'Equipment',
        amount: 30000.00,
        description: 'Rescue equipment and tools',
        disasterEventId: events[1].id
      }
    })
  ]);

  console.log(`✅ Created ${expenses.length} expenses`);

  console.log('\n✨ Database seeding completed successfully!\n');
  console.log('📝 Login credentials:');
  console.log('');
  console.log('   🛡️  ADMIN/OPS Portal:');
  console.log('      Admin:             admin@disaster.gov / admin123');
  console.log('      Operator:          operator@disaster.gov / operator123');
  console.log('      Warehouse Manager: warehouse@disaster.gov / warehouse123');
  console.log('      Finance Officer:   finance@disaster.gov / finance123');
  console.log('');
  console.log('   🏥 Hospital Portal:');
  console.log('      Hospital Staff:    hospital@disaster.gov / hospital123');
  console.log('');
  console.log('   🚒 Rescue Portal:');
  console.log('      Rescue Officer:    rescue@disaster.gov / rescue123');
  console.log('');
  console.log('   🚨 Citizen Portal:');
  console.log('      Citizen User:      citizen@disaster.gov / citizen123');
  console.log('      (or register a new account)');
  console.log('');
  console.log('   Field Officer: field@disaster.gov / field123');
  console.log('   Warehouse Manager: warehouse@disaster.gov / warehouse123');
  console.log('   Finance Officer: finance@disaster.gov / finance123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
