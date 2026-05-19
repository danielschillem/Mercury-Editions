import { useState, useEffect } from 'react';
import { api } from './api';
import Login from './Login';
import Dashboard from './Dashboard';
import BookManager from './BookManager';
import AuthorManager from './AuthorManager';
import OrderManager from './OrderManager';
import UserManager from './UserManager';
import ContactMessageManager from './ContactMessageManager';

const pages = {
  dashboard: Dashboard,
  books: BookManager,
  authors: AuthorManager,
  orders: OrderManager,
  users: UserManager,
  messages: ContactMessageManager,
};

const icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  books: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  authors: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  orders: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  messages: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

const nav = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'books',     label: 'Livres' },
  { key: 'authors',   label: 'Auteurs' },
  { key: 'orders',    label: 'Commandes' },
  { key: 'users',     label: 'Utilisateurs' },
  { key: 'messages',  label: 'Messages' },
];

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    api.get('/admin/api/me')
      .then(d => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    try { await api.post('/admin/api/logout', {}); } catch {}
    setUser(null);
  };

  if (checking) return (
    <div className="admin-loading">
      <div className="admin-spinner" />
      <span>Chargement...</span>
    </div>
  );
  if (!user) return <Login onLogin={setUser} />;

  const PageComponent = pages[page] || Dashboard;

  return (
    <div className={`admin-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <img src="/images/logo/logo.png" alt="Mercury" className="admin-logo-img" />
          {!sidebarCollapsed && <span>Mercury Admin</span>}
        </div>

        <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(c => !c)} title={sidebarCollapsed ? 'Ouvrir' : 'Replier'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {sidebarCollapsed
              ? <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
              : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
          </svg>
        </button>

        <nav className="admin-nav">
          {nav.map(n => (
            <button
              key={n.key}
              className={`admin-nav-item${page === n.key ? ' active' : ''}`}
              onClick={() => setPage(n.key)}
              title={sidebarCollapsed ? n.label : undefined}
            >
              <span className="admin-nav-icon">{icons[n.key]}</span>
              {!sidebarCollapsed && <span className="admin-nav-label">{n.label}</span>}
            </button>
          ))}
        </nav>

        <div className="admin-user">
          <div className="admin-user-info">
            <div className="admin-user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            {!sidebarCollapsed && (
              <div className="admin-user-details">
                <span className="admin-user-name">{user.name}</span>
                <span className="admin-user-role">Administrateur</span>
              </div>
            )}
          </div>
          <button className="admin-logout-btn" onClick={handleLogout} title="Deconnexion">
            {icons.logout}
            {!sidebarCollapsed && <span>Deconnexion</span>}
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-topbar">
          <h2 className="admin-topbar-title">{nav.find(n => n.key === page)?.label}</h2>
          <div className="admin-topbar-right">
            <span className="admin-topbar-date">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>
        <div className="admin-page-content">
          <PageComponent currentUser={user} />
        </div>
      </main>
    </div>
  );
}
