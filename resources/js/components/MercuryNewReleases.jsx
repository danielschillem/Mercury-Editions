import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Icon, { StarRating, FlagBF } from './Icons';

/**
 * Section "Nouveautés Mercury 2026" – carousel horizontal des 12 ouvrages réels.
 */
export default function MercuryNewReleases() {
  const { books, openModal } = useApp();
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const newReleases = [...books]
    .filter((book) => String(book.publisher || '').toLowerCase().includes('mercury'))
    .sort((left, right) => {
      const yearDelta = Number(right.year || 0) - Number(left.year || 0);
      if (yearDelta !== 0) return yearDelta;
      return Number(right.id || 0) - Number(left.id || 0);
    });

  const updateScrollButtons = () => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    updateScrollButtons();
    carouselRef.current?.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      carouselRef.current?.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [newReleases]);

  const scroll = (direction) => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = 300;
    el.scrollBy({ left: direction * cardWidth * 2, behavior: 'smooth' });
  };

  if (newReleases.length === 0) return null;

  return (
    <section className="mercury-new-releases" id="nouveautes">
      <div className="inner">
        <div className="section-header">
          <div className="section-tag mercury-tag">
            <Icon name="sparkles" size={14} /> Nouveautés Mercury
          </div>
          <h2 className="section-title">
            Collection <em>Mercury Editions</em>
          </h2>
          <p className="section-subtitle">
            Retrouvez en priorité les ouvrages Mercury les plus récents, qu'ils soient de 2026 ou d'un autre millésime déjà importé dans le catalogue.
          </p>
        </div>

        <div className="carousel-wrapper">
          {canScrollLeft && (
            <button
              className="carousel-btn carousel-btn-left"
              onClick={() => scroll(-1)}
              aria-label="Défiler à gauche"
            >
              <Icon name="chevron-left" size={24} />
            </button>
          )}

          <div className="carousel-track" ref={carouselRef}>
            {newReleases.map((book) => (
              <div
                key={book.id}
                className="release-card"
                onClick={() => openModal('bookDetail', book.id)}
                style={{ '--accent': book.color }}
              >
                <div className="release-cover">
                  {book.cover_image ? (
                    <img src={book.cover_image} alt={book.title} onError={(e) => { e.target.onerror = null; e.target.src = '/images/covers/placeholder.svg'; }} />
                  ) : (
                    <div
                      className="release-cover-placeholder"
                      style={{
                        background: `linear-gradient(135deg, ${book.color}, ${book.color}CC)`,
                      }}
                    >
                      <span>{book.title}</span>
                    </div>
                  )}
                  <div className="release-overlay">
                    <span className="release-cta">Découvrir</span>
                  </div>
                  {book.local && (
                    <div className="release-local-badge">
                      <FlagBF size={10} /> BF
                    </div>
                  )}
                </div>
                <div className="release-info">
                  <div className="release-category">{book.category}</div>
                  <h4 className="release-title">{book.title}</h4>
                  <div className="release-author">{book.author_name}</div>
                  <div className="release-meta">
                    <StarRating rating={book.rating} />
                    <span className="release-rating">{book.rating}</span>
                    <span className="release-pages">{book.pages} p.</span>
                  </div>
                  <div className="release-price">
                    {book.price.toLocaleString()} <small>FCFA</small>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {canScrollRight && (
            <button
              className="carousel-btn carousel-btn-right"
              onClick={() => scroll(1)}
              aria-label="Défiler à droite"
            >
              <Icon name="chevron-right" size={24} />
            </button>
          )}
        </div>

        <div className="carousel-dots">
          <span className="carousel-hint">
            <Icon name="hand-pointer" size={14} /> Faites défiler pour voir tous les ouvrages
          </span>
        </div>
      </div>
    </section>
  );
}
