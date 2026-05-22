import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

const statusLabels = {
  received: 'Reçu',
  reading: 'En lecture',
  accepted: 'Accepté',
  rejected: 'Refusé',
  editing: 'Correction',
  production: 'Production',
  published: 'Publié',
};

const statusClass = {
  received: 'badge-muted',
  reading: 'badge-info',
  accepted: 'badge-success',
  rejected: 'badge-danger',
  editing: 'badge-warning',
  production: 'badge-warning',
  published: 'badge-success',
};

const priorityLabels = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  urgent: 'Urgente',
};

const priorityClass = {
  low: 'badge-muted',
  normal: 'badge-info',
  high: 'badge-warning',
  urgent: 'badge-danger',
};

const fallbackCollections = {
  'litterature-recits': 'Littérature & récits',
  'savoirs-societe': 'Savoirs & société',
  'jeunesse-transmission': 'Jeunesse & transmission',
};

const statuses = Object.keys(statusLabels);
const priorities = Object.keys(priorityLabels);

export default function ManuscriptSubmissionManager() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState('');
  const [collections, setCollections] = useState(fallbackCollections);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [detail, setDetail] = useState(null);
  const [draft, setDraft] = useState({
    status: 'received',
    priority: 'normal',
    reviewer_name: '',
    editorial_score: '',
    due_date: '',
    next_action: '',
    decision_reason: '',
    admin_notes: '',
  });
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (priorityFilter) params.set('priority', priorityFilter);
    if (overdueOnly) params.set('overdue', '1');
    if (collectionFilter) params.set('collection', collectionFilter);
    if (search) params.set('search', search);
    params.set('page', page);

    api.get(`/admin/api/manuscripts?${params}`)
      .then((res) => {
        setSubmissions(res.data || []);
        setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total });
      })
      .finally(() => setLoading(false));
  }, [statusFilter, priorityFilter, overdueOnly, collectionFilter, search, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/admin/api/editorial-collections')
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setCollections(Object.fromEntries(data.map((collection) => [collection.slug, collection.name])));
      })
      .catch(() => {});
  }, []);

  const openDetail = async (submission) => {
    try {
      const fresh = await api.get(`/admin/api/manuscripts/${submission.id}`);
      setDetail(fresh);
      setDraft({
        status: fresh.status,
        priority: fresh.priority || 'normal',
        reviewer_name: fresh.reviewer_name || '',
        editorial_score: fresh.editorial_score ?? '',
        due_date: fresh.due_date || '',
        next_action: fresh.next_action || '',
        decision_reason: fresh.decision_reason || '',
        admin_notes: fresh.admin_notes || '',
      });
    } catch (error) {
      showNotif(error.message || 'Impossible de charger le manuscrit.', 'error');
    }
  };

  const saveDetail = async () => {
    if (!detail) return;

    try {
      const payload = {
        ...draft,
        editorial_score: draft.editorial_score === '' ? null : Number(draft.editorial_score),
        due_date: draft.due_date || null,
        reviewer_name: draft.reviewer_name || null,
        next_action: draft.next_action || null,
        decision_reason: draft.decision_reason || null,
        admin_notes: draft.admin_notes || null,
      };
      const updated = await api.patch(`/admin/api/manuscripts/${detail.id}`, payload);
      setDetail(updated);
      setDraft({
        status: updated.status,
        priority: updated.priority || 'normal',
        reviewer_name: updated.reviewer_name || '',
        editorial_score: updated.editorial_score ?? '',
        due_date: updated.due_date || '',
        next_action: updated.next_action || '',
        decision_reason: updated.decision_reason || '',
        admin_notes: updated.admin_notes || '',
      });
      showNotif('Suivi éditorial mis à jour.');
      load();
    } catch (error) {
      showNotif(error.message || 'Erreur lors de la mise à jour.', 'error');
    }
  };

  return (
    <div className="admin-section">
      {notification && <div className={`admin-notif admin-notif-${notification.type}`}>{notification.msg}</div>}

      <div className="admin-section-header">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4z"/><path d="M10 17V3h12v14"/></svg>
          Manuscrits
        </h2>
        <span className="admin-count">{meta.total || 0} soumissions</span>
      </div>

      <div className="admin-filters">
        <div className="search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            className="form-input search-input"
            placeholder="Rechercher par auteur, email, titre..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="admin-filter-select">
          <option value="">Tous les statuts</option>
          {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className="admin-filter-select">
          <option value="">Toutes les priorités</option>
          {priorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
        </select>
        <select value={collectionFilter} onChange={(e) => { setCollectionFilter(e.target.value); setPage(1); }} className="admin-filter-select">
          <option value="">Toutes les collections</option>
          {Object.entries(collections).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <label className="admin-checkbox-filter">
          <input type="checkbox" checked={overdueOnly} onChange={(e) => { setOverdueOnly(e.target.checked); setPage(1); }} />
          En retard
        </label>
      </div>

      {loading ? (
        <div className="admin-loading">Chargement...</div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Projet</th>
                  <th>Auteur</th>
                  <th>Collection</th>
                  <th>Statut</th>
                  <th>Suivi</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      <div className="text-bold">{submission.title}</div>
                      <div className="text-sm text-muted">{submission.genre || 'Genre non précisé'}{submission.page_count ? ` · ${submission.page_count} pages` : ''}</div>
                    </td>
                    <td>
                      <div>{submission.author_name}</div>
                      <div className="text-sm text-muted">{submission.email}</div>
                    </td>
                    <td>{collections[submission.collection] || submission.collection}</td>
                    <td><span className={`badge ${statusClass[submission.status] || 'badge-muted'}`}>{statusLabels[submission.status] || submission.status}</span></td>
                    <td>
                      <div><span className={`badge ${priorityClass[submission.priority] || 'badge-muted'}`}>{priorityLabels[submission.priority] || 'Normale'}</span></div>
                      <div className="text-sm text-muted manuscript-followup">
                        {submission.reviewer_name || 'Lecteur non assigné'}
                        {submission.due_date ? ` · ${new Date(submission.due_date).toLocaleDateString('fr-FR')}` : ''}
                      </div>
                    </td>
                    <td>{new Date(submission.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button className="btn-admin btn-secondary btn-sm" onClick={() => openDetail(submission)}>Ouvrir</button>
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && <tr><td colSpan="7" className="admin-empty">Aucun manuscrit reçu.</td></tr>}
              </tbody>
            </table>
          </div>

          {meta.last_page > 1 && (
            <div className="admin-pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Précédent</button>
              <span>Page {meta.current_page} / {meta.last_page}</span>
              <button disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Suivant →</button>
            </div>
          )}
        </>
      )}

      {detail && (
        <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
          <div className="admin-modal manuscript-admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{detail.title}</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div className="manuscript-detail-grid">
                <div><strong>Auteur:</strong> {detail.author_name}</div>
                <div><strong>Email:</strong> {detail.email}</div>
                <div><strong>Téléphone:</strong> {detail.phone || 'Non renseigné'}</div>
                <div><strong>Collection:</strong> {collections[detail.collection] || detail.collection}</div>
                <div><strong>Genre:</strong> {detail.genre || 'Non renseigné'}</div>
                <div><strong>Pages:</strong> {detail.page_count || 'Non renseigné'}</div>
                <div><strong>Priorité:</strong> {priorityLabels[detail.priority] || 'Normale'}</div>
                <div><strong>Lecteur:</strong> {detail.reviewer_name || 'Non assigné'}</div>
                <div><strong>Score:</strong> {detail.editorial_score ?? 'Non noté'}</div>
                <div><strong>Échéance:</strong> {detail.due_date ? new Date(detail.due_date).toLocaleDateString('fr-FR') : 'Non fixée'}</div>
                <div><strong>Reçu le:</strong> {new Date(detail.created_at).toLocaleString('fr-FR')}</div>
                <div><strong>Dernière revue:</strong> {detail.reviewed_at ? new Date(detail.reviewed_at).toLocaleString('fr-FR') : 'Non revue'}</div>
              </div>

              {detail.manuscript_url && (
                <p style={{ marginTop: '1rem' }}>
                  <a className="btn-admin btn-secondary btn-sm" href={detail.manuscript_url} target="_blank" rel="noreferrer">Ouvrir le lien manuscrit</a>
                </p>
              )}

              <hr style={{ margin: '1.25rem 0' }} />
              <h4 style={{ marginBottom: '0.5rem' }}>Synopsis</h4>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{detail.synopsis}</div>

              {detail.author_note && (
                <>
                  <h4 style={{ margin: '1.25rem 0 0.5rem' }}>Note de l'auteur</h4>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{detail.author_note}</div>
                </>
              )}

              <hr style={{ margin: '1.25rem 0' }} />
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Statut éditorial</label>
                  <select className="form-select" value={draft.status} onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value }))}>
                    {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priorité</label>
                  <select className="form-select" value={draft.priority} onChange={(e) => setDraft((prev) => ({ ...prev, priority: e.target.value }))}>
                    {priorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Lecteur responsable</label>
                  <input className="form-input" value={draft.reviewer_name} onChange={(e) => setDraft((prev) => ({ ...prev, reviewer_name: e.target.value }))} placeholder="Nom du lecteur ou éditeur" />
                </div>
                <div className="form-group">
                  <label className="form-label">Score éditorial / 100</label>
                  <input className="form-input" type="number" min="0" max="100" value={draft.editorial_score} onChange={(e) => setDraft((prev) => ({ ...prev, editorial_score: e.target.value }))} placeholder="75" />
                </div>
                <div className="form-group">
                  <label className="form-label">Échéance de lecture</label>
                  <input className="form-input" type="date" value={draft.due_date} onChange={(e) => setDraft((prev) => ({ ...prev, due_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Prochaine action</label>
                  <input className="form-input" value={draft.next_action} onChange={(e) => setDraft((prev) => ({ ...prev, next_action: e.target.value }))} placeholder="Relire, contacter auteur, demander extrait..." />
                </div>
                <div className="form-group full">
                  <label className="form-label">Motif de décision</label>
                  <textarea className="form-textarea" rows={3} value={draft.decision_reason} onChange={(e) => setDraft((prev) => ({ ...prev, decision_reason: e.target.value }))} placeholder="Pourquoi accepter, refuser ou poursuivre l'évaluation..." />
                </div>
                <div className="form-group full">
                  <label className="form-label">Notes internes</label>
                  <textarea className="form-textarea" rows={5} value={draft.admin_notes} onChange={(e) => setDraft((prev) => ({ ...prev, admin_notes: e.target.value }))} placeholder="Avis de lecture, décision, prochaine action..." />
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <a className="btn-admin btn-secondary" href={`mailto:${detail.email}?subject=${encodeURIComponent(`Votre manuscrit: ${detail.title}`)}`}>Répondre</a>
              <button className="btn-admin btn-primary" onClick={saveDetail}>Enregistrer</button>
              <button className="btn-admin btn-secondary" onClick={() => setDetail(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
