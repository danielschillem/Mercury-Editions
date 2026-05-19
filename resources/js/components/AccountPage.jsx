import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import Icon from './Icons';

const statusLabels = {
  pending: 'En attente',
  completed: 'Payée',
  failed: 'Échouée',
};

const statusColors = {
  pending: '#f59e0b',
  completed: '#059669',
  failed: '#dc2626',
};

function formatDate(value) {
  if (!value) return 'Date indisponible';
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function compactDate(value) {
  if (!value) return 'Date indisponible';
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  if (seconds < 60) return 'Moins d\'1 min';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
}

export default function AccountPage({ onClose, initialTab = 'overview' }) {
  const { user, logout, updateProfile, fetchOrders, fetchPurchases, resendVerification } = useAuth();
  const { books, purchasedBooks, replacePurchasesFromServer, openModal } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState(initialTab);
  const [orders, setOrders] = useState([]);
  const [lastReading, setLastReading] = useState(null);
  const [readingProgressByBook, setReadingProgressByBook] = useState({});
  const [readingStats, setReadingStats] = useState({
    total_reading_time: 0,
    books_in_progress: 0,
    books_finished: 0,
  });
  const [loadingData, setLoadingData] = useState(true);
  const [resending, setResending] = useState(false);

  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErrors, setProfileErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [receiptModal, setReceiptModal] = useState({ open: false, order: null, pdfUrl: null });

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let active = true;

    const readingLastPromise = fetch('/api/customer/reading-progress/last', {
      headers: { Accept: 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    })
      .then((response) => (response.ok ? response.json() : { last_reading: null }))
      .catch(() => ({ last_reading: null }));

    const readingListPromise = fetch('/api/customer/reading-progress', {
      headers: { Accept: 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    })
      .then((response) => (response.ok ? response.json() : { reading_list: [], stats: {} }))
      .catch(() => ({ reading_list: [], stats: {} }));

    Promise.all([fetchOrders(), fetchPurchases(), readingLastPromise, readingListPromise])
      .then(([ordersData, purchasesData, lastReadingData, readingData]) => {
        if (!active) return;
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        replacePurchasesFromServer(Array.isArray(purchasesData) ? purchasesData : []);
        setLastReading(lastReadingData?.last_reading || null);

        const normalizedList = Array.isArray(readingData?.reading_list) ? readingData.reading_list : [];
        const progressMap = normalizedList.reduce((acc, item) => {
          const bookId = Number(item?.book_id);
          if (Number.isInteger(bookId)) {
            acc[bookId] = item;
          }
          return acc;
        }, {});

        setReadingProgressByBook(progressMap);
        setReadingStats({
          total_reading_time: Math.max(0, Number(readingData?.stats?.total_reading_time) || 0),
          books_in_progress: Math.max(0, Number(readingData?.stats?.books_in_progress) || 0),
          books_finished: Math.max(0, Number(readingData?.stats?.books_finished) || 0),
        });
      })
      .catch(() => {
        if (!active) return;
        setOrders([]);
        replacePurchasesFromServer([]);
        setLastReading(null);
        setReadingProgressByBook({});
        setReadingStats({
          total_reading_time: 0,
          books_in_progress: 0,
          books_finished: 0,
        });
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });

    return () => {
      active = false;
    };
  }, [fetchOrders, fetchPurchases, replacePurchasesFromServer]);

  useEffect(() => {
    if (!user) return;
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
  }, [user]);

  const completedOrders = orders.filter((order) => order.status === 'completed');
  const libraryItems = useMemo(() => {
    const source = [];

    purchasedBooks.forEach((purchase) => {
      const book = books.find((entry) => Number(entry.id) === Number(purchase.bookId));
      if (!book) return;
      source.push({
        ...purchase,
        bookId: Number(purchase.bookId),
        format: purchase.format === 'physical' ? 'physical' : 'ebook',
        purchaseDate: purchase.purchaseDate,
        txnId: purchase.txnId || '',
        book,
      });
    });

    completedOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const bookId = Number(item.book_id);
        const book = books.find((entry) => Number(entry.id) === bookId) || item.book;
        if (!book) return;
        source.push({
          bookId,
          format: item.format === 'physical' ? 'physical' : 'ebook',
          purchaseDate: order.created_at,
          txnId: order.om_transaction_id || '',
          readSessions: 0,
          book,
        });
      });
    });

    const unique = new Map();
    source.forEach((item) => {
      const key = `${item.bookId}-${item.format}-${item.txnId || ''}`;
      if (!unique.has(key)) unique.set(key, item);
    });

    return Array.from(unique.values())
      .sort((a, b) => new Date(b.purchaseDate || 0) - new Date(a.purchaseDate || 0));
  }, [books, purchasedBooks, completedOrders]);

  const pendingOrders = orders.filter((order) => order.status === 'pending');
  const failedOrders = orders.filter((order) => order.status === 'failed');
  const pendingAmount = pendingOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const ebookCount = libraryItems.filter((item) => item.format === 'ebook').length;
  const readingSessions = libraryItems.reduce((sum, item) => sum + (item.readSessions || 0), 0);
  const recentOrder = orders[0];
  const featuredLibraryItem = libraryItems[0];
  const featuredProgress = featuredLibraryItem ? readingProgressByBook[featuredLibraryItem.bookId] : null;
  const quickReadItems = libraryItems.filter((item) => item.format === 'ebook').slice(0, 3);
  const quickReadBookId = Number(lastReading?.book_id || quickReadItems[0]?.bookId || 0) || null;
  const quickReadLabel = lastReading
    ? 'Reprendre ma dernière lecture'
    : (quickReadBookId ? 'Reprendre la lecture' : 'Ouvrir ma bibliothèque');
  const totalReadingTime = readingStats.total_reading_time || 0;
  const booksInProgressCount = readingStats.books_in_progress || 0;

  const currentMonthSpent = completedOrders
    .filter((order) => {
      const orderDate = new Date(order.created_at);
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const completionRate = orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0;
  const readingIntensity = ebookCount > 0
    ? Math.min(100, Math.round((readingSessions / Math.max(ebookCount * 3, 1)) * 100))
    : 0;

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setProfileMsg('');
    setProfileErrors({});

    try {
      await updateProfile(editName, editEmail, editPhone);
      toast.success('Profil mis à jour avec succès.');
      setProfileMsg('Profil mis à jour avec succès.');
    } catch (err) {
      if (err?.errors) setProfileErrors(err.errors);
      else setProfileMsg(err?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const openBookDetails = (bookId) => {
    onClose();
    openModal('bookDetail', bookId);
  };

  const openReader = (bookId) => {
    onClose();
    openModal('reader', { bookId, returnTo: 'account-library' });
  };

  const generateReceiptPDF = (order) => {
    if (!order) return null;

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 15;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // En-tête
      doc.setFontSize(18);
      doc.setTextColor(185, 28, 28); // Mercury Red
      doc.text('MERCURY EDITIONS', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Reçu d\'Achat', margin, yPosition);
      yPosition += 15;

      // Info commande
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`Référence : ${order.reference || '-'}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Date : ${formatDate(order.created_at)}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Transaction : ${order.om_transaction_id || '-'}`, margin, yPosition);
      yPosition += 12;

      // Client
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Client :', margin, yPosition);
      yPosition += 5;
      doc.setTextColor(0, 0, 0);
      doc.text(user?.name || '-', margin + 3, yPosition);
      yPosition += 4;
      doc.text(user?.email || '-', margin + 3, yPosition);
      yPosition += 10;

      // Articles
      doc.setFontSize(10);
      doc.setTextColor(185, 28, 28);
      doc.text('Articles', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      (order.items || []).forEach((item, index) => {
        const title = item.book?.title || `Livre #${item.book_id}`;
        const format = item.format === 'physical' ? 'Papier' : 'eBook';
        const price = (item.unit_price || 0).toLocaleString();
        const text = `${index + 1}. ${title} (${format})`;
        
        // Texte enveloppé
        const lines = doc.splitTextToSize(text, contentWidth - 5);
        lines.forEach((line, idx) => {
          if (idx === lines.length - 1) {
            doc.text(line, margin, yPosition);
            doc.text(price + ' FCFA', pageWidth - margin - 30, yPosition, { align: 'right' });
          } else {
            doc.text(line, margin, yPosition);
          }
          yPosition += 4;
        });
      });

      yPosition += 5;

      // Totaux
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;

      doc.setFontSize(8);
      doc.text('Frais Orange Money :', margin, yPosition);
      doc.text(`${(order.om_fees || 0).toLocaleString()} FCFA`, pageWidth - margin - 5, yPosition, { align: 'right' });
      yPosition += 6;

      doc.setFontSize(10);
      doc.setTextColor(185, 28, 28);
      doc.setFont(undefined, 'bold');
      doc.text('Total payé :', margin, yPosition);
      doc.text(`${(order.total_amount || 0).toLocaleString()} FCFA`, pageWidth - margin - 5, yPosition, { align: 'right' });
      yPosition += 12;

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont(undefined, 'normal');
      doc.text('Merci pour votre achat sur Mercury Editions.', pageWidth / 2, pageHeight - 15, { align: 'center' });

      return doc;
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Erreur lors de la génération du PDF.');
      return null;
    }
  };

  const viewReceipt = (order) => {
    if (!order || order.status !== 'completed') return;
    const doc = generateReceiptPDF(order);
    if (doc) {
      const pdfUrl = doc.output('bloburi');
      setReceiptModal({ open: true, order, pdfUrl });
    }
  };

  const downloadReceipt = (order) => {
    if (!order || order.status !== 'completed') return;
    const safeReference = String(order.reference || `CMD-${order.id || 'NA'}`).replace(/[^a-z0-9-_]+/gi, '_');
    const doc = generateReceiptPDF(order);
    if (doc) {
      doc.save(`recu-${safeReference}.pdf`);
    }
  };

  return (
    <>
      {receiptModal.open && (
        <div className="modal-overlay active" onClick={() => setReceiptModal({ open: false, order: null, pdfUrl: null })}>
          <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setReceiptModal({ open: false, order: null, pdfUrl: null })}><Icon name="close" size={18} /></button>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Reçu d'achat - {receiptModal.order?.reference}</h3>
              <iframe
                src={receiptModal.pdfUrl}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: '0',
                  minHeight: '500px',
                }}
                title="Reçu PDF"
              />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-outline" onClick={() => setReceiptModal({ open: false, order: null, pdfUrl: null })}>
                  Fermer
                </button>
                <button className="btn btn-red" onClick={() => { downloadReceipt(receiptModal.order); setReceiptModal({ open: false, order: null, pdfUrl: null }); }}>
                  <Icon name="download" size={14} /> Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="modal-overlay active" onClick={(event) => event.target.classList.contains('modal-overlay') && onClose()}>
        <div className="modal-content account-modal account-modal-premium">
        <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>

        <div className="account-shell">
          <section className="account-hero">
            <div className="account-hero-main">
              <div className="account-avatar account-avatar-lg">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div className="account-hero-copy">
                <span className="account-kicker">Espace client Mercury</span>
                <h2>{user?.name}</h2>
                <p>Retrouvez vos commandes, votre bibliothèque numérique et votre lecteur eBook depuis un seul espace.</p>
                <div className="account-identity-row">
                  <span><Icon name="mail" size={14} /> {user?.email}</span>
                  {user?.phone && <span><Icon name="smartphone" size={14} /> {user.phone}</span>}
                </div>
              </div>
            </div>

            <div className="account-hero-side">
              <div className="account-highlight-card">
                <span className="account-highlight-label">Dernière activité</span>
                <strong>{recentOrder ? recentOrder.reference : featuredLibraryItem?.book?.title || 'Aucune activité'}</strong>
                <p>{recentOrder ? `Commande du ${compactDate(recentOrder.created_at)}` : featuredLibraryItem ? `Lecture disponible depuis le ${compactDate(featuredLibraryItem.purchaseDate)}` : 'Commencez par ajouter un livre à votre panier.'}</p>
                <button className="btn btn-outline account-hero-action" onClick={() => setTab(recentOrder ? 'orders' : 'library')}>
                  {recentOrder ? 'Voir mes commandes' : 'Ouvrir ma bibliothèque'}
                </button>
              </div>
            </div>
          </section>

          {user && user.email_verified === false && (
            <div className="verification-banner verification-banner-premium">
              <span><Icon name="warning" size={16} /> Votre email n'est pas vérifié. Vérifiez votre boîte de réception pour sécuriser votre espace.</span>
              <button
                disabled={resending}
                onClick={async () => {
                  setResending(true);
                  try {
                    await resendVerification();
                    toast.success('Email de vérification renvoyé.');
                  } catch {
                    toast.error('Erreur lors de l\'envoi.');
                  } finally {
                    setResending(false);
                  }
                }}
              >
                {resending ? 'Envoi...' : 'Renvoyer l\'email'}
              </button>
            </div>
          )}

          <section className="account-stats account-stats-premium">
            <div className="account-stat">
              <div className="account-stat-icon"><Icon name="bookOpen" size={18} /></div>
              <div className="account-stat-value">{ebookCount}</div>
              <div className="account-stat-label">eBooks disponibles</div>
            </div>
            <div className="account-stat">
              <div className="account-stat-icon"><Icon name="library" size={18} /></div>
              <div className="account-stat-value">{libraryItems.length}</div>
              <div className="account-stat-label">Ouvrages acquis</div>
            </div>
            <div className="account-stat">
              <div className="account-stat-icon"><Icon name="book" size={18} /></div>
              <div className="account-stat-value">{readingSessions}</div>
              <div className="account-stat-label">Sessions de lecture</div>
            </div>
          </section>

          <section className="account-reader-strip">
            <article className="account-reader-progress-card">
              <div className="account-reader-progress-head">
                <span className="account-panel-kicker">Mode lecteur</span>
                <strong>{readingIntensity}% de rythme de lecture</strong>
              </div>
              <div className="account-reader-progress-track">
                <span style={{ width: `${readingIntensity}%` }} />
              </div>
              <div className="account-reader-progress-meta">
                <span><Icon name="bookOpen" size={13} /> {ebookCount} eBook{ebookCount > 1 ? 's' : ''} prêts</span>
                <span><Icon name="clock" size={13} /> {formatDuration(totalReadingTime)}</span>
                <span><Icon name="bookmark" size={13} /> {booksInProgressCount} en cours</span>
              </div>
            </article>

            <article className="account-reader-actions-card">
              <button
                className="account-reader-action-btn primary"
                onClick={() => {
                  if (quickReadBookId) {
                    openReader(quickReadBookId);
                    return;
                  }
                  setTab('library');
                }}
              >
                <Icon name="play" size={14} /> {quickReadLabel}
              </button>
              <button className="account-reader-action-btn" onClick={() => setTab('library')}>
                <Icon name="library" size={14} /> Mes livres
              </button>
              <button className="account-reader-action-btn" onClick={() => setTab('orders')}>
                <Icon name="cart" size={14} /> Mes commandes
              </button>
              <button className="account-reader-action-btn" onClick={() => setTab('profile')}>
                <Icon name="user" size={14} /> Mon profil
              </button>
            </article>
          </section>

          <div className="account-tabs account-tabs-premium">
            <button className={`account-tab${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>
              <Icon name="newspaper" size={14} /> Tableau de bord
            </button>
            <button className={`account-tab${tab === 'orders' ? ' active' : ''}`} onClick={() => setTab('orders')}>
              <Icon name="cart" size={14} /> Mes commandes
            </button>
            <button className={`account-tab${tab === 'library' ? ' active' : ''}`} onClick={() => setTab('library')}>
              <Icon name="library" size={14} /> Ma bibliothèque
            </button>
            <button className={`account-tab${tab === 'profile' ? ' active' : ''}`} onClick={() => setTab('profile')}>
              <Icon name="user" size={14} /> Mon profil
            </button>
          </div>

          {loadingData ? (
            <div className="account-loading"><div className="spinner"></div> Chargement de votre espace...</div>
          ) : (
            <>
              {tab === 'overview' && (
                <div className="account-tab-content account-overview-grid account-dashboard-modern">
                  <section className="account-panel account-panel-primary">
                    <div className="account-panel-head">
                      <div>
                        <span className="account-panel-kicker">Résumé</span>
                        <h3>Vue d’ensemble client</h3>
                      </div>
                      <button className="account-link-btn" onClick={() => setTab('orders')}>Tout voir</button>
                    </div>
                    <div className="account-overview-metrics account-overview-metrics-modern">
                      <div className="account-mini-stat">
                        <span>En attente</span>
                        <strong>{pendingOrders.length}</strong>
                      </div>
                      <div className="account-mini-stat">
                        <span>Réussite</span>
                        <strong>{completionRate}%</strong>
                      </div>
                      <div className="account-mini-stat">
                        <span>Échecs</span>
                        <strong>{failedOrders.length}</strong>
                      </div>
                      <div className="account-mini-stat">
                        <span>Panier en attente</span>
                        <strong>{pendingAmount.toLocaleString()} F</strong>
                      </div>
                      <div className="account-mini-stat">
                        <span>Dépenses mensuelles</span>
                        <strong>{currentMonthSpent.toLocaleString()} F</strong>
                      </div>
                      <div className="account-mini-stat">
                        <span>Bibliothèque</span>
                        <strong>{libraryItems.length} titre{libraryItems.length > 1 ? 's' : ''}</strong>
                      </div>
                    </div>
                    <div className="account-timeline">
                      {orders.length === 0 && libraryItems.length === 0 && (
                        <div className="account-empty account-empty-soft">
                          <Icon name="library" size={36} />
                          <p>Votre espace est encore vide.</p>
                          <button className="btn btn-red" onClick={onClose} style={{ marginTop: '1rem' }}>Découvrir le catalogue</button>
                        </div>
                      )}
                      {orders.slice(0, 4).map((order) => (
                        <div key={order.id} className="account-timeline-item">
                          <div className="account-timeline-date">{compactDate(order.created_at)}</div>
                          <div className="account-timeline-body">
                            <strong>{order.reference}</strong>
                            <span>{(order.items || []).length} article{(order.items || []).length > 1 ? 's' : ''} · {order.total_amount?.toLocaleString()} FCFA</span>
                          </div>
                          <span className="order-status" style={{ background: `${statusColors[order.status]}18`, color: statusColors[order.status] }}>
                            {statusLabels[order.status] || order.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="account-panel account-panel-accent">
                    <div className="account-panel-head">
                      <div>
                        <span className="account-panel-kicker">Lecture</span>
                        <h3>Espace lecteur</h3>
                      </div>
                      <button className="account-link-btn" onClick={() => setTab('library')}>Ma bibliothèque</button>
                    </div>
                    {featuredLibraryItem ? (
                      <div className="account-featured-book account-featured-book-modern">
                        {featuredLibraryItem.book.cover_image ? (
                          <img src={featuredLibraryItem.book.cover_image} alt={featuredLibraryItem.book.title} className="account-featured-cover" />
                        ) : (
                          <div className="account-featured-cover account-featured-cover-fallback" style={{ background: featuredLibraryItem.book.color }}>
                            {featuredLibraryItem.book.title.charAt(0)}
                          </div>
                        )}
                        <div className="account-featured-copy">
                          <span className="account-feature-badge">{featuredLibraryItem.format === 'ebook' ? 'eBook prêt à lire' : 'Commande papier'}</span>
                          <h4>{featuredLibraryItem.book.title}</h4>
                          <p>{featuredLibraryItem.book.author_name}</p>
                          <div className="account-feature-meta">
                            <span>
                              {featuredProgress
                                ? `${Math.round(featuredProgress.progress_percent || 0)}% lu`
                                : `${featuredLibraryItem.readSessions || 0} session${(featuredLibraryItem.readSessions || 0) > 1 ? 's' : ''}`}
                            </span>
                            <span>Acheté le {compactDate(featuredLibraryItem.purchaseDate)}</span>
                          </div>
                          <div className="account-feature-actions">
                            {featuredLibraryItem.format === 'ebook' && (
                              <button className="btn btn-red" onClick={() => openReader(featuredLibraryItem.bookId)}>
                                <Icon name="bookOpen" size={14} /> Lire maintenant
                              </button>
                            )}
                            <button className="btn btn-outline account-outline-dark" onClick={() => openBookDetails(featuredLibraryItem.bookId)}>
                              Voir la fiche
                            </button>
                          </div>
                          {quickReadItems.length > 1 && (
                            <div className="account-reading-queue">
                              <span className="account-reading-queue-title">Reprises rapides</span>
                              <div className="account-reading-queue-list">
                                {quickReadItems.slice(1).map((item) => (
                                  <button key={`${item.bookId}-${item.txnId}`} onClick={() => openReader(item.bookId)}>
                                    <Icon name="bookOpen" size={12} /> {item.book.title}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="account-empty account-empty-soft">
                        <Icon name="bookOpen" size={40} />
                        <p>Aucun ouvrage disponible pour le moment.</p>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {tab === 'orders' && (
                <div className="account-tab-content">
                  {orders.length === 0 ? (
                    <div className="account-empty">
                      <Icon name="cart" size={40} />
                      <p>Aucune commande pour le moment.</p>
                      <button className="btn btn-red" onClick={onClose} style={{ marginTop: '1rem' }}>Explorer le catalogue</button>
                    </div>
                  ) : (
                    <div className="orders-list orders-list-premium">
                      {orders.map((order) => (
                        <div key={order.id} className="order-card order-card-premium">
                          <div className="order-card-header">
                            <div>
                              <span className="order-ref">{order.reference}</span>
                              <span className="order-date">{formatDate(order.created_at)}</span>
                            </div>
                            <span className="order-status" style={{ background: `${statusColors[order.status]}18`, color: statusColors[order.status] }}>
                              {statusLabels[order.status] || order.status}
                            </span>
                          </div>
                          <div className="order-items-list">
                            {(order.items || []).map((item, index) => (
                              <div key={`${order.id}-${item.book_id}-${index}`} className="order-item-row order-item-row-premium">
                                <div className="order-item-main">
                                  <span className="order-item-title" onClick={() => openBookDetails(item.book_id)}>
                                    {item.book?.title || `Livre #${item.book_id}`}
                                  </span>
                                  <span className="order-item-meta">{item.book?.author_name || 'Mercury Editions'}</span>
                                </div>
                                <span className="order-item-format">
                                  {item.format === 'ebook' ? <><Icon name="smartphone" size={11} /> eBook</> : <><Icon name="package" size={11} /> Papier</>}
                                </span>
                                <span className="order-item-price">{item.unit_price?.toLocaleString()} F</span>
                              </div>
                            ))}
                          </div>
                          <div className="order-card-footer">
                            <span>Frais OM : {order.om_fees?.toLocaleString()} F</span>
                            <span className="order-total">{order.total_amount?.toLocaleString()} FCFA</span>
                            {order.status === 'completed' && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-outline account-outline-dark" onClick={() => viewReceipt(order)}>
                                  <Icon name="eye" size={14} /> Voir le reçu
                                </button>
                                <button className="btn btn-outline account-outline-dark" onClick={() => downloadReceipt(order)}>
                                  <Icon name="download" size={14} /> Télécharger
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'library' && (
                <div className="account-tab-content">
                  {libraryItems.length === 0 ? (
                    <div className="account-empty">
                      <Icon name="bookOpen" size={40} />
                      <p>Votre bibliothèque est vide.</p>
                      <button className="btn btn-red" onClick={onClose} style={{ marginTop: '1rem' }}>Découvrir les livres</button>
                    </div>
                  ) : (
                    <div className="account-library-grid">
                      {libraryItems.map((item) => {
                        const itemProgress = readingProgressByBook[item.bookId] || null;
                        const progressPercent = Math.round(itemProgress?.progress_percent || 0);

                        return (
                          <div key={`${item.bookId}-${item.format}-${item.txnId}`} className="account-library-card">
                            <div className="account-library-top">
                              {item.book.cover_image ? (
                                <img src={item.book.cover_image} alt={item.book.title} className="account-library-cover" />
                              ) : (
                                <div className="account-library-cover account-library-cover-fallback" style={{ background: item.book.color }}>
                                  {item.book.title.charAt(0)}
                                </div>
                              )}
                              <div className="account-library-meta">
                                <span className="account-feature-badge">{item.format === 'ebook' ? 'Lecture disponible' : 'Commande papier'}</span>
                                <h4>{item.book.title}</h4>
                                <p>{item.book.author_name}</p>
                                <span className="order-date">Acheté le {formatDate(item.purchaseDate)}</span>
                              </div>
                            </div>
                            <p className="account-library-summary">{item.book.summary?.slice(0, 140)}...</p>
                            <div className="account-library-footer">
                              <span>
                                {itemProgress
                                  ? `${progressPercent}% lu`
                                  : `${item.readSessions || 0} session${(item.readSessions || 0) > 1 ? 's' : ''}`}
                              </span>
                              <span>{itemProgress?.last_read_at ? `Dernière lecture ${compactDate(itemProgress.last_read_at)}` : (item.txnId || 'En attente')}</span>
                            </div>
                            <div className="account-library-actions">
                              {item.format === 'ebook' && (
                                <button className="btn btn-red" onClick={() => openReader(item.bookId)}>
                                  <Icon name="bookOpen" size={14} /> {itemProgress && progressPercent > 1 ? 'Reprendre la lecture' : 'Ouvrir le lecteur'}
                                </button>
                              )}
                              <button className="btn btn-outline account-outline-dark" onClick={() => openBookDetails(item.bookId)}>
                                Voir la fiche
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === 'profile' && (
                <div className="account-tab-content">
                  <div className="account-profile-layout">
                    <section className="account-panel">
                      <div className="account-panel-head">
                        <div>
                          <span className="account-panel-kicker">Identité</span>
                          <h3>Mes informations</h3>
                        </div>
                      </div>
                      <form onSubmit={handleProfileSave} className="profile-form">
                        <div className="form-group">
                          <label><Icon name="user" size={14} /> Nom complet</label>
                          <input type="text" value={editName} onChange={(event) => setEditName(event.target.value)} className={profileErrors.name ? 'error' : ''} />
                          {profileErrors.name && <div className="form-error visible">{profileErrors.name[0]}</div>}
                        </div>

                        <div className="form-group">
                          <label><Icon name="mail" size={14} /> Email</label>
                          <input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} className={profileErrors.email ? 'error' : ''} />
                          {profileErrors.email && <div className="form-error visible">{profileErrors.email[0]}</div>}
                        </div>

                        <div className="form-group">
                          <label><Icon name="smartphone" size={14} /> Téléphone</label>
                          <input type="tel" value={editPhone} onChange={(event) => setEditPhone(event.target.value)} className={profileErrors.phone ? 'error' : ''} />
                          {profileErrors.phone && <div className="form-error visible">{profileErrors.phone[0]}</div>}
                        </div>

                        {profileMsg && (
                          <div className={`auth-${profileMsg.includes('succès') ? 'success' : 'error'}`}>{profileMsg}</div>
                        )}

                        <button type="submit" className="btn btn-red" disabled={saving} style={{ width: '100%' }}>
                          {saving ? 'Enregistrement...' : 'Mettre à jour le profil'}
                        </button>
                      </form>
                    </section>

                    <aside className="account-panel account-panel-muted">
                      <div className="account-panel-head">
                        <div>
                          <span className="account-panel-kicker">Compte</span>
                          <h3>Préférences</h3>
                        </div>
                      </div>
                      <div className="account-profile-side">
                        <p>Votre compte Mercury centralise votre panier, vos commandes et vos achats eBook.</p>
                        <div className="account-mini-stat-list">
                          <div className="account-mini-stat">
                            <span>Bibliothèque</span>
                            <strong>{libraryItems.length} titre{libraryItems.length > 1 ? 's' : ''}</strong>
                          </div>
                          <div className="account-mini-stat">
                            <span>Dernier achat</span>
                            <strong>{recentOrder ? compactDate(recentOrder.created_at) : 'Aucun'}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="profile-actions">
                        <button className="btn btn-outline logout-btn" onClick={handleLogout}>
                          <Icon name="arrowLeft" size={14} /> Se déconnecter
                        </button>
                      </div>
                    </aside>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
