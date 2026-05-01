import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api, login, registerUser } from './api';

function useAuth() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, setUser, signOut };
}

function LoginPage({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (isRegistering) {
        await registerUser({ username, password, full_name: fullName });
      }
      const data = await login(username, password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setSuccess(`Login successful. Welcome back, ${data.user.full_name || data.user.username}.`);
      setTimeout(() => onLoggedIn(data.user), 550);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-badge">Local AI Chatbot</div>
        <h1>{isRegistering ? 'Create student account' : 'Welcome back'}</h1>
        <p className="muted">Dark local-first chatbot with RAG, Ollama, FAISS and FastAPI.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegistering && (
            <label>
              Full name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
            </label>
          )}
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          </label>
          {error && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">{success}</div>}
          <button className="primary-btn" disabled={loading}>{loading ? 'Please wait...' : isRegistering ? 'Create account' : 'Sign in'}</button>
        </form>
        <button className="ghost-btn full-width" onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Back to sign in' : 'Create a new student account'}
        </button>
        <div className="demo-users">
          <strong>Demo accounts:</strong>
          <div>admin / admin123</div>
          <div>student / student123</div>
        </div>
      </div>
    </div>
  );
}

function Protected({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/chat" replace />;
  return children;
}

function Layout({ user, signOut, children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: '/chat', label: 'Chat' },
    ...(user?.role === 'admin' ? [
      { to: '/admin/documents', label: 'Manage Documents' },
      { to: '/admin/faqs', label: 'Manage FAQ' },
      { to: '/admin/users', label: 'Manage Users' },
    ] : []),
    { to: '/reminders', label: 'Reminders' },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-box">Student Support Chatbot</div>
        </div>
        <nav className="nav-list">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-card">
            <div className="avatar">{user.username[0]?.toUpperCase()}</div>
            <div>
              <div className="profile-name">{user.full_name || user.username}</div>
              <div className="muted small">{user.role}</div>
            </div>
          </div>
          <button className="ghost-btn" onClick={() => navigate('/chat')}>Go to Chat</button>
          <button className="ghost-btn" onClick={signOut}>Log out</button>
        </div>
      </aside>
      <main className="page-wrap">
        <header className="page-header">
          <div>
            <h1>{
              location.pathname === '/chat' ? 'Chat' :
              location.pathname === '/reminders' ? 'Reminders' :
              location.pathname.includes('documents') ? 'Manage Documents' :
              location.pathname.includes('users') ? 'Manage Users' :
              location.pathname.includes('faqs') ? 'Manage FAQ' : 'Dashboard'
            }</h1>
            <div className="muted">Local-first student support assistant</div>
          </div>
        </header>
        <section className="page-content">{children}</section>
      </main>
    </div>
  );
}

function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [showFaqs, setShowFaqs] = useState(false);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('quality');
  const [loadingReply, setLoadingReply] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    init();
    loadFaqs();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingReply]);

  const init = async () => {
    try {
      const items = await api.listConversations();
      setConversations(items);
      if (items.length > 0) {
        await loadConversation(items[0].id);
      } else {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadConversation = async (id) => {
    try {
      const msgs = await api.getMessages(id);
      setActiveConversationId(id);
      setMessages(msgs);
      const lastAssistantWithSources = [...msgs].reverse().find((msg) => msg.role === 'assistant' && msg.sources?.length);
      setSources(lastAssistantWithSources?.sources || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadFaqs = async () => {
    try {
      setFaqs(await api.listFaqs());
    } catch (err) {
      // Do not block chat if FAQ loading fails.
    }
  };

  const createNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setSources([]);
    setInput('');
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      const updated = await api.listConversations();
      setConversations(updated);
      if (activeConversationId === id) {
        if (updated.length > 0) {
          await loadConversation(updated[0].id);
        } else {
          createNewChat();
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loadingReply) return;
    const optimistic = { id: `temp-${Date.now()}`, role: 'user', content: trimmed };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setLoadingReply(true);
    setError('');
    try {
      const response = await api.sendMessage({ conversation_id: activeConversationId, message: trimmed, mode });
      const updatedConversations = await api.listConversations();
      const updatedMessages = await api.getMessages(response.conversation_id);
      setConversations(updatedConversations);
      setActiveConversationId(response.conversation_id);
      setMessages(updatedMessages);
      setSources(response.sources || []);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.filter((msg) => msg.id !== optimistic.id));
      setInput(trimmed);
    } finally {
      setLoadingReply(false);
    }
  };

  const downloadDocument = async (documentId, title) => {
    try {
      const blob = await api.downloadDocumentBlob(documentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = title || 'document';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const headerTitle = useMemo(() => conversations.find((c) => c.id === activeConversationId)?.title || 'New chat', [conversations, activeConversationId]);

  return (
    <div className="chat-layout">
      <section className="chat-sidebar-card">
        <button className="primary-btn wide-btn" onClick={createNewChat}>+ New chat</button>
        <div className="conversation-list page-scroll">
          {conversations.length === 0 ? <div className="muted small">No chats yet</div> : conversations.map((c) => (
            <button key={c.id} className={`conversation-item ${c.id === activeConversationId ? 'active' : ''}`} onClick={() => loadConversation(c.id)}>
              <span className="conversation-title">{c.title}</span>
              <span className="delete-chat" onClick={(e) => deleteChat(c.id, e)}>✕</span>
            </button>
          ))}
        </div>
      </section>

      <section className="chat-main-card">
        <div className="topbar inline-topbar">
          <div>
            <h2>{headerTitle}</h2>
            <div className="muted">Multi-chat local RAG assistant</div>
          </div>
          <div className="mode-switcher">
            <button className="mode-btn" onClick={() => setShowFaqs(true)}>View FAQs</button>
            <button className={mode === 'fast' ? 'mode-btn active' : 'mode-btn'} onClick={() => setMode('fast')}>Fast</button>
            <button className={mode === 'quality' ? 'mode-btn active' : 'mode-btn'} onClick={() => setMode('quality')}>Quality</button>
          </div>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <div className="chat-columns">
          <div className="messages page-scroll">
            {messages.length === 0 ? (
              <div className="empty-state compact-empty">
                <h2>How can I help today?</h2>
                <p>Ask a question in any supported language. The chatbot can use uploaded documents and FAQ content to answer.</p>
              </div>
            ) : messages.map((message) => (
              <div key={message.id} className={`message-row ${message.role}`}>
                <div className="message-bubble">
                  <div className="message-role">{message.role === 'assistant' ? 'AI' : 'You'}</div>
                  <div className="message-content">{message.content}</div>
                </div>
              </div>
            ))}
            {loadingReply && <div className="message-row assistant"><div className="message-bubble typing">Thinking...</div></div>}
            <div ref={endRef} />
          </div>
          <div className="sources-panel page-scroll">
            <h3>Sources</h3>
            {sources.length === 0 ? <div className="muted small">No sources shown yet</div> : sources.map((src, index) => (
              <div key={`${src.kind}-${src.item_id}-${index}`} className="source-card">
                <div className="source-card-header">
                  <span className="citation-badge">[{src.citation_id || index + 1}]</span>
                  <span className={`confidence-badge ${src.confidence || 'medium'}`}>{src.confidence || 'medium'} confidence</span>
                </div>
                <div className="source-type">{src.kind.toUpperCase()}</div>
                <div className="source-title">{src.title}</div>
                <div className="source-meta">Retrieval score {src.score}{src.chunk_index !== null && src.chunk_index !== undefined ? ` · Matched section ${src.chunk_index + 1}` : ''}</div>
                <div className="source-snippet">{src.snippet}</div>
                {src.kind === 'document' && <button className="ghost-btn tiny-btn" onClick={() => downloadDocument(src.item_id, src.title)}>Download/Open document</button>}
              </div>
            ))}
          </div>
        </div>
        <div className="composer-wrap no-pad-side">
          <div className="composer">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Message your AI assistant..." />
            <button className="send-btn" onClick={send} disabled={!input.trim() || loadingReply}>Send</button>
          </div>
        </div>
      </section>
      {showFaqs && (
        <div className="modal-backdrop" onClick={() => setShowFaqs(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <h2>Frequently Asked Questions</h2>
              <button className="ghost-btn" onClick={() => setShowFaqs(false)}>Close</button>
            </div>
            <div className="stack-list modal-scroll">
              {faqs.length === 0 ? <div className="muted small">No FAQs have been added yet.</div> : faqs.map((faq) => (
                <div key={faq.id} className="list-card">
                  <div className="faq-question">{faq.question}</div>
                  <div className="muted small faq-answer">{faq.answer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [preview, setPreview] = useState(null);

  const load = async () => {
    try { setDocuments(await api.listDocuments()); } catch (err) { setError(err.message); }
  };
  useEffect(() => { load(); }, []);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('display_name', displayName || file.name);
      await api.uploadDocument(form);
      await load();
      setDisplayName('');
      e.target.value = '';
    } catch (err) { setError(err.message); } finally { setUploading(false); }
  };

  const saveName = async () => {
    try { await api.updateDocument(editingId, { name: editName }); setEditingId(null); setEditName(''); await load(); }
    catch (err) { setError(err.message); }
  };

  const view = async (doc) => {
    try {
      const blob = await api.downloadDocumentBlob(doc.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) { setError(err.message); }
  };

  const textPreview = async (id) => {
    try { setPreview(await api.previewDocument(id)); } catch (err) { setError(err.message); }
  };

  const download = async (doc) => {
    try {
      const blob = await api.downloadDocumentBlob(doc.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name || 'document';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err.message); }
  };

  const remove = async (id) => {
    try { await api.deleteDocument(id); await load(); } catch (err) { setError(err.message); }
  };

  return (
    <div className="crud-grid">
      <div className="panel-card">
        <h3>Upload panel</h3>
        <label>Citation/display name
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. CMP600 Module Guide 2025-2026" />
        </label>
        <label className="upload-btn">{uploading ? 'Uploading...' : 'Choose file'}<input type="file" accept=".pdf,.docx,.txt" hidden onChange={onFile} /></label>
        <p className="muted small">The display name is what students see in citations and source cards.</p>
        {error && <div className="error-banner">{error}</div>}
      </div>
      <div className="panel-card">
        <h3>Management panel</h3>
        <div className="stack-list page-scroll fixed-height">
          {documents.length === 0 ? <div className="muted small">No documents uploaded yet</div> : documents.map((doc) => (
            <div key={doc.id} className="list-card">
              {editingId === doc.id ? (
                <div className="stack-form compact-form">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <div className="row-gap"><button className="primary-btn" onClick={saveName}>Save</button><button className="ghost-btn" onClick={() => setEditingId(null)}>Cancel</button></div>
                </div>
              ) : (
                <div className="row-between">
                  <div><div className="doc-name">{doc.name}</div><div className="muted small">{doc.file_type} · {doc.chunk_count} indexed sections · {doc.file_available ? 'file stored' : 'preview only'}</div></div>
                  <div className="row-gap wrap-gap">
                    {doc.file_available && <button className="ghost-btn" onClick={() => view(doc)}>Open original</button>}
                    {doc.file_available && <button className="ghost-btn" onClick={() => download(doc)}>Download</button>}
                    <button className="ghost-btn" onClick={() => textPreview(doc.id)}>Text preview</button>
                    <button className="ghost-btn" onClick={() => { setEditingId(doc.id); setEditName(doc.name); }}>Rename</button>
                    <button className="danger-btn" onClick={() => remove(doc.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {preview && (
        <div className="modal-backdrop" onClick={() => setPreview(null)}>
          <div className="modal-card large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <h2>Text preview: {preview.name}</h2>
              <button className="ghost-btn" onClick={() => setPreview(null)}>Close</button>
            </div>
            <p className="muted small">This is the indexed text used by the chatbot. Use Open original or Download to view the real uploaded file.</p>
            <pre className="document-preview">{preview.text_preview || 'No text preview available.'}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function FaqPage() {
  const blank = { question: '', answer: '' };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setFaqs(await api.listFaqs());
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.updateFaq(editingId, form);
      } else {
        await api.createFaq(form);
      }
      setForm(blank);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (faq) => {
    setEditingId(faq.id);
    setForm({ question: faq.question, answer: faq.answer });
  };

  const remove = async (id) => {
    try {
      await api.deleteFaq(id);
      if (editingId === id) {
        setEditingId(null);
        setForm(blank);
      }
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="crud-grid">
      <div className="panel-card">
        <h3>FAQ editor</h3>
        <form className="stack-form" onSubmit={submit}>
          <label>Question<input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Enter question" /></label>
          <label>Answer<textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Enter answer" rows={6} /></label>
          {error && <div className="error-banner">{error}</div>}
          <div className="row-gap">
            <button className="primary-btn" type="submit">{editingId ? 'Update FAQ' : 'Create FAQ'}</button>
            {editingId && <button className="ghost-btn" type="button" onClick={() => { setEditingId(null); setForm(blank); }}>Cancel edit</button>}
          </div>
        </form>
      </div>
      <div className="panel-card">
        <h3>Current FAQ</h3>
        <div className="stack-list page-scroll fixed-height">
          {faqs.map((faq) => (
            <div key={faq.id} className="list-card">
              <div className="faq-question">{faq.question}</div>
              <div className="muted small faq-answer">{faq.answer}</div>
              <div className="row-gap top-gap">
                <button className="ghost-btn" onClick={() => edit(faq)}>Edit</button>
                <button className="danger-btn" onClick={() => remove(faq.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RemindersPage() {
  const blank = { title: '', due_date: '', notes: '', is_completed: false };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState('');
  const [notificationStatus, setNotificationStatus] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'));
  const notifiedRef = useRef(new Set());

  const load = async () => {
    try {
      setReminders(await api.listReminders());
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      reminders.forEach((reminder) => {
        if (reminder.is_completed || !reminder.due_date || notifiedRef.current.has(reminder.id)) return;
        const due = new Date(reminder.due_date);
        if (!Number.isNaN(due.getTime()) && due <= now) {
          new Notification('Student AI Chatbot Reminder', {
            body: `${reminder.title}${reminder.notes ? ` — ${reminder.notes}` : ''}`,
          });
          notifiedRef.current.add(reminder.id);
        }
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [reminders]);

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      setNotificationStatus('unsupported');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.updateReminder(editingId, form);
      } else {
        await api.createReminder(form);
      }
      setForm(blank);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (reminder) => {
    setEditingId(reminder.id);
    setForm({
      title: reminder.title,
      due_date: reminder.due_date || '',
      notes: reminder.notes || '',
      is_completed: reminder.is_completed,
    });
  };

  const toggleComplete = async (reminder) => {
    try {
      await api.updateReminder(reminder.id, {
        title: reminder.title,
        due_date: reminder.due_date || '',
        notes: reminder.notes || '',
        is_completed: !reminder.is_completed,
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteReminder(id);
      if (editingId === id) {
        setEditingId(null);
        setForm(blank);
      }
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (value) => {
    if (!value) return 'No date/time set';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  return (
    <div className="crud-grid">
      <div className="panel-card">
        <h3>Reminder form</h3>
        <form className="stack-form" onSubmit={submit}>
          <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Reminder title" /></label>
          <label>Date and time<input type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></label>
          <label>Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={6} placeholder="Notes" /></label>
          <label className="checkbox-row"><input type="checkbox" checked={form.is_completed} onChange={(e) => setForm({ ...form, is_completed: e.target.checked })} /> Completed</label>
          {error && <div className="error-banner">{error}</div>}
          <div className="row-gap wrap-gap">
            <button className="primary-btn" type="submit">{editingId ? 'Update Reminder' : 'Create Reminder'}</button>
            {editingId && <button className="ghost-btn" type="button" onClick={() => { setEditingId(null); setForm(blank); }}>Cancel edit</button>}
          </div>
        </form>
        <div className="notification-panel">
          <div className="muted small">Browser notifications: {notificationStatus}</div>
          <button className="ghost-btn" onClick={requestNotifications}>Enable notifications</button>
          <p className="muted small">Notifications appear while the app/browser is open. Full background push notifications would be a future enhancement.</p>
        </div>
      </div>
      <div className="panel-card">
        <h3>Your reminders</h3>
        <div className="stack-list page-scroll fixed-height">
          {reminders.length === 0 ? <div className="muted small">No reminders added yet</div> : reminders.map((reminder) => (
            <div key={reminder.id} className={`list-card ${reminder.is_completed ? 'completed' : ''}`}>
              <div className="doc-name">{reminder.title}</div>
              <div className="muted small">{formatDate(reminder.due_date)}</div>
              <div className="muted small faq-answer">{reminder.notes || 'No notes'}</div>
              <div className="row-gap top-gap wrap-gap">
                <button className="ghost-btn" onClick={() => edit(reminder)}>Edit</button>
                <button className="ghost-btn" onClick={() => toggleComplete(reminder)}>{reminder.is_completed ? 'Mark active' : 'Mark complete'}</button>
                <button className="danger-btn" onClick={() => remove(reminder.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersPage() {
  const blank = { username: '', full_name: '', password: 'password123', role: 'student' };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try { setUsers(await api.listUsers()); } catch (err) { setError(err.message); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await api.updateUser(editingId, { full_name: form.full_name, role: form.role, password: form.password || undefined });
      else await api.createUser(form);
      setForm(blank); setEditingId(null); await load();
    } catch (err) { setError(err.message); }
  };

  const edit = (user) => {
    setEditingId(user.id);
    setForm({ username: user.username, full_name: user.full_name || '', password: '', role: user.role });
  };

  const remove = async (id) => {
    try { await api.deleteUser(id); await load(); } catch (err) { setError(err.message); }
  };

  return (
    <div className="crud-grid">
      <div className="panel-card">
        <h3>{editingId ? 'Edit user' : 'Create user'}</h3>
        <form className="stack-form" onSubmit={submit}>
          <label>Username<input disabled={!!editingId} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="student001" /></label>
          <label>Full name<input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Student name" /></label>
          <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingId ? 'Leave blank to keep current password' : 'password123'} /></label>
          <label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="student">student</option><option value="admin">admin</option></select></label>
          {error && <div className="error-banner">{error}</div>}
          <div className="row-gap">
            <button className="primary-btn" type="submit">{editingId ? 'Update user' : 'Create user'}</button>
            {editingId && <button className="ghost-btn" type="button" onClick={() => { setEditingId(null); setForm(blank); }}>Cancel</button>}
          </div>
        </form>
      </div>
      <div className="panel-card">
        <h3>Users</h3>
        <div className="stack-list page-scroll fixed-height">
          {users.map((u) => (
            <div key={u.id} className="list-card row-between">
              <div><div className="doc-name">{u.username}</div><div className="muted small">{u.full_name || 'No name'} · {u.role}</div></div>
              <div className="row-gap"><button className="ghost-btn" onClick={() => edit(u)}>Edit</button><button className="danger-btn" onClick={() => remove(u.id)}>Delete</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, setUser, signOut } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/chat" replace /> : <LoginPage onLoggedIn={setUser} />} />
      <Route path="/chat" element={<Protected user={user}><Layout user={user} signOut={signOut}><ChatPage /></Layout></Protected>} />
      <Route path="/admin/documents" element={<AdminOnly user={user}><Layout user={user} signOut={signOut}><DocumentsPage /></Layout></AdminOnly>} />
      <Route path="/admin/faqs" element={<AdminOnly user={user}><Layout user={user} signOut={signOut}><FaqPage /></Layout></AdminOnly>} />
      <Route path="/admin/users" element={<AdminOnly user={user}><Layout user={user} signOut={signOut}><UsersPage /></Layout></AdminOnly>} />
      <Route path="/reminders" element={<Protected user={user}><Layout user={user} signOut={signOut}><RemindersPage /></Layout></Protected>} />
      <Route path="*" element={<Navigate to={user ? '/chat' : '/login'} replace />} />
    </Routes>
  );
}
