# NEET PG Complete MCQ Dataset v1.0

> **Exam-ready JSON dataset** for NEET PG / INI-CET preparation.  
> Pattern: 200 questions | 3.5 hours | +4 correct / −1 incorrect / 0 unanswered

---

## 📦 Dataset Summary

| Type | Count | Questions/File | Approx. Total |
|------|-------|---------------|---------------|
| Full Mock Papers | 35 | 185–200 | ~6,800 |
| Subject-wise Papers | 80 | 100 each | ~8,000 |
| Topic-wise Banks | 61 | 2–25 | ~800+ |
| **TOTAL** | **176 files** | — | **~15,600 MCQs** |

---

## 🗂️ Directory Structure

```
neet_pg_dataset/
├── _master_index.json          ← Start here: full dataset summary
├── _schema.json                ← JSON schema for all objects
│
├── full_papers/
│   ├── _index.json             ← Index of all 35 full papers
│   ├── FP_01.json              ← Full mock paper 1 (200 questions)
│   ├── FP_02.json
│   ├── ...
│   └── FP_35.json
│
├── subject_papers/
│   ├── _index.json             ← Index of all 80 subject papers
│   ├── SP_MEDICINE_01.json     ← Medicine paper 1 (100 questions)
│   ├── SP_MEDICINE_02.json
│   ├── ...
│   ├── SP_SURGERY_01.json
│   ├── ...
│   └── SP_RADIOLOG_02.json
│
└── topic_wise/
    ├── _index.json             ← Index of all 61 topic banks
    ├── TW_MEDICINE_CARDIOLOGY.json
    ├── TW_MEDICINE_NEUROLOGY.json
    ├── TW_PHARMACO_ANTIMICROBIA.json
    ├── ...
    └── TW_RADIOLOG_RADIOLOGY_BA.json
```

---

## 📐 Question Object Schema

Every question — regardless of paper type — has this exact structure:

```json
{
  "question_id":      "FP_01_Q001",
  "paper_type":       "full_paper | subject_paper | topic_wise",
  "paper_ref":        "FP_01",
  "subject":          "Medicine",
  "topic":            "Cardiology",
  "subtopic":         "AF management",
  "difficulty":       "Easy | Moderate | Hard | Very Hard",
  "question_type":    "single_best_answer",
  "image_based":      false,
  "marks_correct":    4,
  "marks_incorrect":  -1,
  "marks_unanswered": 0,
  "question_text":    "A 60-year-old presents with palpitations...",
  "options": {
    "A": "IV adenosine",
    "B": "Rate control with beta-blockers",
    "C": "Emergency cardioversion",
    "D": "Immediate ablation"
  },
  "correct_answer":   "B",
  "explanation":      "AF: rate control is first-line unless hemodynamically unstable..."
}
```

---

## 🔑 Question ID Format

| Paper Type | Format | Example |
|-----------|--------|---------|
| Full Paper | `FP_<NN>_Q<NNN>` | `FP_01_Q042` |
| Subject Paper | `SP_<SUBJ>_<NN>_Q<NNN>` | `SP_MEDICINE_03_Q015` |
| Topic Bank | `TW_<SUBJ>_<TOPIC>_Q<NNN>` | `TW_MEDICINE_CARDIOLOGY_Q007` |

---

## 🏫 Subject Coverage

| Subject | Full-Paper Qs/Paper | Subject Papers | Priority |
|---------|---------------------|----------------|----------|
| Medicine | 30 | 10 | Very High |
| Surgery | 25 | 8 | Very High |
| Pathology | 15 | 6 | High |
| Pharmacology | 15 | 6 | High |
| OBGYN | 12 | 5 | High |
| Microbiology | 10 | 5 | High |
| Pediatrics | 10 | 4 | High |
| PSM | 10 | 5 | High |
| Anatomy | 8 | 4 | Moderate-High |
| Physiology | 8 | 4 | Moderate-High |
| Biochemistry | 7 | 3 | Moderate |
| ENT | 5 | 3 | Moderate |
| Ophthalmology | 5 | 3 | Moderate |
| Orthopedics | 5 | 3 | Moderate |
| Psychiatry | 5 | 3 | Moderate |
| Radiology | 4 | 2 | Low-Moderate |
| Anaesthesia | 4 | 2 | Moderate |
| Dermatology | 4 | 2 | Moderate |
| Forensic Medicine | 3 | 2 | Moderate |

---

## 🎯 Difficulty Distribution

| Level | Approx % | Description |
|-------|----------|-------------|
| Easy | 20% | Direct recall, standard facts |
| Moderate | 40% | Application, clinical scenario |
| Hard | 30% | Complex reasoning, exceptions |
| Very Hard | 10% | Advanced, competitive level |

---

## 💡 Access Patterns (Code Examples)

### Load all full papers
```python
import json

with open('_master_index.json') as f:
    meta = json.load(f)

with open('full_papers/_index.json') as f:
    index = json.load(f)

for entry in index:
    with open(f"full_papers/{entry['paper_id']}.json") as f:
        paper = json.load(f)
    questions = paper['questions']
```

### Filter questions by subject + difficulty
```python
with open('full_papers/FP_01.json') as f:
    paper = json.load(f)

hard_medicine = [
    q for q in paper['questions']
    if q['subject'] == 'Medicine' and q['difficulty'] in ('Hard', 'Very Hard')
]
```

### Load a topic-wise bank
```python
with open('topic_wise/TW_MEDICINE_CARDIOLOGY.json') as f:
    bank = json.load(f)

print(f"Cardiology MCQs: {bank['total_questions']}")
for q in bank['questions']:
    print(q['question_id'], q['difficulty'], q['question_text'][:60])
```

### Load subject paper index and filter
```python
with open('subject_papers/_index.json') as f:
    sp_index = json.load(f)

medicine_papers = [p for p in sp_index if p['subject'] == 'Medicine']
# Returns: [{paper_id, subject, paper_number, total_questions}, ...]
```

---

## ✅ Data Quality

- All 30 original papers **audited**: zero schema errors, zero missing correct answers
- All questions validated: correct answer always within A/B/C/D options
- Uniform schema across all 176 JSON files
- Difficulty labels: Easy / Moderate / Hard / Very Hard (normalised from source)
- Explanations provided for all MCQ bank questions

---

*Built for NEET PG 2024+ pattern. Total ~15,600 MCQs across 176 JSON files.*
