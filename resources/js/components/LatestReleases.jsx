import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Icon, { FlagBF } from './Icons';

export default function LatestReleases() {
  const { books, openModal } = useApp();
  const trackRef = useRef(null);
  const [paused, setPaused] = useState(false);

  // Sort by year desc for "latest releases"
  const latest = [...books].sort((a, b) => {
    const yearDelta = Number(b.year || 0) - Number(a.year || 0);
    if (yearDelta !== 0) return yearDelta;
    return Number(b.id || 0) - Number(a.id || 0);
  });
  // Duplicate for infinite scroll illusion
  const doubled = [...latest, ...latest];

  // Auto-scroll animation
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let animId;
    let scrollPos = 0;
    const speed = 0.5; // px per frame

    const step = () => {
      if (!paused) {
        scrollPos += speed;
        // Reset when first set scrolls out
        const halfWidth = track.scrollWidth / 2;
        if (scrollPos >= halfWidth) scrollPos = 0;
        track.style.transform = `translateX(-${scrollPos}px)`;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [paused, books]);

  return (
    <section className="latest-section" id="parutions">
      <div className="inner">
        <div className="section-header">
          <div className="section-tag">Nouveautés</div>
          <h2 className="section-title">Dernières <em>parutions</em></h2>
          <p className="section-subtitle">Les œuvres les plus récentes de nos auteurs. Défilement continu — survolez pour explorer.</p>
        </div>
      </div>

      <div
        className="latest-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="latest-fade latest-fade-left"></div>
        <div className="latest-fade latest-fade-right"></div>
        <div className="latest-track" ref={trackRef}>
          {doubled.map((book, i) => (
            <div
              key={`${book.id}-${i}`}
              className="latest-card"
              onClick={() => openModal('bookDetail', book.id)}
              style={{ '--accent': book.color }}
            >
              {book.cover_image ? (
                <div className="lc-cover-wrap">
                  <img src={book.cover_image} alt={book.title} className="lc-cover-img" onError={(e) => { e.target.onerror = null; e.target.src = '/images/covers/placeholder.svg'; }} />
                  <div className="lc-year-badge">{book.year}</div>
                </div>
              ) : (
                <div className="lc-cover" style={{ background: `linear-gradient(135deg, ${book.color}, ${book.color}CC)` }}>
                  <div className="lc-year-badge">{book.year}</div>
                  <div className="lc-cover-title">{book.title}</div>
                </div>
              )}
              <div className="lc-info">
                <div className="lc-title">{book.title}</div>
                <div className="lc-author">{book.author_name}</div>
                <div className="lc-meta">
                  <span className="lc-category">{book.category}</span>
                  <span className="lc-pages">{book.pages} p.</span>
                </div>
                <div className="lc-price">{book.price.toLocaleString()} <small>FCFA</small></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
