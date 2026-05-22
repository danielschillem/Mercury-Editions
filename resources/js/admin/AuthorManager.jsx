import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import Icon from '../components/Icons';

const emptyAuthor = {
  slug: '', name: '', icon: 'book', origin: '', born: '', died: '',
  color: '#1a1a2e', genres: '', bio: '', timeline: '[]', awards: '',
};

export default function AuthorManager() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyAuthor);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const load = useCallback(() => {
    api.get('/admin/api/authors')
      .then(setAuthors)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const openAdd = () => {
    setForm(emptyAuthor);
    setEditId(null);
    setErrors({});
    setModal(true);
  };

  const openEdit = (a) => {
    setForm({
      ...a,
      genres: Array.isArray(a.genres) ? a.genres.join(', ') : a.genres || '',
      awards: Array.isArray(a.awards) ? a.awards.join(', ') : a.awards || '',
      timeline: JSON.stringify(a.timeline || [], null, 2),
      died: a.died || '',
    });
    setEditId(a.id);
    setErrors({});
    setModal(true);
  };

  const handleChange = (key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !editId) next.slug = slugify(value);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});

    let timeline;
    try {
      timeline = JSON.parse(form.timeline);
    } catch {
      setErrors({ timeline: ['Format JSON invalide'] });
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      died: form.died || null,
      genres: typeof form.genres === 'string'
        ? form.genres.split(',').map(t => t.trim()).filter(Boolean)
        : form.genres,
      awards: typeof form.awards === 'string'
        ? form.awards.split(',').map(t => t.trim()).filter(Boolean)
        : form.awards,
      timeline,
    };

    try {
      if (editId) {
        await api.put(`/admin/api/authors/${editId}`, payload);
        showNotif('Auteur mis a jour avec succes');
      } else {
        await api.post('/admin/api/authors', payload);
        showNotif('Auteur ajoute avec succes');
      }
      setModal(false);
      load();
    } catch (err) {
      if (err.data?.errors) setErrors(err.data.errors);
      else showNotif(err.message || 'Impossible d\'enregistrer cet auteur.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet auteur ? Ses livres seront conserves sans auteur associe.')) return;
    try {
      await api.del(`/admin/api/authors/${id}`);
      showNotif('Auteur supprime', 'warning');
      load();
    } catch (err) {
      showNotif(err.message || 'Impossible de supprimer cet auteur.', 'error');
    }
  };

  const filtered = authors.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.origin.toLowerCase().includes(search.toLowerCase())
  );

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
          <p className="admin-page-sub">{authors.length} auteurs enregistres</p>
        </div>
        <button className="btn-admin btn-primary" onClick={openAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un auteur
        </button>
      </div>

      {/* Search */}
      <div className="admin-filters">
        <div className="search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" className="form-input search-input" placeholder="Rechercher par nom ou origine..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Author cards grid */}
      <div className="authors-grid">
        {filtered.map(a => (
          <div key={a.id} className="author-card" onClick={() => setPreview(a)}>
            <div className="author-card-header" style={{ background: a.color }}>
              <div className="author-card-avatar">{a.name.charAt(0)}</div>
            </div>
            <div className="author-card-body">
              <h3 className="author-card-name">{a.name}</h3>
              <p className="author-card-origin">{a.origin}</p>
              <p className="author-card-dates">{a.born}{a.died ? ` — ${a.died}` : ' — present'}</p>
              <div className="author-card-genres">
                {(Array.isArray(a.genres) ? a.genres : []).slice(0, 3).map(g => (
                  <span key={g} className="tag-chip">{g}</span>
                ))}
              </div>
              <div className="author-card-footer">
                <span className="badge badge-info">{a.books_count ?? 0} livre(s)</span>
                <div className="author-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn-icon btn-icon-edit" onClick={() => openEdit(a)} title="Modifier">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(a.id)} title="Supprimer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="admin-empty" style={{ gridColumn: '1 / -1' }}>Aucun auteur trouve.</div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="admin-modal-overlay" onClick={() => setPreview(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ background: preview.color, color: 'white' }}>
              <h3>{preview.name}</h3>
              <button className="modal-close" style={{ color: 'white' }} onClick={() => setPreview(null)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div className="preview-details-grid">
                <div><span className="preview-label">Origine</span><span>{preview.origin}</span></div>
                <div><span className="preview-label">Naissance</span><span>{preview.born}</span></div>
                <div><span className="preview-label">Deces</span><span>{preview.died || 'Vivant(e)'}</span></div>
                <div><span className="preview-label">Livres</span><span>{preview.books_count ?? 0}</span></div>
              </div>
              {preview.genres && (
                <div style={{ margin: '1rem 0' }}>
                  <span className="preview-label">Genres</span>
                  <div className="preview-tags" style={{ marginTop: 4 }}>
                    {(Array.isArray(preview.genres) ? preview.genres : []).map(g => (
                      <span key={g} className="tag-chip">{g}</span>
                    ))}
                  </div>
                </div>
              )}
              {preview.awards && preview.awards.length > 0 && (
                <div style={{ margin: '1rem 0' }}>
                  <span className="preview-label">Distinctions</span>
                  <ul className="awards-list">
                    {(Array.isArray(preview.awards) ? preview.awards : []).map(a => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {preview.bio && (
                <div style={{ margin: '1rem 0' }}>
                  <span className="preview-label">Biographie</span>
                  <div className="preview-bio" dangerouslySetInnerHTML={{ __html: preview.bio }} />
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button className="btn-admin btn-primary" onClick={() => { setPreview(null); openEdit(preview); }}>Modifier</button>
              <button className="btn-admin btn-secondary" onClick={() => setPreview(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add modal */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editId ? 'Modifier l\'auteur' : 'Ajouter un auteur'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div className="form-grid">
                <FormField label="Nom" error={errors.name}>
                  <input className="form-input" value={form.name} onChange={e => handleChange('name', e.target.value)} />
                </FormField>
                <FormField label="Slug" error={errors.slug}>
                  <input className="form-input" value={form.slug} onChange={e => handleChange('slug', e.target.value)} />
                </FormField>
                <FormField label="Origine" error={errors.origin}>
                  <input className="form-input" value={form.origin} onChange={e => handleChange('origin', e.target.value)} placeholder="Ouagadougou, Burkina Faso" />
                </FormField>
                <FormField label="Icone" error={errors.icon}>
                  <input className="form-input" value={form.icon} onChange={e => handleChange('icon', e.target.value)} />
                </FormField>
                <FormField label="Ne(e)" error={errors.born}>
                  <input className="form-input" value={form.born} onChange={e => handleChange('born', e.target.value)} placeholder="1960" />
                </FormField>
                <FormField label="Decede(e)" error={errors.died}>
                  <input className="form-input" value={form.died} onChange={e => handleChange('died', e.target.value)} placeholder="(vide si vivant)" />
                </FormField>
                <FormField label="Couleur" error={errors.color}>
                  <input type="color" className="form-input" value={form.color} onChange={e => handleChange('color', e.target.value)} style={{ height: 40, padding: 4 }} />
                </FormField>
                <FormField label="Genres (virgule)" error={errors.genres}>
                  <input className="form-input" value={form.genres} onChange={e => handleChange('genres', e.target.value)} placeholder="Roman, Poesie, Essai" />
                </FormField>
                <FormField label="Biographie" error={errors.bio} full>
                  <textarea className="form-textarea" rows={4} value={form.bio} onChange={e => handleChange('bio', e.target.value)} />
                </FormField>
                <FormField label="Prix / Distinctions (virgule)" error={errors.awards} full>
                  <input className="form-input" value={form.awards} onChange={e => handleChange('awards', e.target.value)} placeholder="Prix litteraire X, Chevalier des Arts" />
                </FormField>
                <FormField label="Chronologie (JSON)" error={errors.timeline} full>
                  <textarea className="form-textarea" rows={6} value={form.timeline} onChange={e => handleChange('timeline', e.target.value)} style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
                </FormField>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn-admin btn-secondary" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn-admin btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : editId ? 'Mettre a jour' : 'Creer l\'auteur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, error, full, children }) {
  return (
    <div className={`form-group${full ? ' full' : ''}`}>
      <label className="form-label">{label}</label>
      {children}
      {error && <div className="form-error-text">{Array.isArray(error) ? error[0] : error}</div>}
    </div>
  );
}
