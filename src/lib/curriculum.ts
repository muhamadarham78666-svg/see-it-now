/**
 * Curriculum registry: Class -> Books -> Chapters.
 *
 * Classes are simply 9th / 10th / 11th / 12th — every group's books
 * (Science, Pre-Medical, Pre-Engineering, ICS, ICom, FA/FSc, optional subjects)
 * are merged into one book list per class.
 *
 * Chapter lists are taken verbatim from the official Punjab Board / PCTB
 * NEW SYLLABUS 2026 textbooks provided by the institute. Nothing outside these
 * chapters should ever be used for papers, notes or solutions.
 */

export type SubjectCode =
  | 'english'
  | 'urdu'
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'cs'
  | 'islamiat'
  | 'pakstudies'
  | 'sst'
  | 'tarjuma'
  | 'elective';

export type SubjectFamily = 'science' | 'math' | 'language' | 'humanities' | 'religious';

export interface Book {
  /** Unique id inside its class, e.g. "11:physics". */
  id: string;
  subject: SubjectCode;
  name: string;
  family: SubjectFamily;
  /** Paper is normally written in Urdu script. */
  urdu?: boolean;
  chapters: string[];
  /** Optional / elective subject (shown after the compulsory ones). */
  elective?: boolean;
}

export interface ClassGroup {
  key: string;
  label: string;
  classLevel: '9th' | '10th' | '11th' | '12th';
  group: string;
  books: Book[];
}

interface BookSpec {
  subject: SubjectCode;
  name?: string;
  family?: SubjectFamily;
  urdu?: boolean;
  elective?: boolean;
  chapters: string[];
}

const FAMILY: Record<SubjectCode, SubjectFamily> = {
  english: 'language',
  urdu: 'language',
  math: 'math',
  physics: 'science',
  chemistry: 'science',
  biology: 'science',
  cs: 'science',
  islamiat: 'religious',
  tarjuma: 'religious',
  pakstudies: 'humanities',
  sst: 'humanities',
  elective: 'humanities',
};

const NAMES: Record<SubjectCode, string> = {
  english: 'English',
  urdu: 'Urdu',
  math: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  cs: 'Computer Science',
  islamiat: 'Islamiat',
  tarjuma: 'Tarjuma-tul-Quran',
  pakstudies: 'Pakistan Studies',
  sst: 'Social Studies (SST)',
  elective: 'Elective Subject',
};

/* ------------------------------------------------------------------ *
 * Shared chapter lists (identical across the classes that use them)
 * ------------------------------------------------------------------ */

const ENGLISH_GRAMMAR_9_10 = [
  'Vocabulary',
  'Forms of Verb',
  'Tenses',
  'Parts of Speech',
  'Story Writing',
  'Letters, Applications and Invitations',
  'Dialogue Writing',
  'Comprehension of a Passage',
  'Paragraph Writing',
  'Writing an Essay',
];

const ENGLISH_GRAMMAR_11_12 = [
  'Parts of Speech',
  'Punctuation',
  'Tenses',
  'Correction of Common Errors',
  'Sentences',
  'Direct and Indirect Speech',
  'Pair of Words',
  'Idioms',
  'Stories with Moral Lessons',
  'Letters and Applications',
  'Translation',
  'Paragraph',
  'Essays',
];

const URDU_GRAMMAR_9_10 = [
  'لفظ، جملہ، کلمہ اور مہمل',
  'مرکب اور ہم رتبہ جملے',
  'کلمے کی قسمیں',
  'منقوط، غیر منقوط اور بھاری حروف',
  'حروف شمسی و قمری',
  'اسم کی قسمیں',
  'اسم معرفہ اور اس کی اقسام',
  'اسم نکرہ اور اس کی اقسام',
  'جنس اور عدد',
  'فعل اور فعل کی اقسام',
  'افعالِ معاون',
  'حروف اور حروف کی اقسام',
  'مترادف اور متضاد الفاظ',
  'ذو معنی اور باہم مماثل الفاظ',
  'رموزِ اوقاف',
  'سابقے اور لاحقے',
  'مرکبات اور مرکبات کی اقسام',
  '"نے" اور "کو" کا استعمال',
  'تلفظ',
  'روزمرہ، محاورہ اور ضرب الامثال',
  'علمِ بیان',
  'خطوط نویسی',
  'عرائض نویسی (درخواست)',
  'رسید لکھنا',
  'مکالمہ نگاری',
  'کہانی لکھنا',
  'مضمون نگاری',
  'تفہیمِ عبارت',
];

const URDU_GRAMMAR_11_12 = [
  'علمِ قواعد، تعارف',
  'اردو حروفِ تہجی',
  'شمسی و قمری حروف',
  'رسم الخط',
  'صرف و نحو',
  'تذکیر و تانیث',
  'واحد جمع',
  'سابقے اور لاحقے',
  'رموزِ اوقاف',
  'حروف',
  'مرکبِ تام',
  'مرکبِ ناقص',
  'امدادی افعال',
  'مطابقت اور مطابقت کے اصول',
  'غلط جملوں کی درستی',
  'روزمرہ اور محاورہ',
  'ضرب الامثال',
  'علمِ بیان',
  'علمِ بدیع',
  'علمِ عروض',
  'چند شعری اصطلاحات',
  'اصنافِ نظم و نثر',
  'تلخیص نگاری',
  'مکتوب نگاری',
  'درخواست نویسی',
  'رسیدات',
  'مکالمہ نگاری',
  'آپ بیتی',
  'روداد نویسی',
  'روزنامچہ',
  'مضمون نویسی',
  'مضامین کی اقسام',
  'اہم مضامین',
];

const ISLAMIAT_CHAPTERS = [
  'قرآن مجید و حدیثِ نبوی ﷺ',
  'ایمانیات و عبادات',
  'سیرتِ نبوی ﷺ',
  'اخلاق و آداب',
  'حسنِ معاملات و معاشرت',
  'ہدایت کے سرچشمے اور مشاہیرِ اسلام',
  'اسلامی تعلیمات اور عصرِ حاضر کے تقاضے',
];

