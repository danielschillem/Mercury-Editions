import { useApp } from '../context/AppContext';
import Icon from './Icons';

export default function Hero() {
  const { openModal } = useApp();

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.location.hash) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  return (
    <section className="hero" id="accueil">
      <div className="hero-pattern"></div>
      <div className="hero-geometric"></div>
      <div className="hero-content">
        <div className="hero-text">
          <div className="hero-badge">Maison d'édition burkinabè</div>
          <h1>Publier les voix qui <em>font lire</em> le Burkina Faso</h1>
          <p className="hero-desc">Mercury Editions accompagne les auteurs, fabrique leurs livres et les diffuse en formats papier et numérique.</p>
          <div className="hero-actions">
            <a href="#catalogue" className="btn btn-primary" onClick={(e) => { e.preventDefault(); scrollToSection('catalogue'); }}>Explorer le catalogue <Icon name="arrowRight" size={16} /></a>
            <a href="#maison" className="btn btn-outline" onClick={(e) => { e.preventDefault(); scrollToSection('maison'); }}>Notre ligne éditoriale</a>
          </div>
          <div className="hero-stats">
            <div>
              <div className="hero-stat-num">3</div>
              <div className="hero-stat-label">Collections</div>
            </div>
            <div>
              <div className="hero-stat-num">2</div>
              <div className="hero-stat-label">Formats publiés</div>
            </div>
            <div>
              <div className="hero-stat-num">5</div>
              <div className="hero-stat-label">Étapes éditoriales</div>
            </div>
          </div>
        </div>
        <div className="hero-books">
          <div className="hero-book-stack">
            {[
              { id: 13, tag: 'Leadership', title: 'Le Capitaine Ibrahim Traoré a dit', author: 'Ibrahim Traoré', cover: '/images/covers/mercury/le-capitaine-ibrahim-traoré-à-dit.png' },
              { id: 14, tag: 'Biographie', title: 'Capitaine Thomas Sankara', author: 'Thomas Sankara', cover: '/images/covers/mercury/capitaine-thomas-sankara-à-la-découverte-dun-leader-charismatique.png' },
              { id: 16, tag: 'Inspiration', title: 'La Force d\'oser', author: 'Mariam V. Touré', cover: '/images/covers/mercury/la-force-doser.png' },
            ].map(b => (
              <div key={b.id} className="hero-book" onClick={() => openModal('bookDetail', b.id)} style={{ cursor: 'pointer' }}>
                <div className="hero-book-inner">
                  {b.cover && <img src={b.cover} alt={b.title} className="hero-book-cover" onError={(e) => { e.target.onerror = null; e.target.src = '/images/covers/placeholder.svg'; }} />}
                  <div className="hero-book-tag">{b.tag}</div>
                  <div className="hero-book-title">{b.title}</div>
                  <div className="hero-book-author">{b.author}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
