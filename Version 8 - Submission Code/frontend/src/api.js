const API_BASE = 'http://localhost:8000';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) throw new Error(data?.detail || data?.message || 'Request failed');
  return data;
}



async function requestBlob(path) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail || 'Download failed');
  }
  return response.blob();
}

export async function registerUser(payload) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

export async function login(username, password) {
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.detail || 'Login failed');
  return data;
}

export const api = {
  me: () => request('/auth/me'),
  health: () => request('/health'),
  listConversations: () => request('/conversations'),
  createConversation: () => request('/conversations', { method: 'POST' }),
  deleteConversation: (conversationId) => request(`/conversations/${conversationId}`, { method: 'DELETE' }),
  getMessages: (conversationId) => request(`/conversations/${conversationId}/messages`),
  sendMessage: (payload) => request('/chat', { method: 'POST', body: JSON.stringify(payload) }),
  listDocuments: () => request('/documents'),
  uploadDocument: (formData) => request('/documents/upload', { method: 'POST', body: formData, headers: {} }),
  previewDocument: (documentId) => request(`/documents/${documentId}/preview`),
  downloadDocumentBlob: (documentId) => requestBlob(`/documents/${documentId}/download`),
  updateDocument: (documentId, payload) => request(`/documents/${documentId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteDocument: (documentId) => request(`/documents/${documentId}`, { method: 'DELETE' }),
  listUsers: () => request('/admin/users'),
  createUser: (payload) => request('/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (id, payload) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  listFaqs: () => request('/faqs'),
  createFaq: (payload) => request('/faqs', { method: 'POST', body: JSON.stringify(payload) }),
  updateFaq: (faqId, payload) => request(`/faqs/${faqId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteFaq: (faqId) => request(`/faqs/${faqId}`, { method: 'DELETE' }),
  listReminders: () => request('/reminders'),
  createReminder: (payload) => request('/reminders', { method: 'POST', body: JSON.stringify(payload) }),
  updateReminder: (id, payload) => request(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteReminder: (id) => request(`/reminders/${id}`, { method: 'DELETE' }),
};