const ETHICS_9 = ['مذاہب کا تعارف', 'جین مت', 'اخلاق و اقدار', 'آداب', 'مشاہیر'];
const ETHICS_10 = ['مذاہب کا تعارف', 'مہاویر', 'اخلاق و اقدار', 'عوامی مقامات کے آداب', 'مشاہیر'];
const ETHICS_11_12 = [
  'مذاہب کا تعارف',
  'پاکستان میں مختلف مذاہب',
  'اخلاقی اقدار',
  'آداب',
  'مشاہیر',
];

const ECONOMICS_9_10 = [
  'Introduction to Economics',
  'Subject Matter of Economics',
  'Demand',
  'Supply',
  'Equilibrium and Price Determination',
  'Market and Production',
  'Economic Problems of Pakistan and Their Remedial Measures',
  'Basic Concept of National Income',
  'Money',
  'Bank',
  'Trade',
  'Public Finance',
  'Economic Development',
  'Economic System of Islam',
];

const AGRICULTURE_9_10 = [
  'زمین کی مختلف اقسام میں فرق',
  'زمین کی کاشت کا مطالعہ',
  'قدرتی اور مصنوعی کھادوں کا مطالعہ',
  'پانی کا مطالعہ',
  'آب و ہوا کا مطالعہ',
  'عام فصلوں کا مطالعہ',
  'عام سبزیوں کا مطالعہ',
  'جڑی بوٹیوں کا مطالعہ',
  'نقصان دہ کیڑوں کا مطالعہ',
  'کھیتی باڑی کے آلات کا مطالعہ اور استعمال',
  'بیجوں کا مطالعہ',
];

const EDUCATION_9_10 = [
  'تعلیم کے تصورات',
  'تعلیم کا دائرہ کار اور وظائف',
  'انسانی نشوونما اور بلیدگی',
  'تعلّم',
  'گھر، اسکول اور معاشرہ',
  'پاکستان میں تعلیم',
  'نصاب',
  'مدرسہ کی سرگرمیوں کی تنظیم',
  'رہنمائی اور مشاورت',
];

const PHYSICAL_EDUCATION_9_10 = [
  'تعلیمِ جسمانی کی تعریف',
  'حرکات',
  'تعلیمی جمناسٹک',
  'قامت',
  'منظم کھیلیں',
  'ایتھلیٹکس کے قوانین اور بنیادی مہارتیں',
  'علم الصحت اور اس کی وسعت',
  'شخصی حفظانِ صحت',
  'جسم کے حرکتی کل پرزے',
  'جسمانی تعلیم',
  'تفریحی اور چھوٹے رقبے کے کھیل',
  'قامتی نقائص کی اصلاحی ورزشیں',
  'کھیلیں',
  'ایتھلیٹکس',
  'تفریحی مشاغل',
  'معاشرے کی صحت',
  'غذائیات',
];

const ACCOUNTING_11 = [
  'Accounting Equation',
  'Debit and Credit',
  'Journals',
  'Trial Balance',
  'Bank and Banking',
  'Journals for Cash',
  'Journals for Non-Cash',
  'Bank Statement',
  'Bills of Exchange',
  'Financial Accounting Basics-I',
  'Financial Accounting Adjustments',
  'Capital and Revenue',
  'Errors',
  'Work Sheet',
  'Financial Statements',
];

/* ------------------------------------------------------------------ *
 * Class 9 (New Syllabus 2026)
 * ------------------------------------------------------------------ */

