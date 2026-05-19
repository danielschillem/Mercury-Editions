import { useState, useEffect } from 'react';
import Icon from './Icons';

const announcements = [
  {
    id: 1,
    icon: '📚',
    text: 'Nouveau — « Les Soleils des Indépendances » disponible le 1er Avril 2026',
    highlight: '1er Avril',
    link: '#catalogue',
  },
  {
    id: 2,
    icon: '🎉',
    text: 'Lancement — Collection « Voix du Sahel » le 15 Avril 2026',
    highlight: '15 Avril',
    link: '#catalogue',
  },
  {
    id: 3,
    icon: '✍️',
    text: 'Événement — Rencontre avec les auteurs à Ouagadougou le 20 Avril 2026',
    highlight: '20 Avril',
    link: '#auteurs',
  },
];

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(i => (i + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  if (!visible) return null;

  const item = announcements[currentIndex];

  const scrollToSection = (sectionId) => {
    const cleanId = sectionId.replace('#', '');
    const section = document.getElementById(cleanId);
    if (!section) return;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.location.hash) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  return (
    <div className="announcement-banner">
      <div className="announcement-inner">
        <div className="announcement-content">
          <span className="announcement-icon">{item.icon}</span>
          <a href={item.link} className="announcement-text" onClick={(e) => { e.preventDefault(); scrollToSection(item.link); }}>
            {item.text}
          </a>
        </div>
        <div className="announcement-controls">
          {announcements.length > 1 && (
            <div className="announcement-dots">
              {announcements.map((_, i) => (
                <button
                  key={i}
                  className={`announcement-dot${i === currentIndex ? ' active' : ''}`}
                  onClick={() => setCurrentIndex(i)}
                  aria-label={`Annonce ${i + 1}`}
                />
              ))}
            </div>
          )}
          <button
            className="announcement-close"
            onClick={() => setVisible(false)}
            aria-label="Fermer la bannière"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
