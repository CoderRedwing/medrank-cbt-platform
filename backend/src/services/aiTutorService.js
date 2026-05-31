/**
 * AI Tutor Service (Phase 3)
 * Uses Anthropic Claude API to:
 *  1. Explain why an answer is correct (deep clinical explanation)
 *  2. Check student's reasoning for knowledge vs. guess
 *  3. Generate new unique MCQs (full paper / subject / topic wise)
 *  4. Answer free-form clinical questions
 */

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL  = 'claude-sonnet-4-20250514';

// ─── 1. Deep explanation of a question ───────────────────────────────────────

const explainQuestion = async ({ question_text, options, correct_answer, explanation, subject, topic }) => {
  const optionLines = Object.entries(options)
    .map(([k, v]) => `  ${k}. ${v}`)
    .join('\n');

  const prompt = `You are an expert NEET PG / INI-CET medical educator.

Question: ${question_text}

Options:
${optionLines}

Correct Answer: ${correct_answer}. ${options[correct_answer]}
Existing Explanation: ${explanation}

Subject: ${subject} | Topic: ${topic || 'N/A'}

Provide a thorough clinical teaching explanation covering:
1. **Why the correct answer is right** — the core concept, mechanism, or fact
2. **Why each wrong option is wrong** — one clear sentence per option
3. **High-yield memory tip** — a mnemonic, pattern, or clinical pearl
4. **Exam pattern note** — how this type of question is commonly tested in NEET PG

Keep the tone like a friendly senior resident teaching a junior. Be precise and concise.`;

  const response = await client.messages.create({
    model:      MODEL,
    max_tokens: 900,
    messages:   [{ role: 'user', content: prompt }],
  });

  return response.content[0].text;
};

// ─── 2. Verify student reasoning (knowledge vs. guess) ────────────────────────

const verifyReasoning = async ({ question_text, correct_answer, options, student_reason, subject }) => {
  if (!student_reason?.trim()) {
    return {
      knowledge_verified: false,
      confidence: 'not_provided',
      feedback: 'No reasoning was provided. Always write why you chose your answer — it helps identify gaps.',
    };
  }

  const prompt = `You are an NEET PG examiner assessing a student's understanding.

Question: ${question_text}
Correct Answer: ${correct_answer}. ${options[correct_answer]}
Student's Reasoning: "${student_reason}"
Subject: ${subject}

Assess whether the student genuinely understood the concept or was guessing.

Respond ONLY in this JSON format (no markdown fences, no preamble):
{
  "knowledge_verified": true/false,
  "confidence": "strong_knowledge" | "partial_knowledge" | "guess" | "wrong_reasoning",
  "feedback": "One concise sentence of feedback for the student (max 120 chars)"
}`;

  const response = await client.messages.create({
    model:      MODEL,
    max_tokens: 200,
    messages:   [{ role: 'user', content: prompt }],
  });

  try {
    const raw = response.content[0].text.trim();
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      knowledge_verified: false,
      confidence: 'unknown',
      feedback: 'Could not parse reasoning assessment. Try again.',
    };
  }
};

// ─── 3. Generate new MCQs ─────────────────────────────────────────────────────

const generateMCQs = async ({ subject, topic, count = 10, difficulty = 'Moderate', context = '' }) => {
  const difficultyGuide = {
    Easy:       'direct recall, textbook fact',
    Moderate:   'clinical scenario, single-step reasoning',
    Hard:       'complex scenario, multi-step reasoning, exceptions',
    'Very Hard':'integration across subjects, tricky distractors, recent exam pattern',
  };

  const prompt = `You are an expert NEET PG question setter. Generate ${count} high-quality MCQs.

Subject: ${subject}
Topic: ${topic || 'Mixed'}
Difficulty: ${difficulty} (${difficultyGuide[difficulty] || 'moderate'})
${context ? `Additional context: ${context}` : ''}

Rules:
- Each question must be completely unique — no repetition of concepts
- All 4 options must be plausible (avoid obviously wrong distractors)
- Correct answer must be unambiguously correct
- Explanation must include WHY the correct answer is right AND a one-line note on each wrong option
- Clinical scenario questions preferred for Moderate/Hard
- Cover different subtopics within the given topic

Respond ONLY as a valid JSON array (no markdown fences, no preamble, no trailing text):
[
  {
    "question_text": "...",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "correct_answer": "A",
    "explanation": "...",
    "subtopic": "..."
  },
  ...
]`;

  const response = await client.messages.create({
    model:      MODEL,
    max_tokens: 4000,
    messages:   [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim();
  const clean = raw.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('AI returned malformed JSON for MCQ generation');
  }

  // Stamp with metadata
  const { v4: uuidv4 } = require('uuid');
  return parsed.map((q) => ({
    question_id:      `AI_${uuidv4().slice(0, 8).toUpperCase()}`,
    paper_type:       'ai_generated',
    paper_ref:        `AI_${subject}_${topic || 'MIXED'}`,
    subject,
    topic:            topic || 'Mixed',
    subtopic:         q.subtopic || null,
    difficulty,
    question_type:    'single_best_answer',
    image_based:      false,
    marks_correct:    4,
    marks_incorrect:  -1,
    marks_unanswered: 0,
    question_text:    q.question_text,
    options:          q.options,
    correct_answer:   q.correct_answer,
    explanation:      q.explanation,
  }));
};

// ─── 4. Free-form clinical question ──────────────────────────────────────────

const askTutor = async (conversationHistory, userMessage, context = {}) => {
  const systemPrompt = `You are an expert NEET PG / INI-CET medical tutor — knowledgeable, concise, and encouraging.

You help MBBS students understand concepts for NEET PG preparation.
${context.subject ? `Current subject focus: ${context.subject}` : ''}
${context.topic   ? `Current topic: ${context.topic}` : ''}

Guidelines:
- Answer clearly and precisely — no fluff
- Use structured formatting (numbered lists, bold key terms) when helpful
- Always link explanations to exam relevance
- Provide mnemonics or memory hooks where useful
- If asked to generate a question, produce it in the same format as NEET PG MCQs
- Stay factual — never fabricate clinical data`;

  const messages = [
    ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await client.messages.create({
    model:      MODEL,
    max_tokens: 1000,
    system:     systemPrompt,
    messages,
  });

  return response.content[0].text;
};

module.exports = { explainQuestion, verifyReasoning, generateMCQs, askTutor };