const CLASS_9_BOOKS: BookSpec[] = [
  {
    subject: 'english',
    chapters: [
      'The Saviour of Mankind',
      'Patriotism',
      'Daffodils',
      'Hazrat Asma (R.A)',
      'Women Empowerment through Entrepreneurship',
      'The Value of Time',
      'If',
      'The Impact of Globalisation on Culture and Economy',
      'Quality Education: A Key to Success',
      'Wildlife Vignettes: Fascinating Nature',
      'The Dear Departed',
    ],
  },
  {
    subject: 'urdu',
    chapters: [
      'حمد',
      'نعت',
      'اخلاقِ حسنہ',
      'اپنی مدد آپ',
      'کلیم اور مرزا ظاہر دار بیگ',
      'نام دیو مالی',
      'آرام و سکون',
      'کتبہ',
      'ابتدائی حساب',
      'لڑی میں پروئے ہوئے منظر',
      'بھیڑیا',
      'محنت کی برکات',
      'جاوید کے نام',
      'پیامِ لطیف',
      'کرکٹ اور مشاعرہ',
      'فقیراں آئے صدا کر چلے',
      'سن تو سہی جہاں میں ہے تیرا فسانہ کیا',
      'غم ہے یا خوشی تو',
      'کاش طوفان میں سفینے کو اتارا ہوتا (غزل)',
    ],
  },
  {
    subject: 'math',
    chapters: [
      'Real Numbers',
      'Logarithms',
      'Sets and Functions',
      'Factorization and Algebraic Manipulation',
      'Linear Equations and Inequalities',
      'Trigonometry',
      'Coordinate Geometry',
      'Logic',
      'Similar Figures',
      'Graphs of Functions',
      'Loci and Construction',
      'Information Handling',
      'Probability',
    ],
  },
  {
    subject: 'physics',
    chapters: [
      'Physical Quantities and Measurements',
      'Kinematics',
      'Dynamics',
      'Turning Effects of Force',
      'Work, Energy and Power',
      'Mechanical Properties of Matter',
      'Thermal Properties of Matter',
      'Magnetism',
      'Nature of Science',
    ],
  },
  {
    subject: 'chemistry',
    chapters: [
      'State of Matter and Phase Changes',
      'Atomic Structure',
      'Chemical Bonding',
      'Stoichiometry',
      'Energetics',
      'Equilibria',
      'Acid Base Chemistry',
      'Periodic Table and Periodicity',
      'Group Properties and Elements',
      'Environmental Chemistry',
      'Hydrocarbons',
      'Empirical Data Collection and Analysis',
      'Laboratory and Practical Skills',
    ],
  },
  {
    subject: 'biology',
    chapters: [
      'The Science of Biology',
      'Biodiversity',
      'The Cell',
      'Cell Cycle',
      'Tissues, Organs and Organ System',
      'Biomolecules',
      'Enzymes',
      'Bioenergetics',
      'Plant Physiology',
      'Reproduction in Plants',
      'Biostatistics',
    ],
  },
  {
    subject: 'cs',
    chapters: [
      'Introduction to System',
      'Number Systems',
      'Digital Systems and Logic Design',
      'System Troubleshooting',
      'Software System',
      'Introduction to Computer Networks',
      'Computational Thinking',
      'Web Development with HTML, CSS and JavaScript',
      'Data Science and Data Gathering',
      'Emerging Technologies in Computer Science',
      'Ethical, Social and Legal Concerns in Computer Usage',
      'Entrepreneurship in Digital Age',
    ],
  },
  {
    subject: 'pakstudies',
    chapters: [
      'Ideological Basis of Pakistan',
      'Pakistan Movement and Emergence of Pakistan',
      'Land and Environment',
      "Women's Empowerment",
    ],
  },
  { subject: 'islamiat', chapters: ISLAMIAT_CHAPTERS },
  {
    subject: 'tarjuma',
    chapters: [
      'تلاوتِ قرآن کے آداب',
      'عمومی ہدایات برائے اساتذہ',
      'حاصلاتِ تعلم',
      'سورۃ مریم',
      'سورۃ طٰہٰ',
      'سورۃ الانبیاء',
      'سورۃ الحج',
      'سورۃ الفرقان',
      'سورۃ الشعراء',
      'سورۃ النمل',
      'سورۃ القصص',
      'سورۃ العنکبوت',
      'سورۃ الروم',
      'سورۃ لقمان',
      'سورۃ السجدہ',
      'سورۃ سبا',
      'سورۃ فاطر',
      'سورۃ یٰسین',
      'سورۃ الصافات',
      'سورۃ ص',
      'سورۃ الاحقاف',
    ],
  },
  {
    subject: 'elective',
    name: 'General Mathematics',
    family: 'math',
    elective: true,
    chapters: [
      'Percentage, Ratio and Proportion',
      'Zakat, Ushr and Inheritance',
      'Business Mathematics',
      'Financial Mathematics',
      'Consumer Mathematics',
      'Exponents and Logarithms',
      'Arithmetic and Geometric Sequences',
      'Sets and Functions',
      'Linear Graphs',
      'Basic Statistics',
    ],
  },
  { subject: 'elective', name: 'English Grammar', family: 'language', elective: true, chapters: ENGLISH_GRAMMAR_9_10 },
  { subject: 'elective', name: 'Urdu Grammar', family: 'language', urdu: true, elective: true, chapters: URDU_GRAMMAR_9_10 },
  { subject: 'elective', name: 'Ethics', urdu: true, elective: true, chapters: ETHICS_9 },
  { subject: 'elective', name: 'Economics', elective: true, chapters: ECONOMICS_9_10 },
  { subject: 'elective', name: 'Education', urdu: true, elective: true, chapters: EDUCATION_9_10 },
  { subject: 'elective', name: 'Agriculture (زراعی تعلیم)', urdu: true, elective: true, chapters: AGRICULTURE_9_10 },
  {
    subject: 'elective',
    name: 'Home Economics',
    urdu: true,
    elective: true,
    chapters: [
      'ہوم اکنامکس کا تعارف',
      'غذا اور غذائیات کا تعارف',
      'غذا اور خوراک کو سمجھنا',
      'کھانوں کی تیاری',
      'بچوں کی نگہداشت اور نشوونما کا تعارف',
      'نشوونمائی خصوصیات',
      'بچوں کے رویوں کے مسائل',
      'انسانی نشوونما میں خاندان اور معاشرے کا کردار',
    ],
  },
  {
    subject: 'elective',
    name: 'Food and Nutrition',
    urdu: true,
    elective: true,
    chapters: [
      'غذا اور غذائیات کا تعارف',
      'توانائی اور غذائی اجزا',
      'متوازن غذا',
      'غذاؤں کے اجزائے ترکیبی',
      'اشیا کی خریداری',
    ],
  },
  {
    subject: 'elective',
    name: 'Textile Industry (پارچہ بافی)',
    urdu: true,
    elective: true,
    chapters: [
      'پارچہ بافی اور لباس',
      'پارچہ بافی کے ریشے',
      'پاکستان میں پارچہ بافی کی صنعت',
      'ریشوں کی شناخت',
      'پارچہ بافی کے طریقے',
      'ٹیکسٹائل ڈیزائن',
      'لباس کا انتخاب',
    ],
  },
  {
    subject: 'elective',
    name: 'Art and Drawing',
    elective: true,
    chapters: [
      'Introduction to Art and Drawing',
      'Drawing and Sketching',
      'Painting Practice',
      'Introduction to Graphic Design',
      'History of Architecture in Pakistan',
      'History of Painting in South Asia',
      'Master Calligraphists of Pakistan',
      'Textiles: Weaving, Printing and Embroidery',
    ],
  },
  {
    subject: 'elective',
    name: 'Physical Education',
    urdu: true,
    elective: true,
    chapters: PHYSICAL_EDUCATION_9_10,
  },
];

/* ------------------------------------------------------------------ *
 * Class 10 (New Syllabus 2026)
 * ------------------------------------------------------------------ */

