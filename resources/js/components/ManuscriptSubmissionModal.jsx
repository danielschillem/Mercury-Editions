import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import Icon from './Icons';

const initialForm = {
  author_name: '',
  email: '',
  phone: '',
  title: '',
  collection: 'litterature-recits',
  genre: '',
  page_count: '',
  manuscript_url: '',
  synopsis: '',
  author_note: '',
};

const fallbackCollections = [
  { slug: 'litterature-recits', name: 'Littérature & récits' },
  { slug: 'savoirs-societe', name: 'Savoirs & société' },
  { slug: 'jeunesse-transmission', name: 'Jeunesse & transmission' },
];

export default function ManuscriptSubmissionModal({ onClose }) {
  const toast = useToast();
  const [form, setForm] = useState(initialForm);
  const [collections, setCollections] = useState(fallbackCollections);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/editorial-collections', { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setCollections(data);
        setForm((prev) => data.some((collection) => collection.slug === prev.collection)
          ? prev
          : { ...prev, collection: data[0].slug });
      })
      .catch(() => {});
  }, []);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      page_count: form.page_count ? Number(form.page_count) : null,
      phone: form.phone || null,
      genre: form.genre || null,
      manuscript_url: form.manuscript_url || null,
      author_note: form.author_note || null,
    };

    try {
      const res = await fetch('/api/manuscripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Manuscrit reçu.');
        onClose();
        return;
      }

      const errors = data.errors ? Object.values(data.errors).flat().join(' ') : data.message;
      toast.error(errors || 'Impossible d’envoyer le manuscrit.');
    } catch {
      toast.error('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="contact-modal manuscript-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="contact-modal-header">
          <Icon name="scroll" size={24} />
          <h2>Soumettre un manuscrit</h2>
          <p>Présentez votre projet à l’équipe éditoriale Mercury.</p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-form-row">
            <div className="contact-field">
              <label>Nom de l'auteur</label>
              <input type="text" value={form.author_name} onChange={(e) => set('author_name', e.target.value)} placeholder="Votre nom complet" required />
            </div>
            <div className="contact-field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="votre@email.com" required />
            </div>
          </div>

          <div className="contact-form-row">
            <div className="contact-field">
              <label>Téléphone</label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+226 70 00 00 00" />
            </div>
            <div className="contact-field">
              <label>Titre du manuscrit</label>
              <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Titre provisoire ou définitif" required />
            </div>
          </div>

          <div className="contact-form-row">
            <div className="contact-field">
              <label>Collection visée</label>
              <select value={form.collection} onChange={(e) => set('collection', e.target.value)} required>
                {collections.map((collection) => (
                  <option key={collection.slug} value={collection.slug}>{collection.name}</option>
                ))}
              </select>
            </div>
            <div className="contact-field">
              <label>Genre</label>
              <input type="text" value={form.genre} onChange={(e) => set('genre', e.target.value)} placeholder="Roman, essai, poésie..." />
            </div>
          </div>

          <div className="contact-form-row">
            <div className="contact-field">
              <label>Nombre de pages</label>
              <input type="number" min="1" max="5000" value={form.page_count} onChange={(e) => set('page_count', e.target.value)} placeholder="120" />
            </div>
            <div className="contact-field">
              <label>Lien vers le manuscrit</label>
              <input type="url" value={form.manuscript_url} onChange={(e) => set('manuscript_url', e.target.value)} placeholder="Google Drive, Dropbox..." />
            </div>
          </div>

          <div className="contact-field">
            <label>Synopsis</label>
            <textarea rows={5} value={form.synopsis} onChange={(e) => set('synopsis', e.target.value)} placeholder="Résumez le sujet, l’intention et le public visé du manuscrit." required minLength={80} />
          </div>

          <div className="contact-field">
            <label>Note à l’équipe éditoriale</label>
            <textarea rows={3} value={form.author_note} onChange={(e) => set('author_note', e.target.value)} placeholder="Parcours, publication précédente, contexte du projet..." />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Envoi en cours...' : <><Icon name="send" size={16} /> Envoyer le manuscrit</>}
          </button>
        </form>
      </div>
    </div>
  );
}
