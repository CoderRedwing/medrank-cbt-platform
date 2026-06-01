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
    if (err.response?.status === 401) {
      localStorage.removeItem('neet_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

/* ── Auth ─────────────────────────────────────────────────────────── */
export const authAPI = {
  register: (data)    => api.post('/auth/register', data),
  login:    (data)    => api.post('/auth/login', data),
  getMe:    ()        => api.get('/auth/me', { timeout: 8000 }),
  updateMe: (data)    => api.patch('/auth/me', data),
};

/* ── Tests ────────────────────────────────────────────────────────── */
export const testAPI = {
  listPapers:   ()                        => api.get('/tests/papers'),
  startTest:    (body)                    => api.post('/tests/start', body),
  saveResponse: (sessionId, body)         => api.patch(`/tests/${sessionId}/response`, body),
  submitTest:   (sessionId, body)         => api.post(`/tests/${sessionId}/submit`, body),
  getHistory:   (page = 1, limit = 20)   => api.get(`/tests/history?page=${page}&limit=${limit}`),
  getSession:   (sessionId)              => api.get(`/tests/${sessionId}`),
  getAnalysis:  (sessionId)              => api.get(`/tests/${sessionId}/analysis`),
};

/* ── Dashboard ────────────────────────────────────────────────────── */
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export default api;

/* ── Admin ────────────────────────────────────────────────────────── */
export const adminAPI = {
  // Stats
  getStats: () => api.get('/admin/stats'),

  // Students
  getStudents:      (page=1, limit=30, search='', sort='-createdAt') =>
    api.get(`/admin/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&sort=${sort}`),
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
};