const CLASS_10_BOOKS: BookSpec[] = [
  {
    subject: 'english',
    chapters: [
      'Hazrat Muhammad ﷺ: Social Reforms for the Rights of Women, Orphans and Slaves',
      'My Beloved Pakistan (Poem)',
      'Digital Globalisation Transforming the English Language',
      'The Earth: Act Now for Tomorrow',
      'The Happy Prince',
      'Drug Abuse',
      'Time (Poem)',
      'Pollution-free Pakistan with Greenery all Around',
      'The Road Not Taken (Poem)',
      'The Three Questions',
    ],
  },
  {
    subject: 'urdu',
    chapters: [
      'حمد',
      'نعت',
      'اخلاقِ نبوی ﷺ',
      'سر سید کا بچپن',
      'محسن محلہ',
      'کفارہ',
      'سویرے جو کل آنکھ میری کھلی',
      'دوستی کا پھل',
      'میرا گاؤں',
      'بابل کے کھنڈر',
      'اولڈ ایج ہوم',
      'کچھ ذریعۂ تعلیم کے باب میں',
      'آدمی نامہ',
      'نمودِ صبح',
      'خطاب بہ جوانانِ اسلام',
      'وغیرہ',
      'بازیچۂ اطفال ہے دنیا مرے آگے',
      'اثر اس کو ذرا نہیں ہوتا',
      'ہے مشقِ سخن جاری، چکی کی مشقت',
      'یوں کہنے کو پیرایۂ اظہار بہت ہے',
    ],
  },
  {
    subject: 'math',
    chapters: [
      'Complex Numbers',
      'Quadratic Equations and Inequalities',
      'Matrices and Determinants',
      'Functions and Graphs',
      'Algebraic Fractions',
      'Vectors in Plane',
      'Trigonometry',
      'Chords and Arcs of a Circle',
      'Tangent and Angles of a Circle',
      'Practical Geometry of Circles',
      'Information Handling',
      'Probability',
    ],
  },
  {
    subject: 'physics',
    chapters: [
      'Thermal Physics',
      'Transfer of Thermal Energy',
      'Waves',
      'Sound',
      'Light',
      'Electrostatics',
      'Electricity',
      'Electromagnetism',
      'Electromagnetic Induction and Electromagnetic Waves',
      'Electronics',
      'Atomic and Nuclear Physics',
      'Space and Environment',
    ],
  },
  {
    subject: 'chemistry',
    chapters: [
      'States of Matter and Phase Changes',
      'Stoichiometry',
      'Electrochemistry',
      'Reaction Kinetics',
      'Salts',
      'Nitrogen and Sulphur',
      'Water',
      'Organic Chemistry',
      'Hydrocarbons',
      'Monohydroxy Alkanes or Alcohols',
      'Carboxylic Acids',
      'Biochemistry',
      'Polymers',
    ],
  },
  {
    subject: 'biology',
    chapters: [
      'Human Digestive System',
      'Human Respiratory System',
      'Human Blood Circulatory System',
      'Human Urinary System',
      'Coordination',
      'Reproductive System',
      'Inheritance',
      'Biotechnology',
      'Diseases and Immunity',
      'Evolution',
    ],
  },
  {
    subject: 'cs',
    chapters: [
      'Operating Systems: Structure and Services',
      'System Recovery and Advanced Maintenance',
      'Introduction to Python Programming',
      'Control Structure in Python',
      'Data Science',
      'Introduction to Artificial Intelligence (AI) and Machine Learning',
      'Applications of AI',
      'Digital Entrepreneurship',
    ],
  },
  {
    subject: 'pakstudies',
    urdu: true,
    chapters: [
      'پاکستان کی نظریاتی اساس',
      'تحریکِ پاکستان',
      'پاکستان کی تاریخ اور پاکستان میں آئینی ترقی',
      'پاکستان کا جغرافیہ',
      'پاکستان اور بین الاقوامی امور',
      'پاکستان کے وسائل اور معاشی ترقی',
      'آبادی، معاشرہ اور پاکستان میں ثقافتی تنوع',
      'پاکستان میں خواتین کو بااختیار بنانا',
    ],
  },
  { subject: 'islamiat', chapters: ISLAMIAT_CHAPTERS },
  {
    subject: 'tarjuma',
    chapters: [
      'تلاوتِ قرآن',
      'عمومی ہدایات',
      'حاصلاتِ تعلم',
      'سورۃ الانعام',
      'سورۃ الاعراف',
      'سورۃ یونس',
      'سورۃ ہود',
      'سورۃ الرعد',
      'سورۃ ابراہیم',
      'سورۃ الحجر',
      'سورۃ النحل',
      'سورۃ بنی اسرائیل',
      'سورۃ الکہف',
      'سورۃ المومنون',
      'سورۃ الزمر',
      'سورۃ المومن',
      'سورۃ حٰمٓ السجدہ',
      'سورۃ الشعراء',
    ],
  },
  { subject: 'elective', name: 'English Grammar', family: 'language', elective: true, chapters: ENGLISH_GRAMMAR_9_10 },
  { subject: 'elective', name: 'Urdu Grammar', family: 'language', urdu: true, elective: true, chapters: URDU_GRAMMAR_9_10 },
  { subject: 'elective', name: 'Ethics', urdu: true, elective: true, chapters: ETHICS_10 },
  { subject: 'elective', name: 'Economics', elective: true, chapters: ECONOMICS_9_10 },
  { subject: 'elective', name: 'Education', urdu: true, elective: true, chapters: EDUCATION_9_10 },
  { subject: 'elective', name: 'Agriculture (زراعی تعلیم)', urdu: true, elective: true, chapters: AGRICULTURE_9_10 },
  {
    subject: 'elective',
    name: 'Clothing and Textile',
    urdu: true,
    elective: true,
    chapters: [
      'فیشن اور بننا سنورنا',
      'کپڑوں کی منصوبہ بندی کے اصول',
      'کپڑوں کی حفاظت اور ان کو اسٹور کرنا',
      'داغ دھبے دور کرنا',
      'ٹیکسٹائل اور لباس میں کاروبار کے مواقع اور پیشے',
      'سلائی کا تعارف',
      'لباس بنانا',
    ],
  },
  {
    subject: 'elective',
    name: 'Home Economics',
    urdu: true,
    elective: true,
    chapters: [
      'پارچہ بافی اور لباس کا تعارف',
      'لباس بنانا',
      'عمر کے مختلف گروپوں کی لباس کی ضروریات',
      'انتظام کا تعارف',
      'ماحول اور انتظام',
      'آرٹ اور ڈیزائن',
      'روزمرہ زندگی میں آرٹ',
    ],
  },
  {
    subject: 'elective',
    name: 'Food and Nutrition',
    urdu: true,
    elective: true,
    chapters: [
      'غذاؤں کی تیاری اور پکانے کے طریقے',
      'خاندان اور معاشرے کی غذائیات',
      'انتظامِ طعام',
      'میز لگانا اور کھانا پیش کرنا',
      'غذاؤں کو محفوظ کرنا',
    ],
  },
  {
    subject: 'elective',
    name: 'Art and Drawing',
    elective: true,
    chapters: [
      'Drawing and Sketching',
      'Painting Practice',
      'Graphic Design',
      'Sculpture Making',
      'History of Sculpture and Architectural Relief in Pakistan',
      'History of Pottery and Ceramics in Pakistan',
      'Craft of Pakistan',
    ],
  },
  {
    subject: 'elective',
    name: 'Health and Physical Education',
    urdu: true,
    elective: true,
    chapters: PHYSICAL_EDUCATION_9_10,
  },
];

