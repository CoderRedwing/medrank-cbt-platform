/**
 * Analysis Engine
 * Computes subject/topic/difficulty breakdowns, weak areas,
 * and exam-weighted focus suggestions from a list of question responses.
 */

// NEET PG exam weightage (% of total questions typically)
const EXAM_WEIGHTAGE = {
  Medicine:          15,
  Surgery:           12.5,
  Pathology:         7.5,
  Pharmacology:      7.5,
  OBGYN:             6,
  Microbiology:      5,
  Pediatrics:        5,
  PSM:               5,
  Anatomy:           4,
  Physiology:        4,
  Biochemistry:      3.5,
  ENT:               2.5,
  Ophthalmology:     2.5,
  Orthopedics:       2.5,
  Psychiatry:        2.5,
  Radiology:         2,
  Anaesthesia:       2,
  Dermatology:       2,
  'Forensic Medicine': 1.5,
};

// Scoring constants
const MARKS_CORRECT   = 4;
const MARKS_INCORRECT = -1;
const MARKS_UNANSWERED = 0;

/**
 * Main analysis function.
 * @param {Array} responses - Array of questionResponse objects with correct_answer filled in
 * @returns {Object} Full analysis result
 */
const computeAnalysis = (responses) => {
  const subjectMap = {};  // subject -> stats
  const topicMap   = {};  // 'subject::topic' -> stats
  const diffMap    = {};  // difficulty -> stats

  let totalCorrect   = 0;
  let totalIncorrect = 0;
  let totalUnattempted = 0;
  let rawScore = 0;
  let maxScore = responses.length * MARKS_CORRECT;

  const processedResponses = responses.map((r) => {
    const isAttempted = r.selected_answer !== null && r.selected_answer !== undefined;
    const isCorrect   = isAttempted && r.selected_answer === r.correct_answer;
    let marks = MARKS_UNANSWERED;
    if (isAttempted) marks = isCorrect ? MARKS_CORRECT : MARKS_INCORRECT;

    if (isCorrect)        totalCorrect++;
    else if (isAttempted) totalIncorrect++;
    else                  totalUnattempted++;
    rawScore += marks;

    // ─── Subject bucket ───────────────────────────────────────────────
    const subj = r.subject || 'Unknown';
    if (!subjectMap[subj]) {
      subjectMap[subj] = { correct: 0, incorrect: 0, unattempted: 0, total: 0, score: 0 };
    }
    subjectMap[subj].total++;
    subjectMap[subj].score += marks;
    if (isCorrect)        subjectMap[subj].correct++;
    else if (isAttempted) subjectMap[subj].incorrect++;
    else                  subjectMap[subj].unattempted++;

    // ─── Topic bucket ─────────────────────────────────────────────────
    const topicKey = `${subj}::${r.topic || 'General'}`;
    if (!topicMap[topicKey]) {
      topicMap[topicKey] = {
        subject: subj, topic: r.topic || 'General',
        correct: 0, incorrect: 0, unattempted: 0, total: 0, score: 0,
      };
    }
    topicMap[topicKey].total++;
    topicMap[topicKey].score += marks;
    if (isCorrect)        topicMap[topicKey].correct++;
    else if (isAttempted) topicMap[topicKey].incorrect++;
    else                  topicMap[topicKey].unattempted++;

    // ─── Difficulty bucket ────────────────────────────────────────────
    const diff = r.difficulty || 'Moderate';
    if (!diffMap[diff]) {
      diffMap[diff] = { correct: 0, incorrect: 0, unattempted: 0, total: 0 };
    }
    diffMap[diff].total++;
    if (isCorrect)        diffMap[diff].correct++;
    else if (isAttempted) diffMap[diff].incorrect++;
    else                  diffMap[diff].unattempted++;

    return {
      ...r,
      is_correct:   isCorrect,
      is_attempted: isAttempted,
      marks_awarded: marks,
    };
  });

  // ─── Compute accuracy per bucket ──────────────────────────────────────
  const addAccuracy = (bucket) => {
    Object.values(bucket).forEach((b) => {
      const attempted = b.correct + b.incorrect;
      b.accuracy = attempted > 0 ? Math.round((b.correct / attempted) * 100) : 0;
      b.attempted = attempted;
    });
  };
  addAccuracy(subjectMap);
  addAccuracy(topicMap);
  addAccuracy(diffMap);

  // ─── Weak areas (accuracy < 60% with ≥3 questions) ────────────────────
  const weakSubjects = Object.entries(subjectMap)
    .filter(([, v]) => v.attempted >= 3 && v.accuracy < 60)
    .sort((a, b) => a[1].accuracy - b[1].accuracy)
    .map(([k]) => k);

  const weakTopics = Object.entries(topicMap)
    .filter(([, v]) => v.attempted >= 2 && v.accuracy < 50)
    .sort((a, b) => a[1].accuracy - b[1].accuracy)
    .map(([k]) => k);

  // ─── Focus suggestions (weightage × poor accuracy) ───────────────────
  const focusSuggestions = [];

  Object.entries(subjectMap).forEach(([subject, stats]) => {
    if (stats.attempted < 2) return;
    const weightage = EXAM_WEIGHTAGE[subject] || 1;
    const accuracy  = stats.accuracy;
    const priority  =
      accuracy < 40 && weightage >= 5  ? 'critical' :
      accuracy < 60 && weightage >= 3  ? 'high'     :
      accuracy < 70                     ? 'medium'   : null;

    if (priority) {
      focusSuggestions.push({
        subject,
        topic: '',
        reason: `${accuracy}% accuracy in ${subject} (${weightage}% exam weightage)`,
        priority,
      });
    }
  });

  // Also surface poor-accuracy high-weightage topics
  Object.entries(topicMap).forEach(([key, stats]) => {
    if (stats.attempted < 2 || stats.accuracy >= 70) return;
    const weightage = EXAM_WEIGHTAGE[stats.subject] || 1;
    if (weightage >= 5 && stats.accuracy < 50) {
      focusSuggestions.push({
        subject: stats.subject,
        topic:   stats.topic,
        reason:  `Only ${stats.accuracy}% accuracy in ${stats.topic} (${stats.subject})`,
        priority: stats.accuracy < 30 ? 'critical' : 'high',
      });
    }
  });

  // Sort: critical first, then high, then medium
  const priorityOrder = { critical: 0, high: 1, medium: 2 };
  focusSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const attempted = totalCorrect + totalIncorrect;
  const overallAccuracy = attempted > 0
    ? Math.round((totalCorrect / attempted) * 100)
    : 0;

  return {
    processedResponses,
    score: {
      raw:     rawScore,
      max:     maxScore,
      percent: maxScore > 0 ? Math.round((rawScore / maxScore) * 100 * 10) / 10 : 0,
    },
    correct_count:     totalCorrect,
    incorrect_count:   totalIncorrect,
    unattempted_count: totalUnattempted,
    accuracy:          overallAccuracy,
    subject_analysis:  subjectMap,
    topic_analysis:    topicMap,
    difficulty_analysis: diffMap,
    weak_subjects:     weakSubjects,
    weak_topics:       weakTopics,
    focus_suggestions: focusSuggestions.slice(0, 10),
  };
};

