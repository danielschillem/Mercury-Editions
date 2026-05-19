import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

const roleLabels = { admin: 'Admin', user: 'Client' };

export default function UserManager({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
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
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    params.set('page', page);
    api.get(`/admin/api/users?${params}`)
      .then(res => {
        setUsers(res.data || []);
        setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total });
      })
      .finally(() => setLoading(false));
  }, [search, roleFilter, page]);

  useEffect(() => { load(); }, [load]);

  const toggleRole = async (user) => {
    try {
      await api.put(`/admin/api/users/${user.id}`, { is_admin: !user.is_admin });
      showNotif(`${user.name} est maintenant ${user.is_admin ? 'client' : 'admin'}.`);
      load();
    } catch (e) {
      showNotif(e.message || 'Erreur', 'error');
    }
  };

  const deleteUser = async (user) => {
    if (!confirm(`Supprimer ${user.name} ? Cette action est irréversible.`)) return;
    try {
      await api.del(`/admin/api/users/${user.id}`);
      showNotif(`${user.name} supprimé.`);
      load();
    } catch (e) {
      showNotif(e.message || 'Erreur', 'error');
    }
  };

  const viewUser = async (id) => {
    try {
      const data = await api.get(`/admin/api/users/${id}`);
      setDetail(data);
    } catch (e) {
      showNotif(e.message || 'Impossible de charger ce profil.', 'error');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

  return (
    <div className="admin-section">
      {notification && <div className={`admin-notif admin-notif-${notification.type}`}>{notification.msg}</div>}

      <div className="admin-section-header">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Gestion des utilisateurs
        </h2>
        <span className="admin-count">{meta.total || 0} utilisateurs</span>
      </div>

      <div className="admin-filters">
        <input type="text" placeholder="Rechercher un utilisateur..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} className="admin-search" />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="admin-filter-select">
          <option value="">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="user">Client</option>
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
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Commandes</th>
                  <th>Inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{u.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td><span className={`admin-badge ${u.is_admin ? 'badge-primary' : 'badge-default'}`}>{u.is_admin ? 'Admin' : 'Client'}</span></td>
                    <td>{u.orders_count ?? 0}</td>
                    <td>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="btn-icon" title="Voir" onClick={() => viewUser(u.id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button
                          className="btn-icon"
                          title={u.id === currentUser?.id ? 'Vous ne pouvez pas modifier votre propre rôle ici.' : (u.is_admin ? 'Retirer admin' : 'Rendre admin')}
                          onClick={() => toggleRole(u)}
                          disabled={u.id === currentUser?.id}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          title={u.id === currentUser?.id ? 'Vous ne pouvez pas supprimer votre propre compte.' : 'Supprimer'}
                          onClick={() => deleteUser(u)}
                          disabled={u.id === currentUser?.id}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan="6" className="admin-empty">Aucun utilisateur trouvé.</td></tr>}
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
              <h3>Profil utilisateur</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div className="user-detail-header">
                <div className="user-avatar-lg">{detail.user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <div>
                  <h4>{detail.user?.name}</h4>
                  <p>{detail.user?.email}</p>
                  {detail.user?.phone && <p>{detail.user.phone}</p>}
                  <span className={`admin-badge ${detail.user?.is_admin ? 'badge-primary' : 'badge-default'}`}>{detail.user?.is_admin ? 'Admin' : 'Client'}</span>
                </div>
              </div>
              <div className="user-detail-summary">
                <div className="user-detail-inline">
                  <strong>Vérification email</strong>
                  <span className={`admin-badge ${detail.user?.email_verified_at ? 'badge-success' : 'badge-warning'}`}>
                    {detail.user?.email_verified_at ? 'Vérifié' : 'À vérifier'}
                  </span>
                </div>
                <div className="user-detail-inline">
                  <strong>Téléphone</strong>
                  <span>{detail.user?.phone || 'Non renseigné'}</span>
                </div>
              </div>
              <div className="user-detail-stats">
                <div className="stat-card"><div className="stat-value">{detail.user?.orders_count ?? 0}</div><div className="stat-label">Commandes</div></div>
                <div className="stat-card"><div className="stat-value">{fmt(detail.total_spent || 0)} F</div><div className="stat-label">Dépensé</div></div>
                <div className="stat-card"><div className="stat-value">{new Date(detail.user?.created_at).toLocaleDateString('fr-FR')}</div><div className="stat-label">Inscription</div></div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn-admin btn-secondary" onClick={() => setDetail(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