/* ------------------------------------------------------------------ *
 * Class 11 (New Syllabus 2026) — all groups merged
 * ------------------------------------------------------------------ */

const CLASS_11_BOOKS: BookSpec[] = [
  {
    subject: 'english',
    chapters: [
      'Khatam un Nabiyeen Hazrat Muhammad ﷺ',
      'Responsibility of the Youth in Nation-Building',
      'A Bird Came Down the Walk (Poem)',
      'Team Moon',
      'Impact of Global Warming on Pakistan',
      'The Echoing Green (Poem)',
      'What You Do Is What You Are',
      'Clean Water',
      'Freedom (Poem)',
      'The Punishment of Shahpesh, the Persian, on Khipil, the Builder',
      'Those Winter Sundays (Poem)',
      'The Impact of AI on Society, Human Relationships and Ethics',
      "Ruba'iyat (Poem)",
      'The End of the Beginning',
    ],
  },
  {
    subject: 'urdu',
    chapters: [
      'حمد',
      'نعت',
      'اخلاقِ نبوی ﷺ',
      'فاقہ میں روزہ',
      'مکاتیبِ غالب',
      'ایک استاد عدالت کے کٹہرے میں',
      'چارپائی',
      'اور پاکستان بن گیا',
      'نیا قانون',
      'دہلیز',
      'تاریخ کا کفن',
      'پاکستانی زبانیں اور ان کا باہمی رشتہ',
      'اے وادیِ لولاب!',
      'او دیس سے آنے والے بتا',
      'آزادی',
      'اخلاص',
      'کھڑا اونر',
    ],
  },
  {
    subject: 'math',
    chapters: [
      'Complex Numbers',
      'Functions and Graphs',
      'Theory of Quadratic Functions',
      'Matrices and Determinants',
      'Partial Fractions',
      'Sequences and Series',
      'Permutations and Combination',
      'Mathematical Induction and Binomial Theorem',
      'Division of Polynomials',
      'Trigonometric Identities',
      'Trigonometric Functions and Their Graphs',
      'Limit and Continuity',
      'Differentiation',
      'Vectors in Space',
    ],
  },
  {
    subject: 'physics',
    chapters: [
      'Measurements',
      'Force and Motion',
      'Circular and Rotational Motion',
      'Work, Energy and Power',
      'Solids and Fluid Dynamics',
      'Heat and Thermodynamics',
      'Waves and Vibrations',
      'Physical Optics and Gravitational Waves',
      'Electrostatics and Current Electricity',
      'Electromagnetism',
      'Special Theory of Relativity',
      'Nuclear and Particle Physics',
    ],
  },
  {
    subject: 'chemistry',
    chapters: [
      'Periodic Table and Periodic Properties',
      'Atomic Structure',
      'Chemical Bonding',
      'Stoichiometry',
      'States and Phases of Matter',
      'Chemical Energetics',
      'Reaction Kinetics',
      'Chemical Equilibrium',
      'Acid-Base Chemistry',
      'Electrochemistry',
      'Hydrocarbons',
      'Nitrogen and Sulfur',
      'Halogens',
      'Atmosphere',
      'Basic Separation Techniques',
      'Lab Safety and Practical Skills',
    ],
  },
  {
    subject: 'biology',
    chapters: [
      'Biodiversity and Classification',
      'Bacteria and Viruses',
      'Cells and Subcellular Organelles',
      'Molecular Biology',
      'Enzymes',
      'Bioenergetics',
      'Structural and Computational Biology',
      'Plant Physiology',
      'Human Digestive System',
      'Human Respiratory System',
      'Human Circulatory System',
      'Human Skeletal and Muscular System',
    ],
  },
  {
    subject: 'cs',
    chapters: [
      'Introduction to Software Development',
      'Python Programming',
      'Algorithms and Problem Solving',
      'Computational Structure',
      'Data Analysis',
      'Emerging Technologies',
      'Legal and Ethical Aspects of Computing System',
      'Online Research and Digital Literacy',
      'Entrepreneurship in Digital Age',
    ],
  },
  { subject: 'islamiat', chapters: ISLAMIAT_CHAPTERS },
  {
    subject: 'tarjuma',
    chapters: [
      'سورۃ الفاتحہ',
      'سورۃ البقرۃ (منتخب آیات)',
      'سورۃ البقرۃ: مشق',
      'سورۃ آلِ عمران (منتخب آیات)',
      'سورۃ آلِ عمران: مشق',
      'قرآنی الفاظ و تراکیب',
      'مفہوم و تشریح',
      'قرآنی تعلیمات کی عملی تطبیق',
    ],
  },
  { subject: 'elective', name: 'English Grammar', family: 'language', elective: true, chapters: ENGLISH_GRAMMAR_11_12 },
  { subject: 'elective', name: 'Urdu Grammar', family: 'language', urdu: true, elective: true, chapters: URDU_GRAMMAR_11_12 },
  {
    subject: 'elective',
    name: 'Statistics',
    family: 'math',
    elective: true,
    chapters: [
      'Introduction to Statistics',
      'Representation of Data',
      'Measures of Location',
      'Measures of Dispersion',
      'Index Numbers',
      'Probability',
      'Random Variables',
      'Probability Distributions',
      'Binomial and Hypergeometric Probability Distribution',
    ],
  },
  { subject: 'elective', name: 'Principles of Accounting', elective: true, chapters: ACCOUNTING_11 },
  {
    subject: 'elective',
    name: 'Business Mathematics',
    family: 'math',
    elective: true,
    chapters: [
      'Matrix Algebra and Determinants',
      'Functions, Limits and Continuity',
      'Differential Calculus and Business Applications',
      'Integral Calculus and Business Applications',
      'Mathematics of Finance',
      'Linear Programming',
    ],
  },
  {
    subject: 'elective',
    name: 'Education',
    elective: true,
    chapters: [
      'Education',
      'Aims of Education',
      'Foundations of Education',
      'Human Development',
      'Learning',
      'Society, Community and Education',
      'Guidance and Counselling',
      'Curricula, Syllabus and Textbooks',
    ],
  },
  {
    subject: 'elective',
    name: 'Physical Geography',
    elective: true,
    chapters: [
      'Definition of Geography: Branches, Scope and Importance',
      'Physical Geography and its Components',
      'Rocks',
      'Major Landforms',
      'Weathering and its Types',
      'Agents of Weathering and Denudation',
      'Oceans and Their Movements',
      'The Atmosphere',
      'Effects of Physical Environment on Man',
    ],
  },
  {
    subject: 'elective',
    name: 'Philosophy',
    elective: true,
    chapters: [
      'Definition of Philosophy',
      'Philosophy and Religion',
      'Philosophy and Science',
      'Knowledge',
      'Metaphysics',
      'Ethics',
      'Islamic Values',
      'Hikma: Meaning and Scope',
    ],
  },
  {
    subject: 'elective',
    name: 'Psychology',
    elective: true,
    chapters: [
      'Introduction of Psychology',
      'Methods of Research',
      'Nervous System and Behavior',
      'Sensation and Perception',
      'Learning and Memory',
      'Motivational Behavior',
      'Personality',
      'Emotional Behavior',
      'Higher Cognitive Process',
    ],
  },
  {
    subject: 'elective',
    name: 'Health and Physical Education',
    elective: true,
    chapters: [
      'Definitions and Importance of Physical Education',
      'Aims and Objectives of Physical Education',
      'Scope of Physical Activities',
      'The Organized Games',
      'Competition Rules',
      'Health Education',
      'Human Body and its Efficiency',
      'Posture and Postural Defects',
      'First Aid',
      'Infectious Diseases',
    ],
  },
  {
    subject: 'elective',
    name: 'Civics (علمِ شہریت)',
    urdu: true,
    elective: true,
    chapters: [
      'علمِ شہریت کا تعارف',
      'علمِ شہریت کے بنیادی تصورات',
      'ریاست',
      'اقتدارِ اعلیٰ',
      'حکومت',
      'قانون',
      'شہری اور شہریت',
      'آئین',
      'سیاسی حرکیات',
    ],
  },
  {
    subject: 'elective',
    name: 'Economics (معاشیات)',
    urdu: true,
    elective: true,
    chapters: [
      'معاشیات کی نوعیت اور وسعت',
      'رویۂ صارف کا تجزیہ',
      'معاشیات میں شماریات اور ریاضی کے بنیادی آلات',
      'طلب',
      'رسد',
      'منڈی کا توازن',
      'نظریۂ پیدائشِ دولت',
      'یگانہ پیدائش اور قوانینِ حاصل',
      'مصارفِ پیدائش',
      'وصولیوں کا تجزیہ',
      'منڈی',
      'تقسیم — عاملینِ پیدائش کے معاوضوں کا تعین',
    ],
  },
  {
    subject: 'elective',
    name: 'Home Economics',
    urdu: true,
    elective: true,
    chapters: [
      'بچوں کی نشوونما',
      'ذات کا تصور اور شخصیت کی نشوونما',
      'خاندان اور افرادِ خانہ کے باہمی تعلقات',
      'بچوں کو سمجھنا اور ان کی رہنمائی کرنا',
      'انتظامِ خانہ داری کا تعارف و مقاصد',
      'وسائل و ذرائع',
      'تھکن اور اس کے اثرات',
      'تخمینۂ آمدنی و خرچ',
      'صحت کی حفاظت',
      'گھر میں فوری طبی امداد',
      'گھر میں آرٹ کے اصولوں کا استعمال',
      'ڈیزائن',
      'ڈیزائن اور اس کے عناصر',
    ],
  },
  {
    subject: 'elective',
    name: 'Human Geography (انسانی جغرافیہ)',
    urdu: true,
    elective: true,
    chapters: [
      'طبعی جغرافیہ',
      'زمین کی اندرونی ساخت',
      'زمینی خد و خال',
      'کرۂ ہوائی',
      'ہواؤں کا عالمی نظام',
      'ہوا کی نمی',
      'سمندر کے پانی کی حرکات',
      'آب و ہوا کے خطے',
    ],
  },
  { subject: 'elective', name: 'Ethics', urdu: true, elective: true, chapters: ETHICS_11_12 },
];

