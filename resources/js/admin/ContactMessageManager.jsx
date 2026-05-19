import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

const statusLabels = { open: 'Ouvert', resolved: 'Résolu' };
const statusClass = { open: 'badge-warning', resolved: 'badge-success' };

export default function ContactMessageManager() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [notification, setNotification] = useState(null);
  const [detail, setDetail] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    params.set('page', page);
    api.get(`/admin/api/contact-messages?${params}`)
      .then(res => {
        setMessages(res.data || []);
        setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total });
      })
      .finally(() => setLoading(false));
  }, [statusFilter, search, page]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (msg) => {
    const newStatus = msg.status === 'open' ? 'resolved' : 'open';
    try {
      await api.patch(`/admin/api/contact-messages/${msg.id}/status`, { status: newStatus });
      showNotif(newStatus === 'resolved' ? 'Message marqué comme résolu.' : 'Message réouvert.');
      load();
      if (detail?.id === msg.id) setDetail(prev => ({ ...prev, status: newStatus }));
    } catch (e) {
      showNotif(e.message || 'Erreur', 'error');
    }
  };

  return (
    <div className="admin-section">
      {notification && <div className={`admin-notif admin-notif-${notification.type}`}>{notification.msg}</div>}

      <div className="admin-section-header">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Messages de contact
        </h2>
        <span className="admin-count">{meta.total || 0} messages</span>
      </div>

      <div className="admin-filters">
        <div className="search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            className="form-input search-input"
            placeholder="Rechercher par nom, email, sujet..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="admin-filter-select">
          <option value="">Tous les statuts</option>
          <option value="open">Ouverts</option>
          <option value="resolved">Résolus</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">Chargement...</div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Expéditeur</th>
                  <th>Sujet</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div>{m.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>{m.email}</div>
                    </td>
                    <td>{m.subject}</td>
                    <td><span className={`admin-badge ${statusClass[m.status] || ''}`}>{statusLabels[m.status] || m.status}</span></td>
                    <td>{new Date(m.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="btn-icon" title="Voir" onClick={() => setDetail(m)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button className="btn-icon" title={m.status === 'open' ? 'Marquer résolu' : 'Réouvrir'} onClick={() => toggleStatus(m)}>
                          {m.status === 'open'
                            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {messages.length === 0 && <tr><td colSpan="5" className="admin-empty">Aucun message.</td></tr>}
              </tbody>
            </table>
          </div>

          {meta.last_page > 1 && (
            <div className="admin-pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
              <span>Page {meta.current_page} / {meta.last_page}</span>
              <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Suivant →</button>
            </div>
          )}
        </>
      )}

      {detail && (
        <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Message de {detail.name}</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                <div><strong>De:</strong> {detail.name} ({detail.email})</div>
                <div><strong>Sujet:</strong> {detail.subject}</div>
                <div><strong>Statut:</strong> <span className={`admin-badge ${statusClass[detail.status]}`}>{statusLabels[detail.status]}</span></div>
                <div><strong>Date:</strong> {new Date(detail.created_at).toLocaleString('fr-FR')}</div>
                <hr />
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{detail.message}</div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <a className="btn-admin btn-secondary" href={`mailto:${detail.email}?subject=${encodeURIComponent(`Re: ${detail.subject}`)}`}>
                Répondre par email
              </a>
              <button className={`btn-admin ${detail.status === 'open' ? 'btn-success' : 'btn-secondary'}`} onClick={() => toggleStatus(detail)}>
                {detail.status === 'open' ? 'Marquer résolu' : 'Réouvrir'}
              </button>
              <button className="btn-admin btn-secondary" onClick={() => setDetail(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
