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

/**
 * Chapter/unit lists keyed by `<class>:<subject>`.
 * All lists below follow the LATEST PECTAA / PCTB (Punjab) textbook editions in force
 * for the 2026 session — i.e. the National Curriculum of Pakistan 2023 books:
 *   Class 9  — new books (NCP 2023)
 *   Class 10 — new books (2026-27 edition)
 *   Class 11 — new PECTAA books
 *   Class 12 — new PECTAA books (chapter numbering continues from Class 11)
 * Older (pre-2023) chapter lists have been removed.
 */
const CHAPTERS: Record<string, string[]> = {
  '9:physics': [
    'Physical Quantities and Measurements',
    'Kinematics',
    'Dynamics',
    'Turning Effects of Forces',
    'Work, Energy and Power',
    'Mechanical Properties of Matter',
    'Thermal Properties of Matter',
    'Magnetism',
    'Nature of Science',
  ],
  '10:physics': [
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
  '9:chemistry': [
    'States of Matter and Phase Changes',
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
  '10:chemistry': [
    'States of Matter and Phase Changes',
    'Stoichiometry',
    'Electrochemistry',
    'Reaction Kinetics',
    'Salts',
    'Nitrogen and Sulphur',
    'Water',
    'Organic Chemistry',
    'Hydrocarbons',
    'Monohydroxy Alkanes (Alcohols)',
    'Carboxylic Acids',
    'Polymers',
  ],
  '9:biology': [
    'Introduction to Biology',
    'Biodiversity',
    'The Cell',
    'Cell Cycle',
    'Tissues, Organs and Organ Systems',
    'Molecular Biology',
    'Enzymes',
    'Bioenergetics',
    'Plant Physiology',
    'Reproduction in Plants',
    'Biostatistics',
  ],
  '10:biology': [
    'Human Digestive System',
    'Human Respiratory System',
    'Human Blood Circulatory System',
    'Human Urinary System',
    'Coordination',
    'Reproduction',
    'Inheritance',
    'Biotechnology',
    'Diseases and Immunity',
    'Evolution',
  ],
  '9:math': [
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
  '10:math': [
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
  '9:english': [
    'The Saviour of Mankind',
    'Patriotism',
    'Daffodils (Poem)',
    'Hazrat Asma',
    'Women Empowerment through Entrepreneurship',
    'The Value of Time',
    'If (Poem)',
    'Globalisation’s Impact on Culture and Economy',
    'Quality Education: A Key to Success',
    'Wildlife Vignettes: Fascinating Nature',
    'The Dear Departed',
  ],
  '10:english': [
    'Hazrat Muhammad’s ﷺ Social Reforms for the Rights of Women',
    'My Beloved Pakistan (Poem)',
    'Digital Globalisation Transforming the English Language',
    'The Earth: Act Now for Tomorrow',
    'The Happy Prince',
    'Drug Abuse',
    'Time (Poem)',
    'Pollution-Free Pakistan with Greenery All Around',
    'The Road Not Taken (Poem)',
    'The Three Questions',
  ],
  '9:urdu': [
    'حمد',
    'نعت',
    'نثری اسباق — سیرت و اخلاق',
    'نثری اسباق — معاشرتی موضوعات',
    'انشائیہ و خاکہ',
    'غزلیات',
    'نظمیں',
    'قواعد — اسم، فعل، حروف',
    'انشاء — خط، درخواست، مضمون',
  ],
  '10:urdu': [
    'حمد',
    'نعت',
    'نثری اسباق — سیرت و کردار',
    'نثری اسباق — قومی و معاشرتی موضوعات',
    'کہانی و افسانہ',
    'غزلیات',
    'نظمیں',
    'قواعد و انشاء',
    'خلاصہ، تشریح اور مضمون نویسی',
  ],
  '11:urdu': [
    'حمد',
    'نعت',
    'اخلاقِ نبوی ﷺ',
    'فاقہ ما روزہ',
    'مکاتیبِ غالب',
    'ایک استاد عدالت میں',
    'چارپائی',
    'نثری اسباق (منتخب)',
    'دہلیز',
    'تاریخ کا کفن',
    'پاکستانی زبانیں اور ان کا باہمی رشتہ',
    'اے وادیِ لولاب',
    'او دیس سے آنے والے بتا',
    'آزادی',
    'اخلاص',
    'کھرا ڈنر',
    'غزل — پتہ پتہ بوٹا بوٹا',
    'غزل — سر میں سودا بھی نہیں',
    'غزل — بے چین بہت پھرنا',
    'غزل — سلسلے توڑ گیا وہ سبھی',
    'بادبان کھلنے سے پہلے کا اشارہ',
    'قواعد و انشاء',
  ],
  '12:urdu': [
    'نظم — حمد',
    'نظم — نعت',
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
    'داستان تیاری میں باغ',
    'نثار میں تیری گلیوں کے',
    'نئی نسل کا نوحہ',
    'میں روزے سے ہوں',
    'غزل — خواجہ میر درد',
    'غزل — مرزا اسد اللہ غالب',
    'غزل — علامہ اقبال',
    'غزل — ادا جعفری',
    'غزل — محسن احسان',
  ],
  '11:english': [
    'Khatim un Nabiyeen Hazrat Muhammad ﷺ',
    'Responsibilities of Youth',
    'The Echoing Green (Poem)',
    'Team Moon',
    'A Bird Came Down the Walk (Poem)',
    'Climate Action: Impact of Global Warming on Pakistan',
    'What You Do is What You Are',
    'The Peace (Poem)',
    'The Importance of Clean Water',
    'George Meredith',
    'Those Winter Sundays (Poem)',
    'Artificial Intelligence',
    'The World is Too Much with Us (Poem)',
    'The End of the Beginning',
  ],
  '12:english': [
    'Journey to Taif',
    'The Last Lesson',
    'On His Blindness (Poem)',
    'The Power of Digital Learning',
    'The Giving Tree',
    'The Fun They Had',
    'Because I Could Not Stop for Death (Poem)',
    'The Devoted Friend',
    'The Doll’s House',
    'All the World’s a Stage (Poem)',
    'A Letter to God',
    'A Visit to the Swat Valley',
    'The Pearl (Novel)',
  ],
  '11:physics': [
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
  '12:physics': [
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
  '11:chemistry': [
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
  '12:chemistry': [
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
  '11:biology': [
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
    'Human Skeletal and Muscular Systems',
  ],
  '12:biology': [
    'Thermoregulation and Osmoregulation',
    'Human Urinary System',
    'Human Nervous System',
    'Human Endocrine System',
    'Human Reproductive System',
    'Inheritance',
    'Chromosomes and DNA',
    'Biotechnology',
    'Immunity',
    'Biostatistics',
    'Pharmacology',
    'Evolution',
    'Ecology',
  ],
  '11:math': [
    'Complex Numbers',
    'Functions and Graphs',
    'Theory of Quadratic Functions',
    'Matrices and Determinants',
    'Partial Fractions',
    'Sequences and Series',
    'Permutations and Combinations',
    'Mathematical Induction and Binomial Theorem',
    'Division of Polynomials',
    'Trigonometric Identities',
    'Trigonometric Functions and their Graphs',
    'Limit and Continuity',
    'Differentiation',
    'Vectors in Space',
  ],
  '12:math': [
    'Graphical Representation of Functions',
    'Further Differentiation',
    'Integration',
    'Differential Equations',
    'Analytical Geometry',
    'Conic Sections',
    'Kinematics',
    'Numerical Methods',
    'Inverse Trigonometric Functions and their Graphs',
    'Solution of Trigonometric Equations',
    'Vector Valued Functions and their Differentiation',
  ],
  '9:cs': [
    'Problem Solving',
    'Binary System',
    'Networks',
    'Data and Privacy',
    'Designing a Website (HTML)',
  ],
  '10:cs': [
    'Operating Systems: Structure and Services',
    'System Recovery and Advanced Maintenance',
    'Introduction to Python Programming',
    'Control Structures in Python',
    'Introduction to Data Science',
    'Introduction to Artificial Intelligence and Machine Learning',
    'Applications of AI',
    'Digital Entrepreneurship',
  ],
  '11:cs': [
    'Introduction to Software Development',
    'Python Programming',
    'Algorithms and Problem Solving',
    'Computational Structures',
    'Data Analytics',
    'Emerging Technologies',
    'Legal and Ethical Aspects of Computing Systems',
    'Online Research and Digital Literacy',
    'Entrepreneurship in the Digital Age',
  ],
  '12:cs': [
    'Computer Networks',
    'Computational Thinking and Algorithms',
    'Object Oriented Programming Using Python',
    'Development of Graphical User Interface (GUI)',
    'Code Testing and Debugging',
    'Data and Analysis',
    'Hypothesis Testing',
    'Applications of Computer Science',
    'Cybersecurity and Safe Digital Collaboration',
  ],
  '9:islamiat': [
    'قرآن مجید اور حدیثِ نبوی ﷺ',
    'ایمانیات و عبادات',
    'سیرت النبی ﷺ',
    'اخلاق و آداب',
    'حسنِ معاملات و معاشرت',
    'ہدایت کے سرچشمے اور مشاہیرِ اسلام',
    'اسلامی تعلیمات اور عصرِ حاضر کے تقاضے',
  ],
  '11:islamiat': [
    'قرآن مجید و حدیث',
    'ایمان و عبادات',
    'سیرت النبی ﷺ',
    'اخلاق و آداب',
    'حسنِ معاملات و مشاورت',
    'ہدایت کے سرچشمے اور مشاہیرِ اسلام',
    'اسلامی تعلیمات اور عصرِ حاضر کے تقاضے',
  ],
  '10:pakstudies': [
    'Ideological Basis of Pakistan',
    'Pakistan Movement',
    'History of Pakistan (1947 to Date) and Constitutional Development',
    'Geography of Pakistan',
    'Pakistan and International Affairs',
    'Resources and Economic Development of Pakistan',
    'Population, Society and Cultural Diversity in Pakistan',
    'Women Empowerment in Pakistan',
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
    'Basics of Economics',
    'Environment and Population',
  ],
  '9:tarjuma': [
    'ترجمہ — منتخب سورتیں (حصہ اول)',
    'مفہوم و تشریح',
    'قرآنی الفاظ و تراکیب',
    'قرآنی احکام کی عملی تطبیق',
  ],
  '10:tarjuma': [
    'ترجمہ — منتخب سورتیں (حصہ دوم)',
    'مفہوم و تشریح',
    'قرآنی الفاظ و تراکیب',
    'قرآنی احکام کی عملی تطبیق',
  ],
  '11:tarjuma': [
    'ترجمہ — منتخب سورتیں و آیات (حصہ اول)',
    'مفہوم و تشریح',
    'قرآنی الفاظ و تراکیب',
    'قرآنی تعلیمات کی عملی تطبیق',
  ],
  '12:tarjuma': [
    'ترجمہ — منتخب سورتیں و آیات (حصہ دوم)',
    'مفہوم و تشریح',
    'قرآنی الفاظ و تراکیب',
    'قرآنی تعلیمات کی عملی تطبیق',
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
