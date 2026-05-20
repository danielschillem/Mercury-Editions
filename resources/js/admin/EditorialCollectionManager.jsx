import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

const emptyCollection = {
  name: '',
  slug: '',
  description: '',
  icon: 'bookOpen',
  color: '#B91C1C',
  sort_order: 10,
  is_active: true,
};

const iconOptions = [
  { value: 'bookOpen', label: 'Livre ouvert' },
  { value: 'library', label: 'Bibliothèque' },
  { value: 'graduation', label: 'Transmission' },
  { value: 'scroll', label: 'Manuscrit' },
  { value: 'pen', label: 'Plume' },
];

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function EditorialCollectionManager() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyCollection);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/api/editorial-collections')
      .then(setCollections)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(emptyCollection);
    setEditId(null);
    setErrors({});
    setModal(true);
  };

  const openEdit = (collection) => {
    setForm(collection);
    setEditId(collection.id);
    setErrors({});
    setModal(true);
  };

  const handleChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !editId) next.slug = slugify(value);
      return next;
    });
  };

  const save = async () => {
    setErrors({});
    const payload = {
      ...form,
      sort_order: Number(form.sort_order) || 0,
      is_active: Boolean(form.is_active),
    };

    try {
      if (editId) {
        await api.put(`/admin/api/editorial-collections/${editId}`, payload);
        showNotif('Collection mise à jour.');
      } else {
        await api.post('/admin/api/editorial-collections', payload);
        showNotif('Collection ajoutée.');
      }
      setModal(false);
      load();
    } catch (error) {
      if (error.data?.errors) setErrors(error.data.errors);
      else showNotif(error.message || 'Impossible d’enregistrer la collection.', 'error');
    }
  };

  const destroy = async (collection) => {
    if (!confirm(`Supprimer la collection "${collection.name}" ?`)) return;
    try {
      await api.del(`/admin/api/editorial-collections/${collection.id}`);
      showNotif('Collection supprimée.', 'warning');
      load();
    } catch (error) {
      showNotif(error.message || 'Impossible de supprimer la collection.', 'error');
    }
  };

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /><span>Chargement...</span></div>;

  return (
    <div className="admin-section">
      {notification && <div className={`admin-notif admin-notif-${notification.type}`}>{notification.msg}</div>}

      <div className="admin-page-header">
        <div>
          <p className="admin-page-sub">{collections.length} collections éditoriales</p>
        </div>
        <button className="btn-admin btn-primary" onClick={openAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter une collection
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Collection</th>
                <th>Slug</th>
                <th>Ordre</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection) => (
                <tr key={collection.id}>
                  <td>
                    <div className="collection-admin-cell">
                      <span className="collection-admin-color" style={{ background: collection.color }} />
                      <div>
                        <div className="text-bold">{collection.name}</div>
                        <div className="text-sm text-muted">{collection.description}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="ref-code">{collection.slug}</span></td>
                  <td>{collection.sort_order}</td>
                  <td><span className={`badge ${collection.is_active ? 'badge-success' : 'badge-muted'}`}>{collection.is_active ? 'Active' : 'Masquée'}</span></td>
                  <td className="actions">
                    <button className="btn-icon btn-icon-edit" onClick={() => openEdit(collection)} title="Modifier">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="btn-icon btn-icon-delete" onClick={() => destroy(collection)} title="Supprimer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {collections.length === 0 && <tr><td colSpan="5" className="admin-empty">Aucune collection.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(false)}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editId ? 'Modifier la collection' : 'Nouvelle collection'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div className="form-grid">
                <FormField label="Nom" error={errors.name}>
                  <input className="form-input" value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
                </FormField>
                <FormField label="Slug" error={errors.slug}>
                  <input className="form-input" value={form.slug} onChange={(e) => handleChange('slug', e.target.value)} placeholder="nom-de-collection" />
                </FormField>
                <FormField label="Icône" error={errors.icon}>
                  <select className="form-select" value={form.icon} onChange={(e) => handleChange('icon', e.target.value)}>
                    {iconOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Couleur" error={errors.color}>
                  <input className="form-input" type="color" value={form.color} onChange={(e) => handleChange('color', e.target.value)} />
                </FormField>
                <FormField label="Ordre" error={errors.sort_order}>
                  <input className="form-input" type="number" min="0" max="1000" value={form.sort_order} onChange={(e) => handleChange('sort_order', e.target.value)} />
                </FormField>
                <div className="form-group">
                  <label className="form-label">Visibilité</label>
                  <label className="form-check-label">
                    <input className="form-checkbox" type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => handleChange('is_active', e.target.checked)} /> Active sur le site
                  </label>
                </div>
                <FormField label="Description" error={errors.description} full>
                  <textarea className="form-textarea" rows={5} value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
                </FormField>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn-admin btn-secondary" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn-admin btn-primary" onClick={save}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, error, children, full = false }) {
  return (
    <div className={`form-group${full ? ' full' : ''}`}>
      <label className="form-label">{label}</label>
      {children}
      {error && <div className="form-error-text">{Array.isArray(error) ? error[0] : error}</div>}
    </div>
  );
}
