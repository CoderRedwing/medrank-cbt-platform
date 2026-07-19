import { create } from 'zustand';
import { testAPI } from '../services/api';

const FULL_PAPER_SECTIONS  = 5;
const FULL_PAPER_Q_PER_SEC = 40;       // 200 / 5
const SECTION_DURATION     = 42 * 60;  // 2520 s per section (42 min)

/* ─────────────────────────────────────────────────────────────────
   isFullPaper — true only for NEET PG full mock papers that need
   the 5-section timed structure.

   Detects by test_type string (primary) with a 200-question
   fallback so old sessions still work.
───────────────────────────────────────────────────────────────── */
function isFullPaper(testType, questionCount) {
  if (testType) {
    const t = testType.toLowerCase();
    // Matches: "full_paper", "full-paper", "full mock", "grand test",
    //          "gt", "full_mock", "neet_pg_full", etc.
    if (
      t.includes('full') ||
      t.includes('grand') ||
      t === 'gt' ||
      t.includes('mock_paper') ||
      t.includes('mock paper')
    ) return true;

    // Explicit non-full types — always single section
    if (
      t.includes('subject') ||
      t.includes('topic') ||
      t.includes('chapter') ||
      t.includes('practice') ||
      t.includes('custom') ||
      t.includes('mini')
    ) return false;
  }

  // Fallback: only treat as full paper if exactly 200 questions
  return questionCount === 200;
}

/* ─────────────────────────────────────────────────────────────────
   buildSections — creates the section array for the store.
   Full papers  → 5 locked sections of 40 Qs × 42 min each.
   Everything else → 1 single section, duration scaled to Q count.
───────────────────────────────────────────────────────────────── */
function buildSections(questions, testType) {
  const total    = questions.length;
  const fullPaper = isFullPaper(testType, total);

  if (fullPaper) {
    const qPerSec   = Math.ceil(total / FULL_PAPER_SECTIONS); // normally 40
    return Array.from({ length: FULL_PAPER_SECTIONS }, (_, i) => ({
      id:              i + 1,
      label:           `Section ${i + 1}`,
      questionIds:     questions
                         .slice(i * qPerSec, (i + 1) * qPerSec)
                         .map((q) => q.question_id),
      timeRemainingS:  SECTION_DURATION,
      initialDurationS: SECTION_DURATION,
      status:          i === 0 ? 'active' : 'locked',
    }));
  }

  // ── Single section for subject / topic / practice / mini tests ──
  // Scale: 1 min per question, minimum 10 min, max 210 min (3.5 h)
  const scaledDuration = Math.min(
    210 * 60,
    Math.max(10 * 60, total * 60)
  );

  return [{
    id:               1,
    label:            'Section 1',
    questionIds:      questions.map((q) => q.question_id),
    timeRemainingS:   scaledDuration,
    initialDurationS: scaledDuration,
    status:           'active',
  }];
}

