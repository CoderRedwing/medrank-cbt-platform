import { create } from 'zustand';
import { testAPI } from '../services/api';

const useTestStore = create((set, get) => ({
  // Active session
  sessionId:      null,
  sessionMeta:    null,   // { test_type, paper_title, duration_allowed_sec, total_questions }
  questions:      [],
  responses:      {},     // { question_id: { selected_answer, student_reason, time_spent_sec, marked_review } }
  currentIndex:   0,
  timeRemainingS: 0,
  status:         'idle', // idle | loading | active | submitting | submitted

  // Paper list
  papers:         null,
  papersLoading:  false,

  // Post-submit analysis
  analysis:       null,

  error: null,

  /* ── Load available papers ─────────────────────────────────────── */
  fetchPapers: async () => {
    set({ papersLoading: true });
    try {
      const { data } = await testAPI.listPapers();
      set({ papers: data.data, papersLoading: false });
    } catch (err) {
      set({ papersLoading: false, error: err.response?.data?.message });
    }
  },

  /* ── Start a new test ──────────────────────────────────────────── */
  startTest: async (options) => {
    set({ status: 'loading', error: null });
    try {
      const { data } = await testAPI.startTest(options);
      const session = data.data;

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

      set({
        sessionId:      session.session_id,
        sessionMeta: {
          test_type:           session.test_type,
          paper_title:         session.paper_title,
          paper_ref:           session.paper_ref,
          subject:             session.subject,
          topic:               session.topic,
          duration_allowed_sec: session.duration_allowed_sec,
          total_questions:     session.total_questions,
        },
        questions:      session.questions,
        responses,
        currentIndex:   0,
        timeRemainingS: session.duration_allowed_sec,
        status:         'active',
        analysis:       null,
      });
      return { success: true, sessionId: session.session_id };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start test';
      set({ status: 'idle', error: msg });
      return { success: false, message: msg };
    }
  },

  /* ── Answer a question ─────────────────────────────────────────── */
  selectAnswer: (questionId, answer) => {
    const { responses, sessionId } = get();
    const updated = {
      ...responses,
      [questionId]: { ...responses[questionId], selected_answer: answer },
    };
    set({ responses: updated });
    // Auto-save to backend (fire-and-forget)
    testAPI.saveResponse(sessionId, {
      question_id:     questionId,
      selected_answer: answer,
    }).catch(() => {});
  },

  /* ── Save student reason ───────────────────────────────────────── */
  saveReason: (questionId, reason) => {
    const { responses } = get();
    set({
      responses: {
        ...responses,
        [questionId]: { ...responses[questionId], student_reason: reason },
      },
    });
  },

  /* ── Toggle review mark ────────────────────────────────────────── */
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

  /* ── Navigation ────────────────────────────────────────────────── */
  goTo:     (idx) => set({ currentIndex: idx }),
  goNext:   ()    => set((s) => ({ currentIndex: Math.min(s.currentIndex + 1, s.questions.length - 1) })),
  goPrev:   ()    => set((s) => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),

  /* ── Tick timer ────────────────────────────────────────────────── */
  tickTimer: () => set((s) => ({ timeRemainingS: Math.max(s.timeRemainingS - 1, 0) })),

  /* ── Submit test ───────────────────────────────────────────────── */
  submitTest: async (timeTakenSec) => {
    const { sessionId, responses, status } = get();
    if (status === 'submitting' || status === 'submitted') return;
    set({ status: 'submitting' });
    try {
      const responsesList = Object.entries(responses).map(([question_id, r]) => ({
        question_id,
        ...r,
      }));
      const { data } = await testAPI.submitTest(sessionId, {
        responses: responsesList,
        time_taken_sec: timeTakenSec,
      });
      // Fetch full analysis
      const { data: analysisData } = await testAPI.getAnalysis(sessionId);
      set({ status: 'submitted', analysis: analysisData.data });
      return { success: true };
    } catch (err) {
      set({ status: 'active', error: err.response?.data?.message });
      return { success: false };
    }
  },

  /* ── Reset ─────────────────────────────────────────────────────── */
  reset: () => set({
    sessionId: null, sessionMeta: null, questions: [], responses: {},
    currentIndex: 0, timeRemainingS: 0, status: 'idle', analysis: null, error: null,
  }),
}));

export default useTestStore;
