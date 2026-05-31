// NEET PG exam subject weightage (% of 200 questions)
export const EXAM_WEIGHTAGE = {
  Medicine:           15,
  Surgery:            12.5,
  Pathology:          7.5,
  Pharmacology:       7.5,
  OBGYN:              6,
  Microbiology:       5,
  Pediatrics:         5,
  PSM:                5,
  Anatomy:            4,
  Physiology:         4,
  Biochemistry:       3.5,
  ENT:                2.5,
  Ophthalmology:      2.5,
  Orthopedics:        2.5,
  Psychiatry:         2.5,
  Radiology:          2,
  Anaesthesia:        2,
  Dermatology:        2,
  'Forensic Medicine':1.5,
};

// High-yield topics per subject (for focus suggestions)
export const HIGH_YIELD_TOPICS = {
  Medicine:    ['Cardiology', 'Neurology', 'Endocrinology', 'Rheumatology', 'Infectious Diseases'],
  Surgery:     ['General Surgery Basics', 'GI Surgery', 'Vascular Surgery', 'Head and Neck Surgery'],
  Pathology:   ['Hematology', 'General Pathology', 'Systemic Pathology'],
  Pharmacology:['Antimicrobials', 'CVS Pharmacology', 'CNS Pharmacology', 'ANS Pharmacology'],
  Microbiology:['Bacteriology', 'Virology', 'Parasitology'],
  OBGYN:       ['Obstetrics', 'Gynecology'],
  PSM:         ['Biostatistics', 'Epidemiology', 'Communicable and NCDs'],
};

// Difficulty multiplier for score estimation
export const DIFFICULTY_WEIGHT = {
  Easy:      1.0,
  Moderate:  1.2,
  Hard:      1.5,
  'Very Hard': 2.0,
};
