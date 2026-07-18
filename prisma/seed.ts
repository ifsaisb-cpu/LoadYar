import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Design doc §4 — Vehicle Condition Checklist, confirmed final 28-item list.
const CHECKLIST_ITEMS: { itemNumber: number; labelEn: string; labelUr: string }[] = [
  { itemNumber: 1, labelEn: 'Air condition', labelUr: 'ائیر کنڈیشن' },
  { itemNumber: 2, labelEn: 'Heater', labelUr: 'ہیٹر' },
  { itemNumber: 3, labelEn: 'Radio / tape', labelUr: 'ریڈیو / ٹیپ' },
  { itemNumber: 4, labelEn: 'Speed recorder', labelUr: 'اسپیڈ ریکارڈر' },
  { itemNumber: 5, labelEn: 'CD player', labelUr: 'سی ڈی پلیئر' },
  { itemNumber: 6, labelEn: 'CD changer', labelUr: 'سی ڈی چینجر' },
  { itemNumber: 7, labelEn: 'DVD screen', labelUr: 'ڈی وی ڈی اسکرین' },
  { itemNumber: 8, labelEn: 'Spare wheel', labelUr: 'اسپیئر وہیل' },
  { itemNumber: 9, labelEn: 'Jack with rod', labelUr: 'جیک بمع راڈ' },
  { itemNumber: 10, labelEn: 'Remote', labelUr: 'ریموٹ' },
  { itemNumber: 11, labelEn: 'Clock', labelUr: 'گھڑی' },
  { itemNumber: 12, labelEn: 'Top cover', labelUr: 'ٹاپ کور' },
  { itemNumber: 13, labelEn: 'Fog light', labelUr: 'فوگ لائٹ' },
  { itemNumber: 14, labelEn: 'CNG kit', labelUr: 'سی این جی کٹ' },
  { itemNumber: 15, labelEn: 'CNG cylinder', labelUr: 'سی این جی سلنڈر' },
  { itemNumber: 16, labelEn: 'Foot mat', labelUr: 'فٹ میٹ' },
  { itemNumber: 17, labelEn: 'Alloy rim', labelUr: 'الائے رم' },
  { itemNumber: 18, labelEn: 'Side glass/mirror', labelUr: 'سائیڈ گلاس' },
  { itemNumber: 19, labelEn: 'Wiper', labelUr: 'وائپر' },
  { itemNumber: 20, labelEn: 'Keys', labelUr: 'چابیاں' },
  { itemNumber: 21, labelEn: 'Dickey mat', labelUr: 'ڈگی میٹ' },
  { itemNumber: 22, labelEn: 'Tool kit', labelUr: 'پین ٹول کٹ' },
  { itemNumber: 23, labelEn: 'Book/manual', labelUr: 'کتاب' },
  { itemNumber: 24, labelEn: 'Cigarette lighter', labelUr: 'سگریٹ لائٹر' },
  { itemNumber: 25, labelEn: 'Inner glass/mirror', labelUr: 'اندر کا شیشہ' },
  { itemNumber: 26, labelEn: 'Sun visor', labelUr: 'سن وائزر' },
  { itemNumber: 27, labelEn: 'Seat cover', labelUr: 'سیٹ کور' },
  { itemNumber: 28, labelEn: 'Nose/bonnet cover', labelUr: 'ناپ کور' },
];

async function seedChecklistItems() {
  for (const item of CHECKLIST_ITEMS) {
    await prisma.checklistItemDefinition.upsert({
      where: { itemNumber: item.itemNumber },
      update: { labelEn: item.labelEn, labelUr: item.labelUr },
      create: item,
    });
  }
  console.log(`Seeded ${CHECKLIST_ITEMS.length} checklist item definitions.`);
}

// Minimal test data (CLAUDE.md working style). One test carrier + driver so
// the driver/carrier portal logins have profiles for row-level scoping.
// Test-only credentials — replace before any real deployment.
const TEST_PASSWORD = 'Test1234!';

async function seedTestUsers() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const carrier = await prisma.carrier.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      companyName: 'Test Carrier Co',
      contactName: 'Test Carrier Contact',
      contactPhone: '0300-0000000',
      payType: 'flat_rate',
    },
  });

  const driver = await prisma.driver.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      carrierId: carrier.id,
      name: 'Test Driver',
      licenseNumber: 'TEST-LIC-001',
      phone: '0300-0000001',
    },
  });

  const users: {
    email: string;
    role: 'admin' | 'dispatcher' | 'driver' | 'carrier';
    driverId?: string;
    carrierId?: string;
  }[] = [
    { email: 'admin@test.local', role: 'admin' },
    { email: 'dispatcher@test.local', role: 'dispatcher' },
    { email: 'driver@test.local', role: 'driver', driverId: driver.id },
    { email: 'carrier@test.local', role: 'carrier', carrierId: carrier.id },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, driverId: u.driverId, carrierId: u.carrierId },
      create: {
        email: u.email,
        passwordHash,
        role: u.role,
        driverId: u.driverId,
        carrierId: u.carrierId,
      },
    });
  }
  console.log(`Seeded ${users.length} test users (password: ${TEST_PASSWORD}).`);
}

async function main() {
  await seedChecklistItems();
  await seedTestUsers();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
