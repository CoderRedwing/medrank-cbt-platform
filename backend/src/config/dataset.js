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
  DATASET_PATH,
};
