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
  'Forensic Medicine': 1.5,
};

// High-yield topics per subject (for focus suggestions)
export const HIGH_YIELD_TOPICS = {
  Medicine: [
    'Cardiology',
    'Neurology',
    'Endocrinology',
    'Rheumatology',
    'Infectious Diseases',
    'Nephrology',        // ✅ Added — Top 10 PYQ (AKI, Nephrotic syndrome, RTA)
    'Hematology',        // ✅ Moved from Pathology — Top 10 PYQ (AML, Myeloma, IDA)
    'Respiratory',       // ✅ Added — Top 20 PYQ (Pneumonia, PFT, Asthma)
    'Gastroenterology',  // ✅ Added — Top 15 PYQ (Liver failure, MELD, IBD)
  ],
  Surgery: [
    'General Surgery Basics',
    'GI Surgery',
    'Vascular Surgery',
    'Head and Neck Surgery',
    'Burns',             // ✅ Added — Repeated PYQ
    'Hernias',           // ✅ Added — Repeated PYQ
    'Head Trauma',       // ✅ Added — Repeated PYQ
  ],
  Pathology: [
    'General Pathology',
    'Systemic Pathology', // ✅ Removed Hematology (moved to Medicine)
    'Histopathology',
  ],
  Pharmacology: [
    'Antimicrobials',
    'CVS Pharmacology',
    'CNS Pharmacology',
    'ANS Pharmacology',
    'Anti-diabetic drugs', // ✅ Added — Repeated PYQ
    'Diuretics',           // ✅ Added — Repeated PYQ
    'Anti-cancer drugs',   // ✅ Added — Repeated PYQ
  ],
  Microbiology: [
    'Bacteriology',
    'Virology',
    'Parasitology',
    'Mycology',            // ✅ Added — Fungal infections repeated PYQ
  ],
  OBGYN: [
    'Obstetrics',
    'Gynecology',
    'Endometriosis',       // ✅ Added — Repeated PYQ
  ],
  PSM: [
    'Biostatistics',
    'Epidemiology',
    'Communicable and NCDs',
    'National Health Programs', // ✅ Added — Repeated PYQ
    'Vaccines',                 // ✅ Added — Top 25 Must-Do PYQ
  ],
  Psychiatry: [
    'Schizophrenia',       // ✅ Added — Repeated PYQ
    'Sleep Disorders',     // ✅ Added — Repeated PYQ
    'Hallucinations',      // ✅ Added — Repeated PYQ
  ],
  Orthopedics: [
    'Bone Tumors',         // ✅ Added — Repeated PYQ
    'Named Fractures',     // ✅ Added — Repeated PYQ
    'Scoliosis',           // ✅ Added — Repeated PYQ
    'Osteoporosis',        // ✅ Added — Repeated PYQ
  ],
  Ophthalmology: [
    'Fundus Images',       // ✅ Added — Repeated PYQ
    'Retinal Diseases',    // ✅ Added — Repeated PYQ
  ],
  ENT: [
    'Nasal Sinus Anatomy', // ✅ Added — Repeated PYQ
    'Sinus X-ray',         // ✅ Added — Repeated PYQ
  ],
};

// Difficulty multiplier for score estimation
export const DIFFICULTY_WEIGHT = {
  Easy:        1.0,
  Moderate:    1.2,
  Hard:        1.5,
  'Very Hard': 2.0,
};