const fs = require('fs');
const path = require('path');

const DATASET_PATH = process.env.DATASET_PATH
  ? path.resolve(process.env.DATASET_PATH)
  : path.resolve(__dirname, '../../data/neet_pg_dataset');

let _masterIndex = null;
let _fpIndex = null;
let _spIndex = null;
let _twIndex = null;

// ─── Index loaders (cached) ────────────────────────────────────────────────

const getMasterIndex = () => {
  if (!_masterIndex) {
    _masterIndex = JSON.parse(
      fs.readFileSync(path.join(DATASET_PATH, '_master_index.json'), 'utf8')
    );
  }
  return _masterIndex;
};

const getFullPaperIndex = () => {
  if (!_fpIndex) {
    _fpIndex = JSON.parse(
      fs.readFileSync(path.join(DATASET_PATH, 'full_papers', '_index.json'), 'utf8')
    );
  }
  return _fpIndex;
};

const getSubjectPaperIndex = () => {
  if (!_spIndex) {
    _spIndex = JSON.parse(
      fs.readFileSync(path.join(DATASET_PATH, 'subject_papers', '_index.json'), 'utf8')
    );
  }
  return _spIndex;
};

const getTopicBankIndex = () => {
  if (!_twIndex) {
    _twIndex = JSON.parse(
      fs.readFileSync(path.join(DATASET_PATH, 'topic_wise', '_index.json'), 'utf8')
    );
  }
  return _twIndex;
};

// ─── Paper/bank loaders ────────────────────────────────────────────────────

const loadFullPaper = (paperId) => {
  const filePath = path.join(DATASET_PATH, 'full_papers', `${paperId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const loadSubjectPaper = (paperId) => {
  const filePath = path.join(DATASET_PATH, 'subject_papers', `${paperId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const loadTopicBank = (bankId) => {
  const filePath = path.join(DATASET_PATH, 'topic_wise', `${bankId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};


const loadLiveTestPaper = (id) => {
  const filePath = path.join(DATASET_PATH, 'live_tests', `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const getLiveTestPaperIndex = () => {
  const dir = path.join(DATASET_PATH, 'live_tests');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .map((f) => {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      return {
        paper_id:         data.paper_id,
        paper_title:      data.paper_title,
        subject:          data.subject,
        total_questions:  data.total_questions ?? data.questions?.length ?? 0,
        duration_minutes: data.duration_minutes,
      };
    });
};
// ─── Question sampling helpers ─────────────────────────────────────────────

/**
 * Sample N questions from a paper/bank, optionally filtered by difficulty.
 */
const sampleQuestions = (questions, count, difficulty = null) => {
  let pool = difficulty
    ? questions.filter((q) => q.difficulty === difficulty)
    : [...questions];

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
};

/**
 * Strip correct_answer + explanation from questions for a live test session.
 * Returns sanitised questions safe to send to frontend.
 */
const sanitiseForTest = (questions) =>
  questions.map(({ correct_answer, explanation, ...rest }) => rest);

/**
 * Build answer key: { question_id -> { correct_answer, explanation } }
 */
const buildAnswerKey = (questions) => {
  const key = {};
  questions.forEach((q) => {
    key[q.question_id] = {
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    };
  });
  return key;
};

module.exports = {
  getMasterIndex,
  getFullPaperIndex,
  getSubjectPaperIndex,
  getTopicBankIndex,
  loadFullPaper,
  loadSubjectPaper,
  loadTopicBank,
  sampleQuestions,
  sanitiseForTest,
  buildAnswerKey,
  loadLiveTestPaper,
  getLiveTestPaperIndex,
  DATASET_PATH,
};
