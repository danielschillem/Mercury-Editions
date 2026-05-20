import './bootstrap';
import '../css/account.css';
import { createRoot } from 'react-dom/client';
import { useEffect, useState, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import AnnouncementBanner from './components/AnnouncementBanner';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PublishingHouse from './components/PublishingHouse';

// Lazy loaded components pour performance
const FeaturedSection = lazy(() => import('./components/FeaturedSection'));
const LatestReleases = lazy(() => import('./components/LatestReleases'));
const AuthorsSection = lazy(() => import('./components/AuthorsSection').then(m => ({ default: m.default })));
const AuthorProfile = lazy(() => import('./components/AuthorsSection').then(m => ({ default: m.AuthorProfile })));
const Catalog = lazy(() => import('./components/Catalog').then(m => ({ default: m.default })));
const BookDetail = lazy(() => import('./components/Catalog').then(m => ({ default: m.BookDetail })));
const CartPanel = lazy(() => import('./components/CartPanel'));
const Checkout = lazy(() => import('./components/Checkout'));
const MyLibrary = lazy(() => import('./components/MyLibrary'));
const Reader = lazy(() => import('./components/Reader'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const AccountPage = lazy(() => import('./components/AccountPage'));
const ContactModal = lazy(() => import('./components/ContactModal'));
const ManuscriptSubmissionModal = lazy(() => import('./components/ManuscriptSubmissionModal'));

// Loading skeleton pour lazy components
function SectionLoader() {
  return (
    <div className="section-loader" style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
      <div className="skeleton" style={{ width: '100%', maxWidth: '1200px', height: '300px', borderRadius: '16px' }} />
    </div>
  );
}

function ModalLoader() {
  return (
    <div style={{ 
      position: 'fixed', inset: 0, background: 'var(--overlay)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
    }}>
      <div className="skeleton" style={{ width: '90%', maxWidth: '500px', height: '400px', borderRadius: '24px' }} />
    </div>
  );
}

// Debug logging - silenced in production
const isDev = import.meta.env.DEV;
const log = (...args) => isDev && console.log('[Mercury]', ...args);

function Footer() {
    const toast = useToast();
    const { openModal } = useApp();
    const [nlEmail, setNlEmail] = useState('');
    const [nlLoading, setNlLoading] = useState(false);

    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (!section) return;

        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.location.hash) {
            history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        }
    };

    const handleNewsletter = async (e) => {
        e.preventDefault();
        if (!nlEmail) return;
        setNlLoading(true);
        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ email: nlEmail }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Inscription réussie !');
                setNlEmail('');
            } else {
                toast.error(data.message || 'Erreur lors de l\'inscription.');
            }
        } catch {
            toast.error('Erreur réseau.');
        } finally {
            setNlLoading(false);
        }
    };

    return (
        <footer>
            <div className="footer-inner">
                <div className="footer-brand">
                    <div className="nav-logo">
                        <img src="/images/logo/logo.png" alt="Mercury Editions" className="nav-logo-img" />
                    </div>
                    <p>Maison d'édition burkinabè: nous publions, accompagnons et diffusons des livres papier et numériques portés par les voix du Faso.</p>
                </div>
                <div className="footer-col">
                    <h4>Navigation</h4>
                    <a href="#accueil" onClick={(e) => { e.preventDefault(); scrollToSection('accueil'); }}>Accueil</a>
                    <a href="#maison" onClick={(e) => { e.preventDefault(); scrollToSection('maison'); }}>Maison d'édition</a>
                    <a href="#auteurs" onClick={(e) => { e.preventDefault(); scrollToSection('auteurs'); }}>Auteurs</a>
                    <a href="#catalogue" onClick={(e) => { e.preventDefault(); scrollToSection('catalogue'); }}>Catalogue</a>
                </div>
                <div className="footer-col">
                    <h4>Édition</h4>
                    <a href="#" onClick={(e) => { e.preventDefault(); openModal('manuscriptSubmission'); }}>Soumettre un manuscrit</a>
                    <a href="mailto:droits@mercury-editions.bf">Droits & diffusion</a>
                    <a href="#maison" onClick={(e) => { e.preventDefault(); scrollToSection('maison'); }}>Nos collections</a>
                </div>
                <div className="footer-col">
                    <h4>Contact</h4>
                    <a href="mailto:contact@mercury-editions.bf">contact@mercury-editions.bf</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); openModal('contact'); }}>Nous écrire</a>
                </div>
                <div className="footer-col footer-newsletter">
                    <h4>Newsletter</h4>
                    <p>Recevez nos nouveautés et promotions.</p>
                    <form className="newsletter-form" onSubmit={handleNewsletter}>
                        <input type="email" placeholder="Votre email" value={nlEmail} onChange={(e) => setNlEmail(e.target.value)} required />
                        <button type="submit" disabled={nlLoading}>{nlLoading ? '...' : '→'}</button>
                    </form>
                </div>
            </div>
            <div className="footer-bottom">
                <span>© 2026 MUSIC Ismael — Mercury Editions v1.0.0. Tous droits réservés.</span>
                <div className="footer-bottom-links">
                    <a href="#" onClick={(e) => e.preventDefault()}>Mentions légales</a>
                    <a href="#" onClick={(e) => e.preventDefault()}>Politique de confidentialité</a>
                </div>
            </div>
        </footer>
    );
}

