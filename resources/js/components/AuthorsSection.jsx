import { useApp } from '../context/AppContext';
import Icon from './Icons';

export default function AuthorsSection() {
  const { books, authors, openModal } = useApp();

  return (
    <section className="authors-section" id="auteurs">
      <div className="inner">
        <div className="section-header">
          <div className="section-tag">Plumes du Faso</div>
          <h2 className="section-title">Nos auteurs <em>à l'honneur</em></h2>
          <p className="section-subtitle">Des voix authentiques qui portent l'héritage culturel et la vision moderne du Burkina Faso à travers le monde.</p>
        </div>
        <div className="authors-grid">
          {authors.map(a => {
            const authorBooks = books.filter(b => b.author_id === a.id);
            return (
              <div key={a.id} className="author-card" onClick={() => openModal('authorProfile', a.id)}>
                <div className="author-card-header" style={{ background: `linear-gradient(135deg, ${a.color}, ${a.color}CC)` }}>
                  <div className="author-avatar"><Icon name={a.icon} size={32} /></div>
                </div>
                <div className="author-card-body">
                  <div className="author-name">{a.name}</div>
                  <div className="author-origin">{a.origin}</div>
                  <div className="author-genre">{a.genres.slice(0, 2).join(' • ')}</div>
                  <p className="author-bio">{a.bio.replace(/<[^>]*>/g, '').substring(0, 140)}...</p>
                  <div className="author-books-count"> {authorBooks.length} ouvrages disponibles</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AuthorProfile({ authorId, onClose }) {
  const { books, authors, openModal, closeModal } = useApp();

  const a = authors.find(x => x.id === authorId);
  if (!a) return null;

  const authorBooks = books.filter(b => b.author_id === a.id);
  const lifespan = a.died ? `${a.born} — ${a.died}` : `Né(e) en ${a.born}`;

  return (
    <div className="author-profile-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="author-profile-modal">
        <div className="ap-hero" style={{ background: `linear-gradient(135deg, ${a.color}, ${a.color}DD)` }}>
          <button className="ap-close" onClick={onClose}><Icon name="close" size={20} /></button>
          <div className="ap-avatar"><Icon name={a.icon} size={48} /></div>
          <div className="ap-info">
            <h1 className="ap-name">{a.name}</h1>
            <div className="ap-origin">{a.origin} · {lifespan}</div>
            <div className="ap-genre-tags">
              {a.genres.map(g => <span key={g} className="ap-genre-tag">{g}</span>)}
            </div>
            <div className="ap-stats-row">
              <div><div className="ap-stat-val">{authorBooks.length}</div><div className="ap-stat-label">Ouvrages</div></div>
              <div><div className="ap-stat-val">{a.awards.length}</div><div className="ap-stat-label">Distinctions</div></div>
              <div><div className="ap-stat-val">{a.timeline.length}</div><div className="ap-stat-label">Étapes clés</div></div>
            </div>
          </div>
        </div>
        <div className="ap-body">
          <h3 className="ap-section-title"> Biographie</h3>
          <div className="ap-bio" dangerouslySetInnerHTML={{ __html: a.bio }} />
          <h3 className="ap-section-title"> Distinctions & Prix</h3>
          <div className="ap-awards">
            {a.awards.map((aw, i) => <div key={i} className="ap-award">{aw}</div>)}
          </div>
          <h3 className="ap-section-title"> Parcours</h3>
          <div className="ap-timeline">
            {a.timeline.map((t, i) => (
              <div key={i} className="ap-timeline-item">
                <div className="ap-timeline-year">{t.year}</div>
                <div className="ap-timeline-text">{t.text}</div>
              </div>
            ))}
          </div>
        </div>
        {authorBooks.length > 0 && (
          <div className="ap-bibliography">
            <h3 className="ap-section-title"> Bibliographie disponible</h3>
            <div className="ap-biblio-grid">
              {authorBooks.map(b => (
                <div key={b.id} className="ap-book-card" onClick={() => { onClose(); setTimeout(() => openModal('bookDetail', b.id), 300); }}>
                  <div className="ap-book-cover" style={{ background: b.cover_image ? 'transparent' : `linear-gradient(135deg, ${b.color}18, ${b.color}08)` }}>
                    {b.cover_image ? (
                      <img src={b.cover_image} alt={b.title} className="ap-book-cover-img" onError={(e) => { e.target.onerror = null; e.target.src = '/images/covers/placeholder.svg'; }} />
                    ) : (
                      <div className="ap-book-mini" style={{ background: `linear-gradient(135deg, ${b.color}, ${b.color}CC)` }}>
                        <span>{b.title}</span>
                      </div>
                    )}
                  </div>
                  <div className="ap-book-info">
                    <div className="ap-book-title">{b.title}</div>
                    <div className="ap-book-year">{b.year} · {b.pages} pages</div>
                    <div className="ap-book-price">{b.price.toLocaleString()} FCFA</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