/* ------------------------------------------------------------------ *
 * Class 12 (New Syllabus 2026) — all groups merged
 * ------------------------------------------------------------------ */

const CLASS_12_BOOKS: BookSpec[] = [
  {
    subject: 'english',
    chapters: [
      'Journey of Taif',
      'The Last Lesson',
      'On His Blindness (Poem)',
      'The Power of Digital Learning',
      'The Giving Tree',
      'The Fun They Had',
      'Because I Could Not Stop for Death (Poem)',
      'The Devoted Friend',
      "The Doll's House",
      "All the World's a Stage",
      'A Letter to God',
      'A Visit to the Swat Valley',
      'The Pearl (Novel)',
    ],
  },
  {
    subject: 'urdu',
    chapters: [
      'حمد',
      'نعت',
      'ہجرتِ حبشہ',
      'ماں جی',
      'کافی',
      'رستم و سہراب',
      'محشر',
      'مینار',
      'سیر دوسرے درویش کی',
      'بہادر خان کی سرگزشت',
      'حکیم احسن اللہ خان',
      'نظریۂ پاکستان',
      'انسانِ کامل کی برکات',
      'داستان تیاری میں باغ کی',
      'نثار میں تیری گلیوں کے',
      'نئی نسل کا نوحہ',
      'میں روزے سے ہوں',
      'غزل (۱)',
      'غزل (۲)',
      'غزل (۳)',
      'غزل (۴)',
      'غزل (۵)',
    ],
  },
  {
    subject: 'math',
    chapters: [
      'Graphical Representation of Functions',
      'Further Differentiation',
      'Integration',
      'Differential Equations',
      'Analytical Geometry',
      'Conic Section',
      'Kinematics',
      'Numerical Method',
      'Inverse Trigonometric Functions and their Graphs',
      'Solution of Trigonometric Equations',
      'Vector Valued Functions and Their Differentiations',
    ],
  },
  {
    subject: 'physics',
    chapters: [
      'Thermal Physics',
      'Simple Harmonic Motion',
      'Physical Optics',
      'Electrostatics',
      'Alternating Current',
      'Quantum Physics',
      'Nuclear and Particle Physics',
      'Medical Physics',
      'Space and Environment',
    ],
  },
  {
    subject: 'chemistry',
    chapters: [
      'Group 2 Elements',
      'Transition Metals',
      'Basics of Organic Chemistry',
      'Aromatic Hydrocarbons',
      'Halogenoalkanes',
      'Hydroxy Compounds',
      'Carbonyl Compounds and Carboxylic Acids',
      'Organic Nitrogen Compounds',
      'Organic Synthesis',
      'Polymers',
      'Biochemistry',
      'Chromatography',
      'Spectroscopy-1',
      'Spectroscopy-2 (NMR)',
      'Materials and Energy',
      'Medicine, Agriculture and Industry',
      'Water',
    ],
  },
  {
    subject: 'biology',
    chapters: [
      'Thermoregulation and Osmoregulation',
      'Human Urinary System',
      'Human Nervous System',
      'Human Endocrine System',
      'Human Reproductive System',
      'Inheritance',
      'Chromosome and DNA',
      'Biotechnology',
      'Immunity',
      'Biostatistics',
      'Pharmacology',
      'Evolution',
      'Ecology',
    ],
  },
  {
    subject: 'cs',
    chapters: [
      'Data Basics',
      'Basic Concepts and Terminology of Databases',
      'Database Design Process',
      'Data Integrity and Normalization',
      'Introduction to Microsoft Access',
      'Table and Query',
      'Microsoft Access — Forms and Reports',
      'Getting Started with "C"',
      'Elements of "C"',
      'Input/Output',
      'Decision Constructs',
      'Loop Constructs',
      'Functions in "C"',
      'File Handling in "C"',
    ],
  },
  {
    subject: 'pakstudies',
    chapters: [
      'Islam and Pakistan',
      'Political and Constitutional Development',
      'Administrative System',
      'Human Rights',
      'Education System of Pakistan',
      'Sports and Tourism',
    ],
  },
  {
    subject: 'tarjuma',
    chapters: [
      'ترجمہ — منتخب سورتیں و آیات (حصہ دوم)',
      'مفہوم و تشریح',
      'قرآنی الفاظ و تراکیب',
      'قرآنی تعلیمات کی عملی تطبیق',
    ],
  },
  { subject: 'elective', name: 'English Grammar', family: 'language', elective: true, chapters: ENGLISH_GRAMMAR_11_12 },
  { subject: 'elective', name: 'Urdu Grammar', family: 'language', urdu: true, elective: true, chapters: URDU_GRAMMAR_11_12 },
  {
    subject: 'elective',
    name: 'Civics',
    elective: true,
    chapters: [
      'Pakistan Movement',
      'Constitutional Development 1947-1973',
      'Social Service in Pakistan',
      'Social Order in Pakistan',
      'National Integration and Cohesion',
      'Pakistan and the World',
    ],
  },
  {
    subject: 'elective',
    name: 'Economics',
    elective: true,
    chapters: [
      'National Income',
      'Money',
      'Bank',
      'Public Finance',
      'International Trade',
      'Introduction to Pakistan Economics',
      'National Income of Pakistan',
      'Economic Development and Planning',
      'Communication and Human Resource Development',
      'Banking in Pakistan',
      'Public Finance of Pakistan',
      'Foreign Trade of Pakistan',
      'Economic System of Islam',
    ],
  },
  {
    subject: 'elective',
    name: 'Geography',
    elective: true,
    chapters: [
      'Location in Geography',
      'Directions and Finding Directions on Map',
      'Scales',
      'Introduction to GIS, GPS and Remote Sensing',
      'Methods of Showing Relief Features',
      'Conventional Signs',
      'Statistical Diagrams',
      'Distributional Maps',
      'Major Types of Projections',
    ],
  },
  {
    subject: 'elective',
    name: 'Human Geography (انسانی جغرافیہ)',
    urdu: true,
    elective: true,
    chapters: [
      'انسانی جغرافیہ',
      'دنیا کی آبادی',
      'انسانی بستیاں',
      'معاشی سرگرمیاں',
      'سیاسی جغرافیہ',
      'قدرتی آفات',
    ],
  },
  {
    subject: 'elective',
    name: 'Psychology',
    elective: true,
    chapters: [
      'Developmental Psychology',
      'Psychology of Health',
      'Social Psychology',
      'Guidance and Counseling',
    ],
  },
  {
    subject: 'elective',
    name: 'Statistics',
    family: 'math',
    elective: true,
    chapters: [
      'Normal Distribution',
      'Sampling Techniques',
      'Estimation',
      'Hypothesis Testing',
      'Simple Linear Regression',
      'Association',
      'Analysis of Time Series',
      'Orientation of Computers',
    ],
  },
  {
    subject: 'elective',
    name: 'Principles of Accounting',
    elective: true,
    chapters: [
      'Accounts from Incomplete Records',
      'Accounts of Non-Profit Making Organizations',
      'Consignment Accounts',
      'Joint Stock Company',
      'Depreciation, Provisions and Reserves',
      'Sole Proprietorship and Partnership',
      'Partnership Accounts — Admission of a Partner',
      'Partnership Accounts — Retirement and Death',
      'Partnership Accounts — Dissolution of the Firm',
    ],
  },
  {
    subject: 'elective',
    name: 'Business Mathematics',
    family: 'math',
    elective: true,
    chapters: [
      'Matrix Algebra and Determinants',
      'Functions, Limits and Continuity',
      'Differential Calculus and Business Applications',
      'Integral Calculus and Business Applications',
      'Mathematics of Finance',
      'Linear Programming',
    ],
  },
  {
    subject: 'elective',
    name: 'Education',
    urdu: true,
    elective: true,
    chapters: [
      'برِصغیر میں مسلمانوں کی تعلیم',
      'جنوبی ایشیا میں برطانوی نظامِ تعلیم',
      'پاکستان کی تعلیمی پالیسیاں اور منصوبے',
      'پاکستان کے تعلیمی مسائل',
      'تعلیم کے فروغ کے لیے مختلف تنظیموں کا کردار',
    ],
  },
  {
    subject: 'elective',
    name: 'Logic (منطق)',
    urdu: true,
    elective: true,
    chapters: [
      'تعارف',
      'زبان',
      'غیر رسمی مغالطے',
      'معقولی قضیے',
      'معقولی قیاس اور سادہ دلائل',
      'منطقِ استقرائیہ',
      'توجیہ کا سائنسی طریقۂ کار',
    ],
  },
  {
    subject: 'elective',
    name: 'Home Economics',
    urdu: true,
    elective: true,
    chapters: [
      'غذا کی اہمیت',
      'متوازن غذا',
      'غذائی ضروریات',
      'پروٹین',
      'کاربوہائیڈریٹ یا نشاستہ',
      'روغنیات یا چکنائی',
      'وٹامن یا حیاتین',
      'معدنی نمکیات',
      'فہرستِ طعام کی ترتیب',
      'اشیائے خوردنی کی خریداری',
      'کھانا پکانے کے اصول و طریقے',
      'کھانا پیش کرنے کے طریقے',
      'سلائی کے ابتدائی مراحل',
      'اچھی فٹنگ کے لیے مناسب ناپ کی اہمیت',
      'ریشوں کے مطالعے کی اہمیت',
      'پارچہ بافی کے بنیادی طریقے',
      'کپڑوں کی منصوبہ بندی',
      'ذاتی زیبائش',
      'عملی کام',
    ],
  },
  {
    subject: 'elective',
    name: 'Health and Physical Education',
    urdu: true,
    elective: true,
    chapters: [
      'کھیلوں کے فوائد',
      'منظم کھیلیں',
      'مقابلے کے قوانین',
      'جسمانی نظام',
      'غذا اور غذائیت',
      'نشہ آور اشیا اور ان کے اثرات',
      'جنسی حفظانِ صحت',
      'ابتدائی طبی امداد',
    ],
  },
  { subject: 'elective', name: 'Ethics', urdu: true, elective: true, chapters: ETHICS_11_12 },
];

