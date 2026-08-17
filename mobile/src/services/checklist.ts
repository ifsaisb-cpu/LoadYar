export interface ChecklistItem {
  id: number;
  name_en: string;
  name_ur: string;
  category: 'exterior' | 'interior' | 'mechanical' | 'safety' | 'documentation';
  required: boolean;
  status?: 'pass' | 'fail' | 'n/a' | null;
  notes?: string;
}

// 28-item vehicle checklist from design doc §4
const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Exterior (5 items)
  {
    id: 1,
    name_en: 'Body damage/dents',
    name_ur: 'باڈی میں نقصان یا گڑھے',
    category: 'exterior',
    required: true,
  },
  {
    id: 2,
    name_en: 'Windows intact',
    name_ur: 'کھڑکیاں برقرار',
    category: 'exterior',
    required: true,
  },
  {
    id: 3,
    name_en: 'Mirrors in good condition',
    name_ur: 'شینے اچھی حالت میں',
    category: 'exterior',
    required: true,
  },
  {
    id: 4,
    name_en: 'Lights operational',
    name_ur: 'روشنیاں کام کر رہی ہوں',
    category: 'exterior',
    required: true,
  },
  {
    id: 5,
    name_en: 'Tires condition/pressure',
    name_ur: 'ٹائروں کی حالت/دباؤ',
    category: 'exterior',
    required: true,
  },

  // Interior (5 items)
  {
    id: 6,
    name_en: 'Seats in good condition',
    name_ur: 'نشستیں اچھی حالت میں',
    category: 'interior',
    required: true,
  },
  {
    id: 7,
    name_en: 'Cargo area clean',
    name_ur: 'سامان کی جگہ صاف',
    category: 'interior',
    required: true,
  },
  {
    id: 8,
    name_en: 'Floor clean',
    name_ur: 'فرش صاف',
    category: 'interior',
    required: true,
  },
  {
    id: 9,
    name_en: 'AC/Heating functional',
    name_ur: 'AC/ہیٹنگ کام کر رہی ہو',
    category: 'interior',
    required: false,
  },
  {
    id: 10,
    name_en: 'Dashboard lights functional',
    name_ur: 'ڈیش بورڈ روشنیاں کام کر رہی ہوں',
    category: 'interior',
    required: true,
  },

  // Mechanical (8 items)
  {
    id: 11,
    name_en: 'Engine starts smoothly',
    name_ur: 'انجن آسانی سے شروع ہو',
    category: 'mechanical',
    required: true,
  },
  {
    id: 12,
    name_en: 'Brakes responsive',
    name_ur: 'بریکس سے براہ راست',
    category: 'mechanical',
    required: true,
  },
  {
    id: 13,
    name_en: 'Steering responsive',
    name_ur: 'سٹیئرنگ سے براہ راست',
    category: 'mechanical',
    required: true,
  },
  {
    id: 14,
    name_en: 'Fuel level adequate',
    name_ur: 'ایندھن کی سطح مناسب',
    category: 'mechanical',
    required: true,
  },
  {
    id: 15,
    name_en: 'No fluid leaks',
    name_ur: 'سیال میں کوئی رساؤ نہیں',
    category: 'mechanical',
    required: true,
  },
  {
    id: 16,
    name_en: 'Battery condition good',
    name_ur: 'بیٹری کی حالت اچھی',
    category: 'mechanical',
    required: true,
  },
  {
    id: 17,
    name_en: 'Wipers functional',
    name_ur: 'پونچھنے والے کام کر رہے ہوں',
    category: 'mechanical',
    required: false,
  },
  {
    id: 18,
    name_en: 'Horn functional',
    name_ur: 'ہارن کام کر رہا ہو',
    category: 'mechanical',
    required: true,
  },

  // Safety (6 items)
  {
    id: 19,
    name_en: 'Seat belts present',
    name_ur: 'سیٹ بیلٹ موجود ہوں',
    category: 'safety',
    required: true,
  },
  {
    id: 20,
    name_en: 'First aid kit present',
    name_ur: 'فرسٹ ایڈ کٹ موجود ہو',
    category: 'safety',
    required: true,
  },
  {
    id: 21,
    name_en: 'Fire extinguisher present',
    name_ur: 'آگ بجھانے والا موجود ہو',
    category: 'safety',
    required: true,
  },
  {
    id: 22,
    name_en: 'Hazard lights functional',
    name_ur: 'خطرے کی روشنیاں کام کر رہی ہوں',
    category: 'safety',
    required: true,
  },
  {
    id: 23,
    name_en: 'Emergency contact card present',
    name_ur: 'ایمرجنسی رابطہ کارڈ موجود ہو',
    category: 'safety',
    required: true,
  },
  {
    id: 24,
    name_en: 'Cargo properly secured',
    name_ur: 'سامان صحیح طریقے سے محفوظ ہو',
    category: 'safety',
    required: true,
  },

  // Documentation (4 items)
  {
    id: 25,
    name_en: 'Vehicle registration valid',
    name_ur: 'گاڑی کی رجسٹریشن درست',
    category: 'documentation',
    required: true,
  },
  {
    id: 26,
    name_en: 'Insurance valid',
    name_ur: 'بیمہ درست',
    category: 'documentation',
    required: true,
  },
  {
    id: 27,
    name_en: 'Driving license valid',
    name_ur: 'ڈرائیونگ لائسنس درست',
    category: 'documentation',
    required: true,
  },
  {
    id: 28,
    name_en: 'PEC/Tax sticker valid',
    name_ur: 'PEC/ٹیکس سٹیکر درست',
    category: 'documentation',
    required: true,
  },
];

export class ChecklistService {
  getChecklistItems(): ChecklistItem[] {
    return CHECKLIST_ITEMS;
  }

  getItemsByCategory(
    category: ChecklistItem['category']
  ): ChecklistItem[] {
    return CHECKLIST_ITEMS.filter((item) => item.category === category);
  }

  getRequiredItems(): ChecklistItem[] {
    return CHECKLIST_ITEMS.filter((item) => item.required);
  }

  calculateProgress(
    checkedItems: { [key: number]: ChecklistItem }
  ): {
    completed: number;
    total: number;
    percentage: number;
  } {
    const total = CHECKLIST_ITEMS.length;
    const completed = Object.keys(checkedItems).length;
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
    };
  }

  validateChecklist(
    checkedItems: { [key: number]: ChecklistItem }
  ): {
    isValid: boolean;
    failedItems: ChecklistItem[];
    missingRequired: ChecklistItem[];
  } {
    const failedItems = Object.values(checkedItems).filter(
      (item) => item.status === 'fail'
    );

    const requiredItems = this.getRequiredItems();
    const checkedIds = Object.keys(checkedItems).map(Number);
    const missingRequired = requiredItems.filter(
      (item) => !checkedIds.includes(item.id)
    );

    return {
      isValid: failedItems.length === 0 && missingRequired.length === 0,
      failedItems,
      missingRequired,
    };
  }
}

export const checklistService = new ChecklistService();
