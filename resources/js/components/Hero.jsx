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
          <div className="hero-badge">Librairie Numérique #1 au Burkina</div>
          <h1>Découvrez la <em>richesse</em> littéraire du Burkina Faso</h1>
          <p className="hero-desc">La première plateforme dédiée aux auteurs burkinabè.</p>
          <div className="hero-actions">
            <a href="#catalogue" className="btn btn-primary" onClick={(e) => { e.preventDefault(); scrollToSection('catalogue'); }}>Explorer le catalogue <Icon name="arrowRight" size={16} /></a>
            <a href="#auteurs" className="btn btn-outline" onClick={(e) => { e.preventDefault(); scrollToSection('auteurs'); }}>Nos auteurs</a>
          </div>
          <div className="hero-stats">
            <div>
              <div className="hero-stat-num">500+</div>
              <div className="hero-stat-label">Livres disponibles</div>
            </div>
            <div>
              <div className="hero-stat-num">120+</div>
              <div className="hero-stat-label">Auteurs locaux</div>
            </div>
            <div>
              <div className="hero-stat-num">50K+</div>
              <div className="hero-stat-label">Lecteurs actifs</div>
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
