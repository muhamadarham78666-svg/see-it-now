/**
 * Curriculum registry: Class / Group -> Books -> Chapters.
 *
 * Everything here is plain configuration. To add a class, group, book or chapter
 * list you only edit this file — no Paper Generator code needs to change.
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
  /** Unique id inside its class group, e.g. "11-premed:biology". */
  id: string;
  subject: SubjectCode;
  name: string;
  family: SubjectFamily;
  /** Paper is normally written in Urdu script. */
  urdu?: boolean;
  chapters: string[];
  /** Elective books can be switched off per institute. */
  elective?: boolean;
}

export interface ClassGroup {
  key: string;
  label: string;
  classLevel: '9th' | '10th' | '11th' | '12th';
  group: string;
  books: Book[];
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

/** Chapter/unit lists keyed by `<class>:<subject>`. Missing keys fall back to generic units. */
const CHAPTERS: Record<string, string[]> = {
  '9:physics': [
    'Physical Quantities and Measurement',
    'Kinematics',
    'Dynamics',
    'Turning Effect of Forces',
    'Gravitation',
    'Work and Energy',
    'Properties of Matter',
    'Thermal Properties of Matter',
    'Transfer of Heat',
  ],
  '10:physics': [
    'Simple Harmonic Motion and Waves',
    'Sound',
    'Geometrical Optics',
    'Electrostatics',
    'Current Electricity',
    'Electromagnetism',
    'Basic Electronics',
    'Information and Communication Technology',
    'Radioactivity',
  ],
  '9:chemistry': [
    'Fundamentals of Chemistry',
    'Structure of Atoms',
    'Periodic Table and Periodicity of Properties',
    'Structure of Molecules',
    'Physical States of Matter',
    'Solutions',
    'Electrochemistry',
    'Chemical Reactivity',
  ],
  '10:chemistry': [
    'Chemical Equilibrium',
    'Acids, Bases and Salts',
    'Organic Chemistry',
    'Hydrocarbons',
    'Biochemistry',
    'The Atmosphere',
    'Water',
    'Chemical Industries',
  ],
  '9:biology': [
    'Introduction to Biology',
    'Solving a Biological Problem',
    'Biodiversity',
    'Cells and Tissues',
    'Cell Cycle',
    'Enzymes',
    'Bioenergetics',
    'Nutrition',
    'Transport',
  ],
  '10:biology': [
    'Gaseous Exchange',
    'Homeostasis',
    'Coordination and Control',
    'Support and Movement',
    'Reproduction',
    'Inheritance',
    'Man and His Environment',
    'Biotechnology',
    'Pharmacology',
  ],
  '9:math': [
    'Matrices and Determinants',
    'Real and Complex Numbers',
    'Logarithms',
    'Algebraic Expressions and Formulas',
    'Factorization',
    'Algebraic Manipulation',
    'Linear Equations and Inequalities',
    'Linear Graphs and Their Application',
    'Introduction to Coordinate Geometry',
    'Congruent Triangles',
    'Parallelograms and Triangles',
    'Line Bisectors and Angle Bisectors',
    'Sides and Angles of a Triangle',
    'Ratio and Proportion',
    'Pythagoras Theorem',
    'Theorems Related with Area',
    'Practical Geometry — Triangles',
  ],
  '10:math': [
    'Quadratic Equations',
    'Theory of Quadratic Equations',
    'Variations',
    'Partial Fractions',
    'Sets and Functions',
    'Basic Statistics',
    'Introduction to Trigonometry',
    'Projection of a Side of a Triangle',
    'Chords of a Circle',
    'Tangent to a Circle',
    'Chords and Arcs',
    'Angle in a Segment of a Circle',
    'Practical Geometry — Circles',
  ],
  '9:english': [
    'The Saviour of Mankind',
    'Patriotism',
    'Media and Its Impact',
    'Hazrat Asma',
    'Daffodils',
    'The Quaid’s Vision and Pakistan',
    'Sultan Ahmad Masjid',
    'Grammar — Tenses and Voice',
    'Grammar — Parts of Speech and Phrases',
    'Translation and Composition',
  ],
  '10:english': [
    'Hazrat Muhammad (PBUH) — An Embodiment of Justice',
    'Chinese New Year',
    'First Aid',
    'Great Expectations',
    'The Rain',
    'Television vs Newspapers',
    'Careers',
    'Grammar — Direct and Indirect Speech',
    'Grammar — Phrases, Pronouns and Adverbs',
    'Translation, Essay and Paragraph Writing',
  ],
  '9:urdu': [
    'نعت اور حمد',
    'نثری اسباق (حصہ اول)',
    'نثری اسباق (حصہ دوم)',
    'غزلیات',
    'نظمیں',
    'قواعد — اسم، فعل، حروف',
    'تشبیہ، استعارہ اور محاورات',
    'خط نویسی اور مضمون نویسی',
  ],
  '10:urdu': [
    'حمد و نعت',
    'نثری اسباق',
    'سبق آموز کہانیاں',
    'غزلیات',
    'نظمیں',
    'قواعد و انشاء',
    'محاورات اور ضرب الامثال',
    'خط، درخواست اور مضمون',
  ],
  '11:urdu': [
    'نثر — سوانحی و انشائی مضامین',
    'نثر — مزاح و طنز',
    'افسانہ',
    'غزل',
    'نظم',
    'علم عروض و صنائع بدائع',
    'قواعد — تذکیر و تانیث، صحتِ جملہ',
    'خط نویسی و مضمون نویسی',
  ],
  '12:urdu': [
    'نثر — تنقیدی و تحقیقی مضامین',
    'نثر — خاکہ و رپورتاژ',
    'افسانہ و ڈرامہ',
    'غزل',
    'نظم و قصیدہ',
    'صنائع بدائع',
    'قواعد و انشاء',
    'خلاصہ، تشریح اور مضمون',
  ],
  '11:english': [
    'Button Button',
    'Clearing in the Sky',
    'Dark They Were and Golden Eyed',
    'Thank You Ma’am',
    'The Piece of String',
    'Poems — Part I',
    'Grammar and Composition',
    'Translation and Idioms',
  ],
  '12:english': [
    'Hunting Snake and Other Poems',
    'The Angel and the Author',
    'On Destroying Books',
    'Using the Scientific Method',
    'End of Term',
    'Grammar and Composition',
    'Précis Writing',
    'Essay and Letter Writing',
  ],
  '11:physics': [
    'Measurements',
    'Vectors and Equilibrium',
    'Motion and Force',
    'Work and Energy',
    'Circular Motion',
    'Fluid Dynamics',
    'Oscillations',
    'Waves',
    'Physical Optics',
    'Optical Instruments',
    'Heat and Thermodynamics',
  ],
  '12:physics': [
    'Electrostatics',
    'Current Electricity',
    'Electromagnetism',
    'Electromagnetic Induction',
    'Alternating Current',
    'Physics of Solids',
    'Electronics',
    'Dawn of Modern Physics',
    'Atomic Spectra',
    'Nuclear Physics',
  ],
  '11:chemistry': [
    'Stoichiometry',
    'Atomic Structure',
    'Theories of Covalent Bonding',
    'States of Matter (Gases, Liquids, Solids)',
    'Chemical Equilibrium',
    'Solutions and Colloids',
    'Thermochemistry',
    'Electrochemistry',
    'Chemical Kinetics',
    'Periodic Table and Periodicity',
  ],
  '12:chemistry': [
    'Periods and Groups of the Periodic Table',
    's- and p-Block Elements',
    'Transition Elements',
    'Fundamental Principles of Organic Chemistry',
    'Hydrocarbons',
    'Alkyl Halides and Amines',
    'Alcohols, Phenols and Ethers',
    'Aldehydes and Ketones',
    'Carboxylic Acids',
    'Macromolecules and Industrial Chemistry',
  ],
  '11:biology': [
    'Introduction to Biology and the Biologists',
    'Biological Molecules',
    'Enzymes',
    'The Cell',
    'Variety of Life — Viruses and Prokaryotes',
    'Kingdom Protista and Fungi',
    'Kingdom Plantae',
    'Kingdom Animalia',
    'Bioenergetics',
    'Nutrition',
    'Gaseous Exchange and Transport',
  ],
  '12:biology': [
    'Homeostasis',
    'Support and Movement',
    'Coordination and Control',
    'Reproduction',
    'Growth and Development',
    'Chromosomes and DNA',
    'Cell Cycle',
    'Variation and Genetics',
    'Evolution',
    'Ecosystem and Biotechnology',
  ],
  '11:math': [
    'Number Systems',
    'Sets, Functions and Groups',
    'Matrices and Determinants',
    'Quadratic Equations',
    'Partial Fractions',
    'Sequences and Series',
    'Permutation, Combination and Probability',
    'Mathematical Induction and Binomial Theorem',
    'Fundamentals of Trigonometry',
    'Trigonometric Identities and Functions',
    'Solution of Triangles and Inverse Functions',
  ],
  '12:math': [
    'Functions and Limits',
    'Differentiation',
    'Integration',
    'Introduction to Analytic Geometry',
    'Linear Inequalities and Linear Programming',
    'Conic Sections',
    'Vectors',
  ],
  '9:cs': [
    'Problem Solving',
    'Binary System',
    'Networks',
    'Data and Privacy',
    'Designing Website (HTML)',
  ],
  '10:cs': [
    'Introduction to Programming',
    'User Interaction',
    'Conditional Logic',
    'Data and Repetition',
    'Functions',
    'File Handling',
  ],
  '11:cs': [
    'Basics of Information Technology',
    'Fundamentals of Operating Systems',
    'Office Automation',
    'Data Communication and Networks',
    'Programming Fundamentals',
    'Database Concepts',
  ],
  '12:cs': [
    'Data Basics and Data Types',
    'Introduction to C Language',
    'Input / Output and Operators',
    'Decision Constructs',
    'Loop Constructs',
    'Functions and Arrays',
    'Pointers, Structures and File Handling',
  ],
  '9:islamiat': [
    'ایمانیات (توحید، رسالت، آخرت)',
    'قرآن حکیم — منتخب آیات',
    'حدیث نبوی',
    'سیرت النبی ﷺ',
    'عبادات',
    'اخلاقیات و معاشرت',
  ],
  '11:islamiat': [
    'قرآن حکیم — منتخب آیات و تشریح',
    'حدیث و سنت',
    'سیرت طیبہ ﷺ',
    'ایمانیات و عبادات',
    'اسلامی معاشرت و اخلاق',
    'اسلامی ریاست و معاشیات',
  ],
  '10:pakstudies': [
    'Ideological Basis of Pakistan',
    'Pakistan Movement',
    'Land and Environment of Pakistan',
    'Constitutional Development',
    'Economy of Pakistan',
    'Population, Society and Culture',
    'Pakistan and the World',
  ],
  '12:pakstudies': [
    'Ideology of Pakistan and the Pakistan Movement',
    'Land of Pakistan',
    'Constitution and Government',
    'Economic Development',
    'Society and Culture',
    'Education, Science and Technology',
    'Foreign Policy of Pakistan',
  ],
  '9:sst': [
    'Geography of Pakistan',
    'History of Pakistan',
    'Civics and Citizenship',
    'Economics Basics',
    'Environment and Population',
  ],
  '9:tarjuma': [
    'ترجمہ — منتخب سورتیں (حصہ اول)',
    'مفہوم و تشریح',
    'قرآنی الفاظ و تراکیب',
    'عملی زندگی میں قرآنی احکام',
  ],
  '10:tarjuma': [
    'ترجمہ — منتخب سورتیں (حصہ دوم)',
    'مفہوم و تشریح',
    'قرآنی الفاظ و تراکیب',
    'قرآنی احکام کی عملی تطبیق',
  ],
};

function genericChapters(count = 10): string[] {
  return Array.from({ length: count }, (_, i) => `Chapter ${i + 1}`);
}

function classDigits(level: ClassGroup['classLevel']): string {
  return level.replace(/[^0-9]/g, '');
}

function book(
  groupKey: string,
  level: ClassGroup['classLevel'],
  subject: SubjectCode,
  extra: Partial<Book> = {},
): Book {
  const key = `${classDigits(level)}:${subject}`;
  return {
    id: `${groupKey}:${subject}${extra.name ? `:${extra.name}` : ''}`,
    subject,
    name: extra.name ?? NAMES[subject],
    family: extra.family ?? FAMILY[subject],
    urdu: extra.urdu ?? (subject === 'urdu' || subject === 'islamiat' || subject === 'tarjuma'),
    chapters: extra.chapters ?? CHAPTERS[key] ?? genericChapters(),
    ...(extra.elective ? { elective: true } : {}),
  };
}

/** FA / general-group elective subjects — edit this list to manage electives. */
export const FA_ELECTIVES: { subject: SubjectCode; name: string; urdu?: boolean }[] = [
  { subject: 'elective', name: 'Civics' },
  { subject: 'elective', name: 'Economics' },
  { subject: 'elective', name: 'Education' },
  { subject: 'elective', name: 'Sociology' },
  { subject: 'elective', name: 'History of Pakistan', urdu: false },
  { subject: 'elective', name: 'Islamic Studies (Elective)', urdu: true },
  { subject: 'elective', name: 'Arabic', urdu: true },
  { subject: 'elective', name: 'Urdu Adab (Elective)', urdu: true },
  { subject: 'elective', name: 'Health & Physical Education' },
  { subject: 'elective', name: 'Fine Arts' },
  { subject: 'elective', name: 'Computer Science (Elective)' },
  { subject: 'elective', name: 'Statistics' },
];

function faElectiveBooks(groupKey: string, level: ClassGroup['classLevel']): Book[] {
  return FA_ELECTIVES.map((e) =>
    book(groupKey, level, 'elective', {
      name: e.name,
      urdu: e.urdu ?? false,
      elective: true,
      chapters: genericChapters(8),
    }),
  );
}

function makeGroup(
  key: string,
  label: string,
  classLevel: ClassGroup['classLevel'],
  group: string,
  subjects: SubjectCode[],
  withElectives = false,
): ClassGroup {
  return {
    key,
    label,
    classLevel,
    group,
    books: [
      ...subjects.map((s) => book(key, classLevel, s)),
      ...(withElectives ? faElectiveBooks(key, classLevel) : []),
    ],
  };
}

export const CLASS_GROUPS: ClassGroup[] = [
  makeGroup('9', '9th Class', '9th', 'Science / General', [
    'english',
    'urdu',
    'math',
    'physics',
    'chemistry',
    'biology',
    'cs',
    'islamiat',
    'tarjuma',
  ]),
  makeGroup('10', '10th Class', '10th', 'Science / General', [
    'english',
    'urdu',
    'math',
    'physics',
    'chemistry',
    'biology',
    'cs',
    'pakstudies',
    'tarjuma',
  ]),
  makeGroup('11-premed', '11th Class — Pre-Medical', '11th', 'Pre-Medical', [
    'english',
    'urdu',
    'islamiat',
    'tarjuma',
    'physics',
    'chemistry',
    'biology',
  ]),
  makeGroup('11-preeng', '11th Class — Pre-Engineering', '11th', 'Pre-Engineering', [
    'english',
    'urdu',
    'islamiat',
    'tarjuma',
    'physics',
    'chemistry',
    'math',
  ]),
  makeGroup('11-ics', '11th Class — ICS', '11th', 'ICS', [
    'english',
    'urdu',
    'islamiat',
    'tarjuma',
    'math',
    'physics',
    'cs',
  ]),
  makeGroup('11-fa', '11th Class — FA', '11th', 'FA', ['english', 'urdu', 'islamiat', 'tarjuma'], true),
  makeGroup('12-premed', '12th Class — Pre-Medical', '12th', 'Pre-Medical', [
    'english',
    'urdu',
    'pakstudies',
    'tarjuma',
    'physics',
    'chemistry',
    'biology',
  ]),
  makeGroup('12-preeng', '12th Class — Pre-Engineering', '12th', 'Pre-Engineering', [
    'english',
    'urdu',
    'pakstudies',
    'tarjuma',
    'physics',
    'chemistry',
    'math',
  ]),
  makeGroup('12-ics', '12th Class — ICS', '12th', 'ICS', [
    'english',
    'urdu',
    'pakstudies',
    'tarjuma',
    'math',
    'physics',
    'cs',
  ]),
  makeGroup('12-fa', '12th Class — FA', '12th', 'FA', ['english', 'urdu', 'pakstudies', 'tarjuma'], true),
];

export function findGroup(key: string | null | undefined): ClassGroup | undefined {
  return CLASS_GROUPS.find((g) => g.key === key);
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