/* ═════════════════════════════════════════════════════════════════
   STORE
═════════════════════════════════════════════════════════════════ */
const useTestStore = create((set, get) => ({

  // ── Active session ──────────────────────────────────────────────
  sessionId:             null,
  sessionMeta:           null,
  questions:             [],
  responses:             {},
  currentIndex:          0,
  status:                'idle', // idle | loading | active | submitting | submitted

  // ── Section state ───────────────────────────────────────────────
  sections:              [],
  currentSectionIndex:   0,
  showSectionTransition: false,
  sectionAutoAdvanced:   false,

  // ── Paper list ──────────────────────────────────────────────────
  papers:                null,
  papersLoading:         false,

  // ── Post-submit ─────────────────────────────────────────────────
  analysis:              null,
  error:                 null,
  _startEpoch:           null,

  /* ── Load available papers ────────────────────────────────────── */
  fetchPapers: async () => {
    set({ papersLoading: true });
    try {
      const { data } = await testAPI.listPapers();
      set({ papers: data.data, papersLoading: false });
    } catch (err) {
      set({ papersLoading: false, error: err.response?.data?.message });
    }
  },

  /* ── Start a new test ─────────────────────────────────────────── */
  startTest: async (options) => {
    const { status } = get();
  if (status === 'active' || status === 'loading' || status === 'submitting') {
    console.warn('startTest blocked — test already in progress');
    return { success: false, message: 'Test already in progress' };
  }
    set({ status: 'loading', error: null });
    try {
      const { data } = await testAPI.startTest(options);
      const session  = data.data;

      // Initialise response map
      const responses = {};
      session.questions.forEach((q) => {
        responses[q.question_id] = {
          selected_answer: null,
          student_reason:  '',
          time_spent_sec:  0,
          marked_review:   false,
        };
      });

      // ← test_type drives section structure
      const sections = buildSections(session.questions, session.test_type);

      set({
        sessionId:   session.session_id,
        sessionMeta: {
          test_type:            session.test_type,
          paper_title:          session.paper_title,
          paper_ref:            session.paper_ref,
          subject:              session.subject,
          topic:                session.topic,
          duration_allowed_sec: session.duration_allowed_sec,
          total_questions:      session.total_questions,
        },
        questions:             session.questions,
        responses,
        sections,
        currentSectionIndex:   0,
        currentIndex:          0,
        status:                'active',
        showSectionTransition: false,
        sectionAutoAdvanced:   false,
        analysis:              null,
        error:                 null,
        _startEpoch:           Date.now(),
      });

      return { success: true, sessionId: session.session_id };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start test';
      set({ status: 'idle', error: msg });
      return { success: false, message: msg };
    }
  },


  /* ── Load an already-created session (e.g. from AI Tutor's
     generate-and-start flow) using the same setup as startTest ──── */
loadExternalSession: (session) => {
  const { status } = get();
  if (status === 'active' || status === 'loading' || status === 'submitting') {
    console.warn('loadExternalSession blocked — test already in progress');
    return { success: false, message: 'Test already in progress' };
  }

  const responses = {};
  session.questions.forEach((q) => {
    responses[q.question_id] = {
      selected_answer: null,
      student_reason:  '',
      time_spent_sec:  0,
      marked_review:   false,
    };
  });

  const sections = buildSections(session.questions, session.test_type);

  set({
    sessionId:   session.session_id,
    sessionMeta: {
      test_type:            session.test_type,
      paper_title:          session.paper_title,
      paper_ref:            session.paper_ref,
      subject:              session.subject,
      topic:                session.topic,
      duration_allowed_sec: session.duration_allowed_sec,
      total_questions:      session.total_questions,
    },
    questions:             session.questions,
    responses,
    sections,
    currentSectionIndex:   0,
    currentIndex:          0,
    status:                'active',
    showSectionTransition: false,
    sectionAutoAdvanced:   false,
    analysis:              null,
    error:                 null,
    _startEpoch:           Date.now(),
  });

  return { success: true, sessionId: session.session_id };
},

  /* ── Start (or resume) the currently scheduled live test ──────── */
  startLiveTest: async () => {
    const { status } = get();
    if (status === 'active' || status === 'loading' || status === 'submitting') {
      console.warn('startLiveTest blocked — test already in progress');
      return { success: false, message: 'Test already in progress' };
    }
    set({ status: 'loading', error: null });
    try {
      const { data } = await testAPI.startLiveTest();
      const session  = data.data;

      const responses = {};
      session.questions.forEach((q) => {
        responses[q.question_id] = {
          selected_answer: null,
          student_reason:  '',
          time_spent_sec:  0,
          marked_review:   false,
        };
      });

      const sections = buildSections(session.questions, session.test_type || 'live_test');

      set({
        sessionId:   session.session_id,
        sessionMeta: {
          test_type:            session.test_type || 'live_test',
          paper_title:          session.paper_title,
          paper_ref:            session.paper_ref,
          subject:              session.subject,
          topic:                session.topic,
          duration_allowed_sec: session.duration_allowed_sec,
          total_questions:      session.total_questions,
        },
        questions:             session.questions,
        responses,
        sections,
        currentSectionIndex:   0,
        currentIndex:          0,
        status:                'active',
        showSectionTransition: false,
        sectionAutoAdvanced:   false,
        analysis:              null,
        error:                 null,
        _startEpoch:           Date.now(),
      });

      return { success: true, sessionId: session.session_id };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start live test';
      set({ status: 'idle', error: msg });
      return { success: false, message: msg };
    }
  },

  /* ── Internal: absolute start index of a given section ──────── */
  _sectionStart: (sectionIdx) => {
    const { sections } = get();
    let start = 0;
    for (let i = 0; i < sectionIdx; i++) {
      start += sections[i]?.questionIds?.length ?? 0;
    }
    return start;
  },

  /* ── Tick section timer (called every second) ─────────────────── */
  tickSectionTimer: () => {
    const { sections, currentSectionIndex, status } = get();
    if (status !== 'active') return;

    const updated = sections.map((s) => ({ ...s }));
    const sec     = updated[currentSectionIndex];
    if (sec.status !== 'active') return;

    sec.timeRemainingS = Math.max(sec.timeRemainingS - 1, 0);

    if (sec.timeRemainingS <= 0) {
      sec.status = 'submitted';
      const nextIdx = currentSectionIndex + 1;

      if (nextIdx < sections.length) {
        updated[nextIdx] = { ...updated[nextIdx], status: 'active' };
        const nextStart = get()._sectionStart(nextIdx);
        set({
          sections:              updated,
          currentSectionIndex:   nextIdx,
          currentIndex:          nextStart,
          showSectionTransition: true,
          sectionAutoAdvanced:   true,
        });
      } else {
        set({ sections: updated });
        get().submitTest(get()._calcTimeTaken());
      }
    } else {
      set({ sections: updated });
    }
  },

  /* ── Manually submit current section & advance ──────────────── */
  submitSection: () => {
    const { sections, currentSectionIndex } = get();
    const updated = sections.map((s) => ({ ...s }));

    updated[currentSectionIndex].status = 'submitted';

    const nextIdx = currentSectionIndex + 1;
    if (nextIdx < sections.length) {
      updated[nextIdx] = { ...updated[nextIdx], status: 'active' };
      const nextStart = get()._sectionStart(nextIdx);
      set({
        sections:              updated,
        currentSectionIndex:   nextIdx,
        currentIndex:          nextStart,
        showSectionTransition: true,
        sectionAutoAdvanced:   false,
      });
    } else {
      set({ sections: updated });
      get().submitTest(get()._calcTimeTaken());
    }
  },

  /* ── Dismiss section transition modal ────────────────────────── */
  dismissSectionTransition: () => {
    set({ showSectionTransition: false, sectionAutoAdvanced: false });
  },

  /* ── Helpers ─────────────────────────────────────────────────── */
  getCurrentSectionQuestions: () => {
    const { questions, sections, currentSectionIndex } = get();
    const start = get()._sectionStart(currentSectionIndex);
    const count = sections[currentSectionIndex]?.questionIds.length ?? questions.length;
    return questions.slice(start, start + count);
  },

  getCurrentSectionLocalIndex: () => {
    const { currentIndex, currentSectionIndex } = get();
    return currentIndex - get()._sectionStart(currentSectionIndex);
  },

  /* ── Answer a question ───────────────────────────────────────── */
  selectAnswer: (questionId, answer) => {
    const { responses, sessionId } = get();
    const updated = {
      ...responses,
      [questionId]: { ...responses[questionId], selected_answer: answer },
    };
    set({ responses: updated });
    testAPI.saveResponse(sessionId, {
      question_id:     questionId,
      selected_answer: answer,
    }).catch(() => {});
  },

  /* ── Save student reason ─────────────────────────────────────── */
  saveReason: (questionId, reason) => {
    const { responses } = get();
    set({
      responses: {
        ...responses,
        [questionId]: { ...responses[questionId], student_reason: reason },
      },
    });
  },

  /* ── Toggle review mark ──────────────────────────────────────── */
  toggleReview: (questionId) => {
    const { responses, sessionId } = get();
    const current = responses[questionId]?.marked_review || false;
    const updated = {
      ...responses,
      [questionId]: { ...responses[questionId], marked_review: !current },
    };
    set({ responses: updated });
    testAPI.saveResponse(sessionId, {
      question_id:   questionId,
      marked_review: !current,
    }).catch(() => {});
  },

  /* ── Navigation (locked to current section window) ───────────── */
  goTo: (idx) => {
    const { currentSectionIndex, sections } = get();
    const sec = sections[currentSectionIndex];
    if (!sec || sec.status !== 'active') return;

    const start = get()._sectionStart(currentSectionIndex);
    const end   = start + sec.questionIds.length - 1;
    if (idx >= start && idx <= end) set({ currentIndex: idx });
  },

  goNext: () => {
    const { currentIndex, currentSectionIndex, sections } = get();
    const start      = get()._sectionStart(currentSectionIndex);
    const sectionEnd = start + sections[currentSectionIndex].questionIds.length - 1;
    if (currentIndex < sectionEnd) set({ currentIndex: currentIndex + 1 });
  },

  goPrev: () => {
    const { currentIndex, currentSectionIndex } = get();
    const sectionStart = get()._sectionStart(currentSectionIndex);
    if (currentIndex > sectionStart) set({ currentIndex: currentIndex - 1 });
  },

  /* ── Time tracking ───────────────────────────────────────────── */
  _calcTimeTaken: () => {
    const { _startEpoch } = get();
    return _startEpoch ? Math.floor((Date.now() - _startEpoch) / 1000) : 0;
  },

  /* ── Submit final test ───────────────────────────────────────── */
  submitTest: async (timeTakenSec) => {
  const { sessionId, responses, status, sessionMeta } = get();
  if (status === 'submitting' || status === 'submitted') return;
  set({ status: 'submitting', error: null });

  const responsesList = Object.entries(responses).map(([question_id, r]) => ({
    question_id,
    selected_answer: r.selected_answer,
    marked_review:   r.marked_review,
    time_spent_sec:  r.time_spent_sec,
    ...(r.student_reason?.trim() ? { student_reason: r.student_reason } : {}),
  }));
  const payload = { responses: responsesList, time_taken_sec: timeTakenSec };
  const submitFn = sessionMeta?.test_type === 'live_test'
    ? () => testAPI.submitLiveTest(sessionId, payload)
    : () => testAPI.submitTest(sessionId, payload);

  let submitSucceeded = false;

  // Retry ONLY the submit call
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await submitFn();
      submitSucceeded = true;
      break;
    } catch (err) {
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
      console.warn(`Submit attempt ${attempt}/3 failed:`, err.message);
      if (attempt === 3 || !isTimeout) {
        set({ status: 'active', error: err.response?.data?.message || 'Submission failed. Please try again.' });
        return { success: false };
      }
      await new Promise((res) => setTimeout(res, 2000));
    }
  }

  if (!submitSucceeded) return { success: false };

  // Fetch analysis SEPARATELY — don't retry-resubmit if this fails
  try {
    const { data: analysisData } = await testAPI.getAnalysis(sessionId);
    set({ status: 'submitted', analysis: analysisData.data });
    return { success: true };
  } catch (err) {
    console.warn('Analysis fetch failed (submit was OK):', err.message);
    // Submit DID succeed — mark as submitted anyway, analysis can be refetched on the analysis page
    set({ status: 'submitted', analysis: null });
    return { success: true };
  }
},

  /* ── Reset ───────────────────────────────────────────────────── */
  reset: () => set({
    sessionId:             null,
    sessionMeta:           null,
    questions:             [],
    responses:             {},
    currentIndex:          0,
    status:                'idle',
    sections:              [],
    currentSectionIndex:   0,
    showSectionTransition: false,
    sectionAutoAdvanced:   false,
    analysis:              null,
    error:                 null,
    _startEpoch:           null,
  }),
}));

export default useTestStore;