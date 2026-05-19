import { useMemo, useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useUtils';
import Icon, { StarRating, FlagBF } from './Icons';

const CATEGORY_LABELS = { 
  roman: 'Roman', poesie: 'Poésie', essai: 'Essai', conte: 'Conte', jeunesse: 'Jeunesse',
  developpement: 'Dév. Personnel', sante: 'Santé', spiritualite: 'Spiritualité'
};
const FILTERS = [
  { key: 'all', label: 'Tous' }, { key: 'roman', label: 'Romans' }, { key: 'poesie', label: 'Poésie' },
  { key: 'essai', label: 'Essais' }, { key: 'developpement', label: 'Dév. Personnel' },
  { key: 'spiritualite', label: 'Spiritualité' }, { key: 'sante', label: 'Santé' },
  { key: 'conte', label: 'Contes' }, { key: 'jeunesse', label: 'Jeunesse' },
];

const SORT_OPTIONS = [
  { key: 'default', label: 'Par défaut' },
  { key: 'price_asc', label: 'Prix croissant' },
  { key: 'price_desc', label: 'Prix décroissant' },
  { key: 'rating', label: 'Meilleure note' },
  { key: 'title', label: 'Titre A-Z' },
  { key: 'year', label: 'Plus récent' },
];

const ITEMS_PER_PAGE = 12;
const PLACEHOLDER_COVER = '/images/covers/placeholder.svg';

function safeTags(book) {
  return Array.isArray(book?.tags) ? book.tags : [];
}

function hasRealCover(book) {
  const cover = String(book?.cover_image || '').trim();
  if (!cover) return false;

  return !cover.endsWith(PLACEHOLDER_COVER) && !cover.endsWith('placeholder.svg');
}

function getBookPrice(book, format = 'ebook') {
  const basePrice = Number(book?.price || 0);
  return format === 'physical' ? Math.round(basePrice * 1.6) : basePrice;
}

function includesSearch(book, rawQuery) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  const searchableParts = [
    book?.title,
    book?.author_name,
    book?.description,
    book?.summary,
    book?.quote,
    book?.publisher,
    book?.language,
    book?.isbn,
    book?.category,
    ...safeTags(book),
  ].filter(Boolean);

  return searchableParts.join(' ').toLowerCase().includes(query);
}

function sortBooks(books, sortKey) {
  const sorted = [...books];

  return sorted.sort((a, b) => {
    const coverPriority = Number(hasRealCover(b)) - Number(hasRealCover(a));
    if (coverPriority !== 0) return coverPriority;

    switch (sortKey) {
      case 'price_asc':
        return Number(a.price || 0) - Number(b.price || 0);
      case 'price_desc':
        return Number(b.price || 0) - Number(a.price || 0);
      case 'rating':
        return Number(b.rating || 0) - Number(a.rating || 0);
      case 'title':
        return a.title.localeCompare(b.title, 'fr');
      case 'year':
        return Number(b.year || 0) - Number(a.year || 0);
      default:
        return 0;
    }
  });
}

