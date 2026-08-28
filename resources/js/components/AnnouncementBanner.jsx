import { useState, useEffect } from 'react';
import Icon from './Icons';

const announcements = [
  {
    id: 1,
    iconName: 'library',
    text: 'Nouveau catalogue Mercury — 49 œuvres désormais disponibles',
    highlight: '49 œuvres',
    link: '#catalogue',
  },
  {
    id: 2,
    iconName: 'celebrate',
    text: 'En vedette — « Le Capitaine Ibrahim Traoré a dit »',
    highlight: 'En vedette',
    link: '#catalogue',
  },
  {
    id: 3,
    iconName: 'pen',
    text: 'À découvrir — « Capitaine Thomas Sankara » et « La force d’oser »',
    highlight: 'À découvrir',
    link: '#vedette',
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
          <span className="announcement-icon"><Icon name={item.iconName} size={18} /></span>
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