/* ------------------------------------------------------------------ */

function toBook(classKey: string, spec: BookSpec): Book {
  const name = spec.name ?? NAMES[spec.subject];
  return {
    id: `${classKey}:${spec.subject}${spec.name ? `:${spec.name}` : ''}`,
    subject: spec.subject,
    name,
    family: spec.family ?? FAMILY[spec.subject],
    urdu:
      spec.urdu ??
      (spec.subject === 'urdu' || spec.subject === 'islamiat' || spec.subject === 'tarjuma'),
    chapters: spec.chapters,
    ...(spec.elective ? { elective: true } : {}),
  };
}

function makeClass(
  key: string,
  label: string,
  classLevel: ClassGroup['classLevel'],
  specs: BookSpec[],
): ClassGroup {
  return {
    key,
    label,
    classLevel,
    group: 'All Groups',
    books: specs.map((s) => toBook(key, s)),
  };
}

export const CLASS_GROUPS: ClassGroup[] = [
  makeClass('9', '9th Class', '9th', CLASS_9_BOOKS),
  makeClass('10', '10th Class', '10th', CLASS_10_BOOKS),
  makeClass('11', '11th Class', '11th', CLASS_11_BOOKS),
  makeClass('12', '12th Class', '12th', CLASS_12_BOOKS),
];

