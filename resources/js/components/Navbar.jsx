import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Icon from './Icons';

export default function Navbar() {
  const { books, cart, cartCount, openModal } = useApp();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(typeof Notification !== 'undefined' && Notification.permission === 'granted');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    const onResize = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); };
  }, []);

  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || books.length === 0) return;

    const latest = [...books].sort((a, b) => b.year - a.year || b.id - a.id)[0];
    if (!latest) return;

    const key = 'mercury_last_release_notified';
    const last = localStorage.getItem(key);
    const currentMarker = `${latest.id}:${latest.year}`;

    if (!last) {
      localStorage.setItem(key, currentMarker);
      return;
    }

    if (last !== currentMarker) {
      new Notification('Nouvelle sortie Mercury Editions', {
        body: `${latest.title} de ${latest.author_name} est maintenant disponible.`,
        icon: '/images/logo/logo.png',
      });
      localStorage.setItem(key, currentMarker);
    }
  }, [books]);

  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotifEnabled(permission === 'granted');
    if (permission === 'granted') {
      new Notification('Notifications activées', {
        body: 'Vous serez alerté des nouvelles parutions Mercury Editions.',
        icon: '/images/logo/logo.png',
      });
    }
  };

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.location.hash) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  return (
    <nav id="mainNav" className={scrolled ? 'scrolled' : ''}>
      <div className="nav-inner">
        <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); scrollToSection('accueil'); }}>
          <img src="/images/logo/logo.png" alt="Mercury Editions" className="nav-logo-img" />
        </a>
        <ul className={`nav-links${mobileOpen ? ' mobile-open' : ''}`} onClick={() => setMobileOpen(false)}>
          <li><a href="#accueil" onClick={(e) => { e.preventDefault(); scrollToSection('accueil'); }}>Accueil</a></li>
          <li><a href="#maison" onClick={(e) => { e.preventDefault(); scrollToSection('maison'); }}>Maison</a></li>
          <li><a href="#vedette" onClick={(e) => { e.preventDefault(); scrollToSection('vedette'); }}>En vedette</a></li>
          <li><a href="#parutions" onClick={(e) => { e.preventDefault(); scrollToSection('parutions'); }}>Parutions</a></li>
          <li><a href="#auteurs" onClick={(e) => { e.preventDefault(); scrollToSection('auteurs'); }}>Auteurs</a></li>
          <li><a href="#catalogue" onClick={(e) => { e.preventDefault(); scrollToSection('catalogue'); }}>Catalogue</a></li>
          <li><a href="#paiement" onClick={(e) => { e.preventDefault(); scrollToSection('paiement'); }}>Paiement</a></li>
          <li><a href="#" onClick={e => { e.preventDefault(); openModal(user ? 'account' : 'auth', user ? 'library' : null); }} style={{ color: 'var(--gold)' }}>Mes achats</a></li>
        </ul>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="nav-util-btn" onClick={toggleTheme} title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}>
            <Icon name={isDark ? 'sun' : 'moon'} size={16} />
          </button>
          <button className={`nav-util-btn${notifEnabled ? ' active' : ''}`} onClick={enableNotifications} title="Activer les notifications">
            <Icon name="bell" size={16} />
          </button>
          {user ? (
            <button className="nav-account-btn" onClick={() => openModal('account')} title="Mon compte">
              <div className="nav-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <span className="nav-account-name">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button className="nav-login-btn" onClick={() => openModal('auth')}>
              <Icon name="user" size={16} /> <span>Connexion</span>
            </button>
          )}
          <button className="nav-cart" onClick={() => openModal('cart')}>
            <Icon name="cart" size={20} />
            <div className="cart-badge">{cartCount}</div>
          </button>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <Icon name="close" size={22} /> : <Icon name="menu" size={22} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