function App() {
    const { activeModal, modalData, closeModal, replacePurchasesFromServer, syncCartFromServer, saveCartToServer, cart } = useApp();
    const { user, fetchPurchases } = useAuth();

    useEffect(() => {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        if (import.meta.env.DEV) {
            navigator.serviceWorker.getRegistrations()
                .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
                .catch(() => {});

            if ('caches' in window) {
                caches.keys()
                    .then((keys) => Promise.all(keys
                        .filter((key) => key.startsWith('mercury-cache-'))
                        .map((key) => caches.delete(key))))
                    .catch(() => {});
            }

            return;
        }

        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }, []);

    // Sync purchases and cart from server when user is authenticated
    useEffect(() => {
        if (user) {
            fetchPurchases().then(replacePurchasesFromServer).catch(() => {});
            syncCartFromServer();
        }
    }, [user, fetchPurchases, replacePurchasesFromServer, syncCartFromServer]);

    // Save cart to server when cart changes (debounced)
    useEffect(() => {
        if (user) saveCartToServer();
    }, [cart, user]);

    return (
        <>
            <AnnouncementBanner />
            <Navbar />
            <Hero />
            <PublishingHouse />
            <ErrorBoundary>
                <Suspense fallback={<SectionLoader />}>
                    <FeaturedSection />
                </Suspense>
            </ErrorBoundary>
            <ErrorBoundary>
                <Suspense fallback={<SectionLoader />}>
                    <LatestReleases />
                </Suspense>
            </ErrorBoundary>
            <ErrorBoundary>
                <Suspense fallback={<SectionLoader />}>
                    <AuthorsSection />
                </Suspense>
            </ErrorBoundary>
            <ErrorBoundary>
                <Suspense fallback={<SectionLoader />}>
                    <Catalog />
                </Suspense>
            </ErrorBoundary>
            <Footer />

            <Suspense fallback={<ModalLoader />}>
                {activeModal === 'cart' && <CartPanel />}
                {activeModal === 'checkout' && <Checkout />}
                {activeModal === 'bookDetail' && <BookDetail bookId={modalData} onClose={closeModal} />}
                {activeModal === 'authorProfile' && <AuthorProfile authorId={modalData} onClose={closeModal} />}
                {activeModal === 'library' && <MyLibrary onClose={closeModal} />}
                {activeModal === 'reader' && (
                    <Reader
                        bookId={typeof modalData === 'object' && modalData !== null ? modalData.bookId : modalData}
                        returnTo={typeof modalData === 'object' && modalData !== null ? modalData.returnTo : 'library'}
                        onClose={closeModal}
                    />
                )}
                {activeModal === 'auth' && <AuthModal onClose={closeModal} intent={modalData} />}
                {activeModal === 'account' && <AccountPage onClose={closeModal} initialTab={modalData || 'overview'} />}
                {activeModal === 'contact' && <ContactModal onClose={closeModal} />}
                {activeModal === 'manuscriptSubmission' && <ManuscriptSubmissionModal onClose={closeModal} />}
            </Suspense>
        </>
    );
}

log('About to mount React app...');

try {
    const rootElement = document.getElementById('app');
    log('Root element:', rootElement ? 'found' : 'NOT FOUND');
    
    if (!rootElement) {
        console.error('[Mercury] FATAL: #app element not found!');
        document.body.innerHTML = '<div style="padding:2rem;color:red;font-family:sans-serif"><h1>Error: #app element not found</h1><p>The application cannot start.</p></div>';
    } else {
        createRoot(rootElement).render(
            <ErrorBoundary>
                <ThemeProvider>
                    <AppProvider>
                        <AuthProvider>
                            <ToastProvider>
                                <App />
                            </ToastProvider>
                        </AuthProvider>
                    </AppProvider>
                </ThemeProvider>
            </ErrorBoundary>
        );
        log('React app mounted successfully!');
    }
} catch (err) {
    console.error('[Mercury] Mount error:', err);
    document.body.innerHTML = '<div style="padding:2rem;color:red;font-family:sans-serif"><h1>Application Error</h1><pre>' + err.message + '</pre></div>';
}
