import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import Icon from '../components/Icons';

const statusLabels = { pending: 'En attente', completed: 'Terminee', failed: 'Echouee' };
const statusClass  = { completed: 'badge-success', pending: 'badge-warning', failed: 'badge-danger' };
const statusIcons = {
  completed: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  pending: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  failed: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const load = useCallback(() => {
    const url = filter ? `/admin/api/orders?status=${filter}` : '/admin/api/orders';
    api.get(url)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const updateStatus = async (id, status) => {
    if (status === 'failed' && !window.confirm('Marquer cette commande comme échouée ?')) {
      return;
    }

    try {
      await api.patch(`/admin/api/orders/${id}/status`, { status });
      showNotif(status === 'completed' ? 'Commande validee' : 'Commande rejetee', status === 'completed' ? 'success' : 'warning');
      load();
      if (detail?.id === id) setDetail(prev => ({ ...prev, status }));
    } catch (err) {
      showNotif(err.message || 'Impossible de mettre a jour cette commande.', 'error');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

  const filtered = orders.filter(o =>
    !search || (o.reference || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.buyer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.buyer_phone || '').includes(search)
  );

  // Stats
  const totalRevenue = filtered.reduce((s, o) => s + (o.status === 'completed' ? o.total_amount : 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /><span>Chargement...</span></div>;

  return (
    <div>
      {notification && (
        <div className={`admin-notif admin-notif-${notification.type}`}>
          <Icon name={notification.type === 'success' ? 'check' : 'warning'} size={16} /> {notification.msg}
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <p className="admin-page-sub">{orders.length} commande(s) — {pendingCount} en attente</p>
        </div>
      </div>

      {/* Mini stats */}
      <div className="stats-grid stats-grid-3">
        <div className="stat-card stat-card-compact">
          <div className="stat-card-label">Commandes affichees</div>
          <div className="stat-card-value">{filtered.length}</div>
        </div>
        <div className="stat-card stat-card-compact">
          <div className="stat-card-label">En attente</div>
          <div className="stat-card-value" style={{ color: 'var(--admin-warning)' }}>{pendingCount}</div>
        </div>
        <div className="stat-card stat-card-compact">
          <div className="stat-card-label">Revenus (affichees)</div>
          <div className="stat-card-value stat-value-green">{fmt(totalRevenue)} F</div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" className="form-input search-input" placeholder="Rechercher ref, client, telephone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-tabs">
          {[{ v: '', l: 'Toutes' }, { v: 'pending', l: 'En attente' }, { v: 'completed', l: 'Terminees' }, { v: 'failed', l: 'Echouees' }].map(f => (
            <button key={f.v} className={`filter-tab${filter === f.v ? ' active' : ''}`} onClick={() => setFilter(f.v)}>{f.l}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th><th>Client</th><th>Telephone</th>
                <th>Total</th><th>Statut</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td><span className="ref-code">{o.reference}</span></td>
                  <td className="text-bold">{o.buyer_name || '-'}</td>
                  <td className="text-muted">{o.buyer_phone}</td>
                  <td className="text-bold">{fmt(o.total_amount)} FCFA</td>
                  <td>
                    <span className={`badge badge-with-icon ${statusClass[o.status] || 'badge-muted'}`}>
                      {statusIcons[o.status]} {statusLabels[o.status] || o.status}
                    </span>
                  </td>
                  <td className="text-muted text-sm">{new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="actions">
                    <button className="btn-icon" onClick={() => setDetail(o)} title="Details">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    {o.status === 'pending' && (
                      <>
                        <button className="btn-icon btn-icon-success" onClick={() => updateStatus(o.id, 'completed')} title="Valider">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                        <button className="btn-icon btn-icon-delete" onClick={() => updateStatus(o.id, 'failed')} title="Rejeter">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="admin-empty">Aucune commande.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
          <div className="admin-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Commande {detail.reference}</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div className="order-detail-status">
                <span className={`badge badge-lg badge-with-icon ${statusClass[detail.status]}`}>
                  {statusIcons[detail.status]} {statusLabels[detail.status]}
                </span>
              </div>

              <div className="preview-details-grid">
                <div><span className="preview-label">Client</span><span>{detail.buyer_name || '-'}</span></div>
                <div><span className="preview-label">Telephone</span><span>{detail.buyer_phone}</span></div>
                <div><span className="preview-label">Email</span><span>{detail.buyer_email || '-'}</span></div>
                <div><span className="preview-label">Date</span><span>{new Date(detail.created_at).toLocaleString('fr-FR')}</span></div>
                <div><span className="preview-label">Total</span><span className="text-bold">{fmt(detail.total_amount)} FCFA</span></div>
                <div><span className="preview-label">Frais OM</span><span>{fmt(detail.om_fees)} FCFA</span></div>
                <div><span className="preview-label">Transaction OM</span><span>{detail.om_transaction_id || '-'}</span></div>
              </div>

              {detail.items && detail.items.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 className="section-title">Articles commandes</h4>
                  <table className="admin-table">
                    <thead>
                      <tr><th>Livre</th><th>Format</th><th>Prix</th></tr>
                    </thead>
                    <tbody>
                      {detail.items.map(item => (
                        <tr key={item.id}>
                          <td className="text-bold">{item.book?.title || `#${item.book_id}`}</td>
                          <td><span className="badge badge-muted">{item.format}</span></td>
                          <td>{fmt(item.unit_price)} FCFA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              {detail.status === 'pending' && (
                <>
                  <button className="btn-admin btn-success" onClick={() => { updateStatus(detail.id, 'completed'); setDetail(null); }}>
                    Valider la commande
                  </button>
                  <button className="btn-admin btn-danger" onClick={() => { updateStatus(detail.id, 'failed'); setDetail(null); }}>
                    Rejeter
                  </button>
                </>
              )}
              <button className="btn-admin btn-secondary" onClick={() => setDetail(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