/**
 * Merge a new test analysis into user's cumulative stats.
 */
const mergeIntoUserStats = (currentStats, newAnalysis, totalQuestions) => {
  const s = currentStats || {};

  s.totalTestsTaken             = (s.totalTestsTaken || 0) + 1;
  s.totalQuestionsAttempted     = (s.totalQuestionsAttempted || 0) + totalQuestions;
  s.totalCorrect                = (s.totalCorrect || 0) + newAnalysis.correct_count;
  s.totalIncorrect              = (s.totalIncorrect || 0) + newAnalysis.incorrect_count;
  s.totalScore                  = (s.totalScore || 0) + newAnalysis.score.raw;

  const totalAttempted = s.totalCorrect + s.totalIncorrect;
  s.averageAccuracy = totalAttempted > 0
    ? Math.round((s.totalCorrect / totalAttempted) * 100)
    : 0;
  s.averageScore = s.totalTestsTaken > 0
    ? Math.round(s.totalScore / s.totalTestsTaken)
    : 0;

  // Merge subject accuracy
  if (!s.subjectAccuracy) s.subjectAccuracy = {};
  Object.entries(newAnalysis.subject_analysis).forEach(([subj, data]) => {
    if (!s.subjectAccuracy[subj]) {
      s.subjectAccuracy[subj] = { correct: 0, attempted: 0 };
    }
    s.subjectAccuracy[subj].correct  += data.correct;
    s.subjectAccuracy[subj].attempted += data.attempted;
  });

  // Merge topic accuracy
  if (!s.topicAccuracy) s.topicAccuracy = {};
  Object.entries(newAnalysis.topic_analysis).forEach(([key, data]) => {
    if (!s.topicAccuracy[key]) {
      s.topicAccuracy[key] = { correct: 0, attempted: 0 };
    }
    s.topicAccuracy[key].correct  += data.correct;
    s.topicAccuracy[key].attempted += data.attempted;
  });

  return s;
};

module.exports = { computeAnalysis, mergeIntoUserStats, EXAM_WEIGHTAGE };
