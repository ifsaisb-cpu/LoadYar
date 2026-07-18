import { PrismaPg } from '@prisma/adapter-pg';
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

async function main() {
  for (const item of CHECKLIST_ITEMS) {
    await prisma.checklistItemDefinition.upsert({
      where: { itemNumber: item.itemNumber },
      update: { labelEn: item.labelEn, labelUr: item.labelUr },
      create: item,
    });
  }
  console.log(`Seeded ${CHECKLIST_ITEMS.length} checklist item definitions.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