/** Old group keys (11-premed, 12-fa …) map onto the merged class. */
export function normalizeGroupKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const digits = key.match(/^(9|10|11|12)/)?.[1];
  return digits ?? null;
}

export function findGroup(key: string | null | undefined): ClassGroup | undefined {
  const normalized = normalizeGroupKey(key);
  return CLASS_GROUPS.find((g) => g.key === (normalized ?? key));
}

export function findBook(groupKey: string | null | undefined, bookId: string | null | undefined) {
  return findGroup(groupKey)?.books.find((b) => b.id === bookId);
}

export type PaperRange = 'full' | 'first-half' | 'second-half' | 'chapters';

export const RANGE_LABELS: Record<PaperRange, string> = {
  full: 'Full Book',
  'first-half': 'Half Book — First Half',
  'second-half': 'Half Book — Second Half',
  chapters: 'Selected Chapters',
};

/** Chapters covered by the chosen range. */
export function chaptersForRange(
  bookChapters: string[],
  range: PaperRange,
  selected: string[],
): string[] {
  const half = Math.ceil(bookChapters.length / 2);
  if (range === 'full') return bookChapters;
  if (range === 'first-half') return bookChapters.slice(0, half);
  if (range === 'second-half') return bookChapters.slice(half);
  return selected.length ? selected : bookChapters;
}
