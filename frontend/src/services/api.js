import axios from 'axios';

const api = axios.create({

  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('neet_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler → clear token
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute = err.config?.url?.includes('/auth/login') ||
                        err.config?.url?.includes('/auth/register') ||
                        err.config?.url?.includes('/auth/reset-password');

    if (err.response?.status === 401 && !isAuthRoute) {
      // Only redirect if it's a protected route with expired/missing token
      localStorage.removeItem('neet_token');
      window.location.href = '/login';
    }

    return Promise.reject(err);  // ✅ let login page handle its own errors
  }
);

/* ── Auth ─────────────────────────────────────────────────────────── */
export const authAPI = {
  register: (data)    => api.post('/auth/register', data),  
  login:    (data)    => api.post('/auth/login', data),
  getMe:    ()        => api.get('/auth/me', { timeout: 8000 }),
  updateMe: (data)    => api.patch('/auth/me', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),  
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
  saveApiKey:   (provider, api_key, set_active) => api.post('/auth/api-key', { provider, api_key, set_active }),
  removeApiKey: (provider) => api.delete(`/auth/api-key/${provider}`),
  setActiveApiKeyProvider: (provider) => api.patch('/auth/api-key/active', { provider }),
};

/* ── Tests ────────────────────────────────────────────────────────── */
export const testAPI = {
  listPapers:   ()                        => api.get('/tests/papers'),
  startTest:    (body)                    => api.post('/tests/start', body),
  saveResponse: (sessionId, body)         => api.patch(`/tests/${sessionId}/response`, body),
  submitTest:   (sessionId, body)         => api.post(`/tests/${sessionId}/submit`, body, { timeout: 120000 }),
  getHistory:   (page = 1, limit = 20)   => api.get(`/tests/history?page=${page}&limit=${limit}`),
  getSession:   (sessionId)              => api.get(`/tests/${sessionId}`),
  getAnalysis:  (sessionId)  => api.get(`/tests/${sessionId}/analysis`, { timeout: 60000 }),
  getLiveTest:    ()             => api.get('/tests/live'),
  registerLiveTest: ()           => api.post('/tests/live/register'),
  startLiveTest:  ()             => api.post('/tests/live/start'),
  submitLiveTest: (sessionId, body) => api.post(`/tests/live/submit/${sessionId}`, body, { timeout: 120000 }),
};

export const notificationAPI = {
  list: (params = {}) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
  clearAll: (readOnly = false) => api.delete('/notifications', { params: readOnly ? { readOnly: 'true' } : {} }),
};

/* ── Dashboard ────────────────────────────────────────────────────── */
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

/* ── Streaming AI chat (SSE) ─────────────────────────────────────────
   Plain fetch + manual ReadableStream read, since axios buffers the
   whole response before resolving. Calls onDelta per text chunk so the
   UI can render progressively, ChatGPT/Claude-style. */
export const streamChatMessage = async ({ message, history, context }, { onDelta, onDone, onError } = {}) => {
  const token = localStorage.getItem('neet_token');
  const baseURL = import.meta.env.VITE_API_URL;

  let res;
  try {
    res = await fetch(`${baseURL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, history, context }),
    });
  } catch {
    onError?.('Network error — could not reach the server.', false);
    return;
  }

  if (!res.ok || !res.body) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch { /* not JSON — keep default message */ }
    onError?.(msg, false);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete trailing line for next chunk

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;

        let json;
        try { json = JSON.parse(payload); } catch { continue; }

        if (json.delta) onDelta?.(json.delta);
        if (json.error) { onError?.(json.error, !!json.isQuotaError); return; }
        if (json.done)  { onDone?.(); return; }
      }
    }
    onDone?.();
  } catch {
    onError?.('Connection to the AI tutor was interrupted.', false);
  }
};

export default api;

/* ── Admin ────────────────────────────────────────────────────────── */
export const adminAPI = {
  // Stats
  getStats: () => api.get('/admin/stats'),

  // Students
  getStudents:      (page=1, limit=30, search='', sort='-createdAt', activity='all') =>
    api.get(`/admin/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&sort=${sort}&activity=${activity}`),
  getStudentDetail: (id)            => api.get(`/admin/students/${id}`),
  updateStudent:    (id, data)      => api.patch(`/admin/students/${id}`, data),
  deleteStudent:    (id)            => api.delete(`/admin/students/${id}`),

  // Tests
  getAllTests: (page=1, limit=30, type='', userId='') =>
    api.get(`/admin/tests?page=${page}&limit=${limit}${type?'&type='+type:''}${userId?'&userId='+userId:''}`),
  deleteTest: (id) => api.delete(`/admin/tests/${id}`),

  // Papers
  listPapers:     (type='full')       => api.get(`/admin/papers?type=${type}`),
  getPaperDetail: (type, id)          => api.get(`/admin/papers/${type}/${id}`),
  editQuestion:   (type, id, body)    => api.patch(`/admin/papers/${type}/${id}/question`, body),
  addQuestion:    (type, id, body)    => api.post(`/admin/papers/${type}/${id}/question`, body),
  deleteQuestion: (type, id, qid)     => api.delete(`/admin/papers/${type}/${id}/question/${qid}`),

  // Admin management
  createAdmin: (data) => api.post('/admin/create-admin', data),

  // Live test scheduling
  listLiveTestPapers: ()          => api.get('/admin/live-tests/papers'),
  getLiveTests:       ()          => api.get('/admin/live-tests'),
  createLiveTest:     (data)      => api.post('/admin/live-tests', data),
  updateLiveTest:     (id, data)  => api.patch(`/admin/live-tests/${id}`, data),
  deleteLiveTest:     (id)        => api.delete(`/admin/live-tests/${id}`),
};