export default function Catalog() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const { books, addToCart, openModal } = useApp();
  const { user, isWishlisted, toggleWishlist } = useAuth();
  const toast = useToast();
  const [formats, setFormats] = useState({});
  const [addedIds, setAddedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const addedStateTimers = useRef({});

  // Debounce search pour meilleures performances
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filtered = useMemo(() => {
    const searched = books.filter((book) => includesSearch(book, debouncedSearch));
    const categoryFiltered = filter === 'all'
      ? searched
      : searched.filter((book) => book.category === filter);

    return sortBooks(categoryFiltered, sortBy);
  }, [books, filter, debouncedSearch, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
    [filtered, safePage],
  );

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  useEffect(() => {
    return () => {
      Object.values(addedStateTimers.current).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  const changePage = (nextPage) => {
    setPage(nextPage);
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFilterChange = (key) => { setFilter(key); setPage(1); };
  const handleSearchChange = (val) => { setSearchQuery(val); setPage(1); };
  const handleSortChange = (val) => { setSortBy(val); setPage(1); };

  const selectFormat = (bookId, fmt) => setFormats(prev => ({ ...prev, [bookId]: fmt }));

  const handleAddToCart = (e, bookId) => {
    e.stopPropagation();
    const fmt = formats[bookId] || 'ebook';
    addToCart(bookId, fmt);
    const book = books.find((entry) => entry.id === bookId);
    toast.success(book ? `« ${book.title} » ajouté au panier` : 'Ajouté au panier');

    setAddedIds((prev) => {
      const next = new Set(prev);
      next.add(bookId);
      return next;
    });

    if (addedStateTimers.current[bookId]) {
      clearTimeout(addedStateTimers.current[bookId]);
    }

    addedStateTimers.current[bookId] = setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(bookId);
        return next;
      });
      delete addedStateTimers.current[bookId];
    }, 1200);
  };

  return (
    <section className="catalogue-section" id="catalogue">
      <div className="inner">
        <div className="section-header">
          <div className="section-tag">Boutique</div>
          <h2 className="section-title">Notre <em>catalogue</em></h2>
          <p className="section-subtitle">Parcourez notre collection de livres numériques et papier. Paiement mobile et électronique sécurisé.</p>
        </div>
        <div className="catalogue-search-bar">
          <div className="catalogue-search-input">
            <Icon name="search" size={18} />
            <input type="text" placeholder="Rechercher un livre, un auteur..." value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)} />
            {searchQuery && <button className="search-clear" onClick={() => handleSearchChange('')}><Icon name="close" size={14} /></button>}
          </div>
          <div className="catalogue-sort">
            <select value={sortBy} onChange={e => handleSortChange(e.target.value)}>
              {SORT_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="catalogue-filters">
          {FILTERS.map(f => (
            <button key={f.key} className={`filter-btn${filter === f.key ? ' active' : ''}`} onClick={() => handleFilterChange(f.key)}>{f.label}</button>
          ))}
        </div>
        {searchQuery && <div className="catalogue-results-count">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour « {searchQuery} »</div>}
        {filtered.length === 0 ? (
          <div className="catalogue-empty">
            <Icon name="search" size={40} />
            <p>Aucun livre trouvé.</p>
            <p style={{ fontSize: '0.9rem' }}>Essayez un autre terme de recherche ou changez de catégorie.</p>
          </div>
        ) : (
        <div className="books-grid">
          {paginated.map(book => {
            const fmt = formats[book.id] || 'ebook';
            const price = getBookPrice(book, fmt);
            return (
              <div key={book.id} className="book-card" onClick={() => openModal('bookDetail', book.id)}>
                <div className="book-cover" style={{ background: book.cover_image ? 'transparent' : `linear-gradient(135deg, ${book.color}22, ${book.color}11)` }}>
                  {book.local && <div className="book-local-badge"><FlagBF size={14} /> Auteur local</div>}
                  {book.cover_image ? (
                    <img src={book.cover_image} alt={book.title} className="book-cover-img" onError={(e) => { e.target.onerror = null; e.target.src = '/images/covers/placeholder.svg'; }} />
                  ) : (
                    <div className="book-cover-inner" style={{ background: `linear-gradient(135deg, ${book.color}, ${book.color}CC)` }}>
                      <span>{book.title}</span>
                    </div>
                  )}
                </div>
                <div className="book-info">
                  <div className="book-title">{book.title}</div>
                  <div className="book-author-name">{book.author_name}</div>
                  <div className="book-meta">
                    <span className="book-rating"><Icon name="star" size={12} /> {book.rating}</span>
                    <span className="book-category">{book.category}</span>
                  </div>
                  <div className="format-selector" onClick={e => e.stopPropagation()}>
                    <button className={`format-opt${fmt === 'ebook' ? ' selected' : ''}`} onClick={e => { e.stopPropagation(); selectFormat(book.id, 'ebook'); }}><Icon name="smartphone" size={13} /> eBook</button>
                    <button className={`format-opt${fmt === 'physical' ? ' selected' : ''}`} onClick={e => { e.stopPropagation(); selectFormat(book.id, 'physical'); }}><Icon name="package" size={13} /> Papier</button>
                  </div>
                  <div className="book-price-row">
                    <div className="book-price">{price.toLocaleString()} <small>FCFA</small></div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      {user && (
                        <button
                          className={`wishlist-btn${isWishlisted(book.id) ? ' active' : ''}`}
                          onClick={async e => {
                            e.stopPropagation();
                            try {
                              const added = await toggleWishlist(book.id);
                              toast.success(added ? 'Ajouté aux favoris' : 'Retiré des favoris');
                            } catch (error) {
                              toast.error(error.message || 'Impossible de mettre à jour vos favoris.');
                            }
                          }}
                          title="Favoris"
                        >
                          <Icon name="heart" size={14} />
                        </button>
                      )}
                      <button className={`add-cart-btn${addedIds.has(book.id) ? ' added' : ''}`} onClick={e => handleAddToCart(e, book.id)} title="Ajouter au panier">{addedIds.has(book.id) ? <Icon name="check" size={16} /> : '+'}</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
        {totalPages > 1 && (
          <div className="catalogue-pagination">
            <button className="pagination-btn" disabled={page <= 1} onClick={() => changePage(page - 1)}>&laquo; Précédent</button>
            <div className="pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`pagination-page${p === page ? ' active' : ''}`} onClick={() => changePage(p)}>{p}</button>
              ))}
            </div>
            <button className="pagination-btn" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>Suivant &raquo;</button>
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════ BOOK DETAIL MODAL ═══════════
function generateStars(rating) {
  return <StarRating rating={rating} />;
}

function getSimilarBooks(book, allBooks) {
  const sourceTags = safeTags(book);

  return allBooks
    .filter(b => b.id !== book.id)
    .map(b => {
      let score = 0;
      if (b.category === book.category) score += 40;
      if (b.author_name === book.author_name) score += 35;
      score += safeTags(b).filter(t => sourceTags.includes(t)).length * 12;

      const basePrice = Number(book.price || 0);
      if (basePrice > 0 && Math.abs(Number(b.price || 0) - basePrice) / basePrice < 0.3) score += 8;

      if (b.local && book.local) score += 5;
      return { ...b, matchScore: Math.min(score, 99) };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 4);
}

function parseReviewsPayload(payload) {
  return {
    reviews: Array.isArray(payload?.data) ? payload.data : [],
    average: Number(payload?.meta?.average || 0),
    total: Number(payload?.meta?.total || 0),
  };
}

export function BookDetail({ bookId, onClose }) {
  const { books, authors, addToCart, openModal } = useApp();
  const { user, isWishlisted, toggleWishlist } = useAuth();
  const toast = useToast();
  const [format, setFormat] = useState('ebook');
  const [tab, setTab] = useState('desc');
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [savingReview, setSavingReview] = useState(false);

  const book = books.find(b => b.id === bookId);
  if (!book) return null;

  useEffect(() => {
    let mounted = true;
    setLoadingReviews(true);
    fetch(`/api/books/${book.id}/reviews`, { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        const parsed = parseReviewsPayload(data);
        setReviews(parsed.reviews);
        setAverageRating(parsed.average);
        setReviewCount(parsed.total);
      })
      .catch(() => {
        if (!mounted) return;
        setReviews([]);
        setAverageRating(0);
        setReviewCount(0);
      })
      .finally(() => {
        if (mounted) setLoadingReviews(false);
      });

    return () => { mounted = false; };
  }, [book.id]);

  const similar = getSimilarBooks(book, books);
  const authorData = authors.find(a => a.id === book.author_id);

  const handleAdd = () => {
    addToCart(book.id, format);
    toast.success(`« ${book.title} » ajouté au panier`);
    setAdded(true);
  };

  const submitReview = async () => {
    if (!user) {
      toast.info('Connectez-vous pour publier un avis.');
      openModal('auth', { mode: 'login', intent: 'account' });
      return;
    }

    if (reviewForm.comment.trim().length < 10) {
      toast.error('Votre commentaire doit contenir au moins 10 caractères.');
      return;
    }

    setSavingReview(true);
    try {
      const res = await fetch(`/api/customer/books/${book.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating: reviewForm.rating, title: reviewForm.title, comment: reviewForm.comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Impossible d\'enregistrer l\'avis');

      // Refresh reviews
      const refreshRes = await fetch(`/api/books/${book.id}/reviews`, { headers: { Accept: 'application/json' } });
      const refreshData = await refreshRes.json();
      const parsed = parseReviewsPayload(refreshData);
      setReviews(parsed.reviews);
      setAverageRating(parsed.average);
      setReviewCount(parsed.total);
      setReviewForm({ rating: 5, title: '', comment: '' });
      toast.success('Merci, votre avis a été publié.');
    } catch (err) {
      toast.error(err.message || 'Échec de la publication de l\'avis.');
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="book-detail-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="book-detail-modal">
        <div className="detail-hero" style={{ background: `linear-gradient(135deg, ${book.color}, ${book.color}DD)` }}>
          <button className="detail-close-btn" onClick={onClose}><Icon name="close" size={20} /></button>
          <div className="detail-book-visual">
            {book.cover_image ? (
              <img src={book.cover_image} alt={book.title} className="detail-cover-img" onError={(e) => { e.target.onerror = null; e.target.src = '/images/covers/placeholder.svg'; }} />
            ) : (
              <div className="detail-cover" style={{ background: `linear-gradient(135deg, ${book.color}, ${book.color}99)` }}>
                <div className="detail-cover-title">{book.title}</div>
                <div className="detail-cover-author">{book.author_name}</div>
              </div>
            )}
            <div className="detail-format-badges">
              <span className="format-badge"> eBook</span>
              <span className="format-badge"> PDF</span>
            </div>
          </div>
          <div className="detail-info">
            {book.local && <div className="detail-local-badge"><FlagBF size={14} /> Auteur burkinabè</div>}
            <h1 className="detail-title">{book.title}</h1>
            <div className="detail-author">par <strong>{book.author_name}</strong></div>
            <div className="detail-rating-stars">
              <span className="stars">{generateStars(book.rating)}</span>
              <span className="rating-text">{book.rating}/5 — Très recommandé</span>
            </div>
            <div className="detail-meta-grid">
              <div className="detail-meta-item"><div className="detail-meta-value">{book.pages}</div><div className="detail-meta-label">Pages</div></div>
              <div className="detail-meta-item"><div className="detail-meta-value">{book.year}</div><div className="detail-meta-label">Année</div></div>
              <div className="detail-meta-item"><div className="detail-meta-value">{book.price.toLocaleString()}</div><div className="detail-meta-label">FCFA</div></div>
              <div className="detail-meta-item"><div className="detail-meta-value">{CATEGORY_LABELS[book.category] || book.category}</div><div className="detail-meta-label">Genre</div></div>
            </div>
            <div className="detail-actions">
              <div className="format-selector" style={{ marginBottom: '0.75rem', width: '100%', display: 'flex', gap: '0.5rem' }}>
                <button className="format-opt" onClick={() => setFormat('ebook')}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `2px solid ${format === 'ebook' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'}`, background: format === 'ebook' ? 'rgba(255,255,255,0.15)' : 'transparent', color: format === 'ebook' ? 'white' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: "'Source Sans 3',sans-serif", transition: 'all 0.3s' }}>
                  <Icon name="smartphone" size={14} /> eBook — {book.price.toLocaleString()} F
                </button>
                <button className="format-opt" onClick={() => setFormat('physical')}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `2px solid ${format === 'physical' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'}`, background: format === 'physical' ? 'rgba(255,255,255,0.15)' : 'transparent', color: format === 'physical' ? 'white' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: "'Source Sans 3',sans-serif", transition: 'all 0.3s' }}>
                  <Icon name="package" size={14} /> Papier — {Math.round(book.price * 1.6).toLocaleString()} F
                </button>
              </div>
              <button className="btn btn-white" onClick={handleAdd} style={added ? { background: '#059669', color: 'white' } : {}}>
                {added ? <><Icon name="check" size={16} /> Ajouté au panier</> : <><Icon name="cart" size={16} /> Ajouter au panier</>}
              </button>
              <div className="detail-secondary-actions">
                {user && (
                  <button
                    className={`wishlist-btn${isWishlisted(book.id) ? ' active' : ''}`}
                    onClick={async () => {
                      try {
                        const addedToWishlist = await toggleWishlist(book.id);
                        toast.success(addedToWishlist ? 'Ajouté aux favoris' : 'Retiré des favoris');
                      } catch (error) {
                        toast.error(error.message || 'Impossible de mettre à jour vos favoris.');
                      }
                    }}
                    title={isWishlisted(book.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Icon name="heart" size={18} /> {isWishlisted(book.id) ? 'Favori' : 'Favoris'}
                  </button>
                )}
                <button className="share-btn" onClick={() => {
                  const url = `${window.location.origin}?book=${book.id}`;
                  const text = `${book.title} par ${book.author_name} — ${book.price.toLocaleString()} FCFA sur Mercury Éditions`;
                  if (navigator.share) {
                    navigator.share({ title: book.title, text, url }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(`${text}\n${url}`);
                    toast.success('Lien copié !');
                  }
                }} title="Partager">
                  <Icon name="share" size={18} /> Partager
                </button>
              </div>
            </div>
            {authorData && (
              <div style={{ marginTop: '0.75rem' }}>
                <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                  onClick={() => { onClose(); setTimeout(() => openModal('authorProfile', authorData.id), 300); }}>
                  <Icon name="scroll" size={14} /> Voir le profil de {authorData.name}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="detail-body">
          <div className="detail-tabs">
            <button className={`detail-tab${tab === 'desc' ? ' active' : ''}`} onClick={() => setTab('desc')}>Description</button>
            <button className={`detail-tab${tab === 'resume' ? ' active' : ''}`} onClick={() => setTab('resume')}>Résumé</button>
            <button className={`detail-tab${tab === 'specs' ? ' active' : ''}`} onClick={() => setTab('specs')}>Détails</button>
            <button className={`detail-tab${tab === 'reviews' ? ' active' : ''}`} onClick={() => setTab('reviews')}>Avis lecteurs</button>
          </div>

          {tab === 'desc' && (
            <div className="detail-tab-content active">
              <div className="detail-description">
                <h3>À propos de ce livre</h3>
                <p>{book.description}</p>
                {book.quote && <blockquote>« {book.quote} »</blockquote>}
                <div className="detail-tags">{safeTags(book).map(t => <span key={t} className="detail-tag">#{t}</span>)}</div>
              </div>
            </div>
          )}
          {tab === 'resume' && (
            <div className="detail-tab-content active">
              <div className="detail-description">
                <h3>Résumé de l'ouvrage</h3>
                <p>{book.summary}</p>
                {book.quote && <blockquote>« {book.quote} »</blockquote>}
              </div>
            </div>
          )}
          {tab === 'specs' && (
            <div className="detail-tab-content active">
              <div className="detail-description"><h3>Informations techniques</h3></div>
              <div className="detail-specs">
                {[['Titre', book.title], ['Auteur', book.author_name], ['Éditeur', book.publisher], ['Année', book.year], ['Pages', book.pages], ['Langue', book.language], ['ISBN', book.isbn], ['Catégorie', CATEGORY_LABELS[book.category] || book.category], ['Format', 'eBook (PDF, EPUB)'], ['Prix', `${book.price.toLocaleString()} FCFA`]].map(([label, value]) => (
                  <div key={label} className="spec-item"><span className="spec-label">{label}</span><span className="spec-value">{value}</span></div>
                ))}
              </div>
              <div className="detail-tags" style={{ marginTop: '1.5rem' }}>{safeTags(book).map(t => <span key={t} className="detail-tag">#{t}</span>)}</div>
            </div>
          )}
          {tab === 'reviews' && (
            <div className="detail-tab-content active">
              <div className="detail-description">
                <h3>Avis lecteurs</h3>
                <p style={{ marginBottom: '1rem' }}>
                  Note moyenne: <strong>{(averageRating || book.rating).toFixed(1)}/5</strong> · {reviewCount} avis
                </p>

                <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <h4 style={{ marginBottom: '0.75rem' }}>Laisser un avis</h4>
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    <label>
                      Note
                      <select value={reviewForm.rating} onChange={(e) => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))} style={{ marginLeft: '0.6rem' }}>
                        {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} / 5</option>)}
                      </select>
                    </label>
                    <input
                      type="text"
                      placeholder="Titre de votre avis (optionnel)"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.15)' }}
                    />
                    <textarea
                      rows={4}
                      placeholder="Partagez votre expérience de lecture..."
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.15)' }}
                    />
                    <button className="btn btn-primary" onClick={submitReview} disabled={savingReview}>
                      {savingReview ? 'Publication...' : 'Publier mon avis'}
                    </button>
                  </div>
                </div>

                {loadingReviews ? <p>Chargement des avis...</p> : (
                  <div style={{ display: 'grid', gap: '0.8rem' }}>
                    {reviews.length === 0 && <p>Aucun avis pour le moment.</p>}
                    {reviews.map((review) => (
                      <div key={review.id} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', padding: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <strong>{review.user?.name || 'Lecteur Mercury'}</strong>
                          <span style={{ color: 'var(--gold)' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                        </div>
                        {review.title && <div style={{ marginTop: '0.3rem', fontWeight: 700 }}>{review.title}</div>}
                        <p style={{ marginTop: '0.35rem' }}>{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="similar-section">
          <div className="similar-header"><h3><Icon name="bookOpen" size={18} /> Ouvrages similaires</h3><span>{similar.length} recommandations</span></div>
          <div className="similar-grid">
            {similar.map(s => (
              <div key={s.id} className="similar-card" onClick={() => { onClose(); setTimeout(() => openModal('bookDetail', s.id), 100); }}>
                <div className="similar-card-cover" style={{ background: `linear-gradient(135deg, ${s.color}18, ${s.color}08)` }}>
                  <div className="similar-match-badge">{s.matchScore}% match</div>
                  <div className="similar-card-mini-cover" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}CC)` }}>
                    <span>{s.title}</span>
                  </div>
                </div>
                <div className="similar-card-info">
                  <div className="similar-card-title">{s.title}</div>
                  <div className="similar-card-author">{s.author_name}</div>
                  <div className="similar-card-bottom">
                    <span className="similar-card-price">{s.price.toLocaleString()} F</span>
                    <span className="similar-card-rating"><Icon name="star" size={11} /> {s.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
