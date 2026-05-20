import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

const emptyBook = {
  title: '', author_id: '', editorial_collection_id: '', author_name: '', price: 0, category: 'roman',
  rating: 4.0, local: true, color: '#1a1a2e', cover_image: '', year: 2024, pages: 200,
  publication_date: '', publisher: '', editorial_director: '', language: 'Francais', isbn: '', tags: '',
  description: '', summary: '', public_excerpt: '', quote: '',
};

const categories = [
  { value: 'roman', label: 'Roman' },
  { value: 'poesie', label: 'Poesie' },
  { value: 'essai', label: 'Essai' },
  { value: 'conte', label: 'Conte' },
  { value: 'jeunesse', label: 'Jeunesse' },
  { value: 'nouvelles', label: 'Nouvelles' },
  { value: 'theatre', label: 'Theatre' },
];

const categoryColors = {
  roman: '#3B82F6', poesie: '#8B5CF6', essai: '#F59E0B', conte: '#10B981',
  jeunesse: '#EC4899', nouvelles: '#6366F1', theatre: '#EF4444',
};

export default function BookManager() {
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyBook);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [preview, setPreview] = useState(null);
  const [notification, setNotification] = useState(null);
  const [coverUpload, setCoverUpload] = useState(null);
  const [ebookPdfUpload, setEbookPdfUpload] = useState(null);
  const [ebookEpubUpload, setEbookEpubUpload] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const load = useCallback(() => {
    Promise.all([api.get('/admin/api/books'), api.get('/admin/api/authors'), api.get('/admin/api/editorial-collections')])
      .then(([b, a, c]) => { setBooks(b); setAuthors(a); setCollections(Array.isArray(c) ? c : []); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(emptyBook);
    setEditId(null);
    setErrors({});
    setCoverUpload(null);
    setEbookPdfUpload(null);
    setEbookEpubUpload(null);
    setModal(true);
  };

  const openEdit = (book) => {
    setForm({
      ...book,
      author_id: book.author_id || '',
      editorial_collection_id: book.editorial_collection_id || '',
      tags: Array.isArray(book.tags) ? book.tags.join(', ') : book.tags || '',
    });
    setEditId(book.id);
    setErrors({});
    setCoverUpload(null);
    setEbookPdfUpload(null);
    setEbookEpubUpload(null);
    setModal(true);
  };

  const handleChange = (key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'author_id' && value) {
        const a = authors.find(x => x.id === Number(value));
        if (a) next.author_name = a.name;
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});
    const payload = {
      ...form,
      price: Number(form.price),
      rating: Number(form.rating),
      year: Number(form.year),
      publication_date: form.publication_date || null,
      pages: Number(form.pages),
      local: Boolean(form.local),
      author_id: form.author_id ? Number(form.author_id) : null,
      editorial_collection_id: form.editorial_collection_id ? Number(form.editorial_collection_id) : null,
      tags: typeof form.tags === 'string'
        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : form.tags,
    };

    const hasUploads = Boolean(coverUpload || ebookPdfUpload || ebookEpubUpload);

    let requestBody = payload;
    if (hasUploads) {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach((item, index) => fd.append(`${k}[${index}]`, item));
        } else if (v !== undefined && v !== null) {
          fd.append(k, String(v));
        }
      });
      if (coverUpload) fd.append('cover_upload', coverUpload);
      if (ebookPdfUpload) fd.append('ebook_pdf', ebookPdfUpload);
      if (ebookEpubUpload) fd.append('ebook_epub', ebookEpubUpload);
      requestBody = fd;
    }

    try {
      if (editId) {
        await api.put(`/admin/api/books/${editId}`, requestBody);
        showNotif('Livre mis a jour avec succes');
      } else {
        await api.post('/admin/api/books', requestBody);
        showNotif('Livre ajoute avec succes');
      }
      setModal(false);
      load();
    } catch (err) {
      if (err.data?.errors) setErrors(err.data.errors);
      else showNotif(err.message || 'Impossible d\'enregistrer ce livre.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce livre ?')) return;
    try {
      await api.del(`/admin/api/books/${id}`);
      showNotif('Livre supprime', 'warning');
      load();
    } catch (err) {
      showNotif(err.message || 'Impossible de supprimer ce livre.', 'error');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

  const filtered = books.filter(b => {
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || b.category === catFilter;
    return matchSearch && matchCat;
  });

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /><span>Chargement...</span></div>;

  return (
    <div>
      {notification && (
        <div className={`admin-notif admin-notif-${notification.type}`}>
          {notification.type === 'success' ? '✓' : '!'} {notification.msg}
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <p className="admin-page-sub">{books.length} livres au catalogue — {filtered.length} affiches</p>
        </div>
        <button className="btn-admin btn-primary" onClick={openAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un livre
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" className="form-input search-input" placeholder="Rechercher par titre ou auteur..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-tabs">
          <button className={`filter-tab${!catFilter ? ' active' : ''}`} onClick={() => setCatFilter('')}>Tous</button>
          {categories.map(c => (
            <button key={c.value} className={`filter-tab${catFilter === c.value ? ' active' : ''}`} onClick={() => setCatFilter(c.value)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Livre</th><th>Auteur</th><th>Prix</th>
                <th>Categorie</th><th>Collection</th><th>Note</th><th>Annee</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="clickable-row" onClick={() => setPreview(b)}>
                  <td>
                    <div className="book-cell">
                      {b.cover_image ? (
                        <img src={b.cover_image} alt={b.title} className="book-thumb" onError={(e) => { e.target.onerror = null; e.target.src = '/images/covers/placeholder.svg'; }} />
                      ) : (
                        <div className="book-thumb-placeholder" style={{ background: b.color }}>{b.title.charAt(0)}</div>
                      )}
                      <div>
                        <div className="text-bold">{b.title}</div>
                        <div className="text-muted text-sm">{b.isbn || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>{b.author_name}</td>
                  <td className="text-bold">{fmt(b.price)} FCFA</td>
                  <td>
                    <span className="badge" style={{ background: `${categoryColors[b.category] || '#6b7280'}20`, color: categoryColors[b.category] || '#6b7280' }}>
                      {b.category}
                    </span>
                  </td>
                  <td>
                    {b.editorial_collection ? (
                      <span className="badge" style={{ background: `${b.editorial_collection.color || '#B91C1C'}20`, color: b.editorial_collection.color || '#B91C1C' }}>
                        {b.editorial_collection.name}
                      </span>
                    ) : <span className="text-muted text-sm">Non assignée</span>}
                  </td>
                  <td>
                    <div className="rating-display">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span>{b.rating}</span>
                    </div>
                  </td>
                  <td className="text-muted">{b.year}</td>
                  <td className="actions" onClick={e => e.stopPropagation()}>
                    <button className="btn-icon btn-icon-edit" onClick={() => openEdit(b)} title="Modifier">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(b.id)} title="Supprimer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="admin-empty">Aucun livre trouve.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="admin-modal-overlay" onClick={() => setPreview(null)}>
          <div className="admin-modal preview-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Apercu du livre</h3>
              <button className="modal-close" onClick={() => setPreview(null)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div className="preview-layout">
                <div className="preview-cover">
                  {preview.cover_image ? (
                    <img src={preview.cover_image} alt={preview.title} onError={(e) => { e.target.onerror = null; e.target.src = '/images/covers/placeholder.svg'; }} />
                  ) : (
                    <div className="preview-cover-placeholder" style={{ background: preview.color }}>{preview.title.charAt(0)}</div>
                  )}
                </div>
                <div className="preview-info">
                  <h2 className="preview-title">{preview.title}</h2>
                  <p className="preview-author">par {preview.author_name}</p>
                  <div className="preview-meta">
                    <span className="badge" style={{ background: `${categoryColors[preview.category]}20`, color: categoryColors[preview.category] }}>{preview.category}</span>
                    {preview.editorial_collection && (
                      <span className="badge" style={{ background: `${preview.editorial_collection.color || '#B91C1C'}20`, color: preview.editorial_collection.color || '#B91C1C' }}>
                        {preview.editorial_collection.name}
                      </span>
                    )}
                    <span className="preview-year">{preview.year}</span>
                    <span className="preview-pages">{preview.pages} pages</span>
                  </div>
                  <div className="preview-price">{fmt(preview.price)} FCFA</div>
                  <div className="preview-details-grid">
                    <div><span className="preview-label">Editeur</span><span>{preview.publisher}</span></div>
                    <div><span className="preview-label">Direction éditoriale</span><span>{preview.editorial_director || 'Non renseignée'}</span></div>
                    <div><span className="preview-label">Parution</span><span>{preview.publication_date || preview.year}</span></div>
                    <div><span className="preview-label">Langue</span><span>{preview.language}</span></div>
                    <div><span className="preview-label">ISBN</span><span>{preview.isbn}</span></div>
                    <div><span className="preview-label">Note</span><span>{preview.rating} / 5</span></div>
                  </div>
                  {preview.tags && preview.tags.length > 0 && (
                    <div className="preview-tags">
                      {(Array.isArray(preview.tags) ? preview.tags : []).map(t => (
                        <span key={t} className="tag-chip">{t}</span>
                      ))}
                    </div>
                  )}
                  {preview.description && <div className="preview-description">{preview.description}</div>}
                  {preview.quote && <blockquote className="preview-quote">« {preview.quote} »</blockquote>}
                </div>
              </div>
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
              <h3>{editId ? 'Modifier le livre' : 'Ajouter un livre'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <div className="form-grid">
                <FormField label="Titre" error={errors.title}>
                  <input className="form-input" value={form.title} onChange={e => handleChange('title', e.target.value)} />
                </FormField>
                <FormField label="Auteur" error={errors.author_id}>
                  <select className="form-select" value={form.author_id} onChange={e => handleChange('author_id', e.target.value)}>
                    <option value="">-- Choisir --</option>
                    {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Collection éditoriale" error={errors.editorial_collection_id}>
                  <select className="form-select" value={form.editorial_collection_id || ''} onChange={e => handleChange('editorial_collection_id', e.target.value)}>
                    <option value="">-- Non assignée --</option>
                    {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Nom auteur" error={errors.author_name}>
                  <input className="form-input" value={form.author_name} onChange={e => handleChange('author_name', e.target.value)} />
                </FormField>
                <FormField label="Prix (FCFA)" error={errors.price}>
                  <input type="number" className="form-input" value={form.price} onChange={e => handleChange('price', e.target.value)} />
                </FormField>
                <FormField label="Categorie" error={errors.category}>
                  <select className="form-select" value={form.category} onChange={e => handleChange('category', e.target.value)}>
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Note (0-5)" error={errors.rating}>
                  <input type="number" step="0.1" min="0" max="5" className="form-input" value={form.rating} onChange={e => handleChange('rating', e.target.value)} />
                </FormField>
                <FormField label="Annee" error={errors.year}>
                  <input type="number" className="form-input" value={form.year} onChange={e => handleChange('year', e.target.value)} />
                </FormField>
                <FormField label="Date de parution" error={errors.publication_date}>
                  <input type="date" className="form-input" value={form.publication_date || ''} onChange={e => handleChange('publication_date', e.target.value)} />
                </FormField>
                <FormField label="Pages" error={errors.pages}>
                  <input type="number" className="form-input" value={form.pages} onChange={e => handleChange('pages', e.target.value)} />
                </FormField>
                <FormField label="Editeur" error={errors.publisher}>
                  <input className="form-input" value={form.publisher} onChange={e => handleChange('publisher', e.target.value)} />
                </FormField>
                <FormField label="Directeur éditorial" error={errors.editorial_director}>
                  <input className="form-input" value={form.editorial_director || ''} onChange={e => handleChange('editorial_director', e.target.value)} />
                </FormField>
                <FormField label="Langue" error={errors.language}>
                  <input className="form-input" value={form.language} onChange={e => handleChange('language', e.target.value)} />
                </FormField>
                <FormField label="ISBN" error={errors.isbn}>
                  <input className="form-input" value={form.isbn} onChange={e => handleChange('isbn', e.target.value)} />
                </FormField>
                <FormField label="Couleur" error={errors.color}>
                  <input type="color" className="form-input" value={form.color} onChange={e => handleChange('color', e.target.value)} style={{ height: 40, padding: 4 }} />
                </FormField>
                <FormField label="Image couverture (URL)" error={errors.cover_image}>
                  <input className="form-input" value={form.cover_image || ''} onChange={e => handleChange('cover_image', e.target.value)} placeholder="/images/covers/mon-livre.svg" />
                </FormField>
                <FormField label="Ou upload couverture" error={errors.cover_upload}>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp,.svg" className="form-input" onChange={e => setCoverUpload(e.target.files?.[0] || null)} />
                </FormField>
                <FormField label="Fichier eBook PDF" error={errors.ebook_pdf}>
                  <input type="file" accept=".pdf" className="form-input" onChange={e => setEbookPdfUpload(e.target.files?.[0] || null)} />
                </FormField>
                <FormField label="Fichier eBook EPUB" error={errors.ebook_epub}>
                  <input type="file" accept=".epub" className="form-input" onChange={e => setEbookEpubUpload(e.target.files?.[0] || null)} />
                </FormField>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
                  <input type="checkbox" id="local" checked={form.local} onChange={e => handleChange('local', e.target.checked)} className="form-checkbox" />
                  <label htmlFor="local" className="form-check-label">Livre local (Burkina Faso)</label>
                </div>
                <FormField label="Tags (separes par virgule)" error={errors.tags} full>
                  <input className="form-input" value={form.tags} onChange={e => handleChange('tags', e.target.value)} placeholder="fiction, afrique, aventure" />
                </FormField>
                <FormField label="Description" error={errors.description} full>
                  <textarea className="form-textarea" rows={3} value={form.description} onChange={e => handleChange('description', e.target.value)} />
                </FormField>
                <FormField label="Resume" error={errors.summary} full>
                  <textarea className="form-textarea" rows={3} value={form.summary} onChange={e => handleChange('summary', e.target.value)} />
                </FormField>
                <FormField label="Extrait public" error={errors.public_excerpt} full>
                  <textarea className="form-textarea" rows={5} value={form.public_excerpt || ''} onChange={e => handleChange('public_excerpt', e.target.value)} placeholder="Extrait affiché gratuitement sur la fiche livre..." />
                </FormField>
                <FormField label="Citation" error={errors.quote} full>
                  <textarea className="form-textarea" rows={2} value={form.quote} onChange={e => handleChange('quote', e.target.value)} />
                </FormField>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn-admin btn-secondary" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn-admin btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : editId ? 'Mettre a jour' : 'Creer le livre'}
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
