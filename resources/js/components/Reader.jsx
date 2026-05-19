import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Icon from './Icons';

function buildReaderQuery(token) {
  const value = (token || '').trim();
  return value ? `?token=${encodeURIComponent(value)}` : '';
}

function compactToken(token) {
  if (!token) return 'LICENCE';
  const value = token.toUpperCase();
  return value.length <= 12 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function formatReadingTime(seconds) {
  if (!seconds || seconds < 60) return 'Moins d\'1 min';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function Reader({ bookId, onClose, returnTo = 'library' }) {
  const { books, purchasedBooks, incrementReadSessions, openModal } = useApp();
  const { user } = useAuth();
  const safeBookId = Number(bookId);
  const [readerState, setReaderState] = useState({
    status: 'loading',
    payload: null,
    error: '',
  });
  const [activeFormat, setActiveFormat] = useState(null);
  const [progress, setProgress] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(null);
  
  const trackedSession = useRef(false);
  const lastProgressSyncAtRef = useRef(Date.now());
  const saveIntervalRef = useRef(null);
  const iframeRef = useRef(null);

  // ─── Text-to-Speech (Lecteur Vocal) ───
  const [ttsState, setTtsState] = useState({
    isPlaying: false,
    isPaused: false,
    rate: 1,
    voice: null,
    showPanel: false,
  });
  const [availableVoices, setAvailableVoices] = useState([]);
  const speechSynthRef = useRef(null);
  const utteranceRef = useRef(null);

  const purchase = purchasedBooks.find((entry) => Number(entry.bookId) === safeBookId && entry.format === 'ebook');
  const book = books.find((entry) => Number(entry.id) === safeBookId);
  const purchaseToken = purchase?.accessToken || '';
  const ebookBookIds = useMemo(() => {
    const source = [...purchasedBooks]
      .filter((entry) => entry?.format === 'ebook')
      .sort((a, b) => new Date(b?.purchaseDate || 0) - new Date(a?.purchaseDate || 0));

    const seen = new Set();

    return source
      .map((entry) => Number(entry?.bookId ?? entry?.book_id))
      .filter((id) => Number.isInteger(id))
      .filter((id) => books.some((entry) => Number(entry.id) === id))
      .filter((id) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }, [purchasedBooks, books]);

  // Toast notification
  const showNotification = useCallback((message, type = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  }, []);

  // Charger les voix disponibles
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    speechSynthRef.current = window.speechSynthesis;
    
    const loadVoices = () => {
      const voices = speechSynthRef.current.getVoices();
      // Privilégier les voix françaises
      const frenchVoices = voices.filter(v => v.lang.startsWith('fr'));
      const otherVoices = voices.filter(v => !v.lang.startsWith('fr'));
      setAvailableVoices([...frenchVoices, ...otherVoices]);
      
      // Sélectionner une voix française par défaut si disponible
      if (frenchVoices.length > 0 && !ttsState.voice) {
        setTtsState(prev => ({ ...prev, voice: frenchVoices[0] }));
      }
    };
    
    loadVoices();
    speechSynthRef.current.onvoiceschanged = loadVoices;
    
    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

  // Nettoyer TTS à la fermeture
  useEffect(() => {
    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, [bookId]);

  // Obtenir le texte à lire
  const getTextToRead = useCallback(() => {
    if (!book) return '';
    
    let text = '';
    
    // Titre et auteur
    text += `${book.title}. Par ${book.author_name}. `;
    
    // Résumé
    if (book.summary) {
      text += `Résumé: ${book.summary} `;
    }
    
    // Description
    if (book.description) {
      text += `Description: ${book.description} `;
    }
    
    // Citation
    if (book.quote) {
      text += `Citation: "${book.quote}" `;
    }
    
    // Information additionnelle
    if (book.publisher) {
      text += `Publié par ${book.publisher}. `;
    }
    
    return text || 'Aucun contenu texte disponible pour ce livre.';
  }, [book]);

  // Démarrer la lecture vocale
  const startSpeech = useCallback(() => {
    if (!speechSynthRef.current) {
      showNotification('Synthèse vocale non supportée', 'error');
      return;
    }
    
    // Annuler toute lecture en cours
    speechSynthRef.current.cancel();
    
    const text = getTextToRead();
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = ttsState.rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    if (ttsState.voice) {
      utterance.voice = ttsState.voice;
    }
    
    utterance.onstart = () => {
      setTtsState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
    };
    
    utterance.onend = () => {
      setTtsState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
      showNotification('Lecture vocale terminée', 'info');
    };
    
    utterance.onerror = (e) => {
      console.error('TTS Error:', e);
      setTtsState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
      if (e.error !== 'canceled') {
        showNotification('Erreur de lecture vocale', 'error');
      }
    };
    
    utteranceRef.current = utterance;
    speechSynthRef.current.speak(utterance);
    showNotification('Lecture vocale démarrée', 'success');
  }, [ttsState.rate, ttsState.voice, getTextToRead, showNotification]);

  // Mettre en pause / Reprendre
  const togglePauseSpeech = useCallback(() => {
    if (!speechSynthRef.current) return;
    
    if (ttsState.isPaused) {
      speechSynthRef.current.resume();
      setTtsState(prev => ({ ...prev, isPaused: false }));
    } else {
      speechSynthRef.current.pause();
      setTtsState(prev => ({ ...prev, isPaused: true }));
    }
  }, [ttsState.isPaused]);

  // Arrêter la lecture
  const stopSpeech = useCallback(() => {
    if (!speechSynthRef.current) return;
    speechSynthRef.current.cancel();
    setTtsState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
  }, []);

  // Changer la vitesse
  const setTtsRate = useCallback((rate) => {
    setTtsState(prev => ({ ...prev, rate }));
    // Si en cours de lecture, redémarrer avec la nouvelle vitesse
    if (ttsState.isPlaying) {
      stopSpeech();
      setTimeout(() => startSpeech(), 100);
    }
  }, [ttsState.isPlaying, stopSpeech, startSpeech]);

  // Changer la voix
  const setTtsVoice = useCallback((voice) => {
    setTtsState(prev => ({ ...prev, voice }));
  }, []);

  // Toggle panneau TTS
  const toggleTtsPanel = useCallback(() => {
    setTtsState(prev => ({ ...prev, showPanel: !prev.showPanel }));
  }, []);

  // Charger la progression depuis le serveur
  const loadProgress = useCallback(async () => {
    if (!user || !book) return;
    
    try {
      const query = buildReaderQuery(purchaseToken);
      const response = await fetch(`/api/customer/books/${book.id}/progress${query}`, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.progress) {
          setProgress(data.progress);
          setCurrentPage(data.progress.current_page || 1);
          setTotalPages(data.progress.total_pages);
          
          // Proposer de reprendre si progression existante > 1%
          if (data.progress.progress_percent > 1 && data.progress.progress_percent < 100) {
            setShowResumePrompt(true);
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement progression:', error);
    }
  }, [user, book, purchaseToken]);

  // Sauvegarder la progression
  const saveProgress = useCallback(async (force = false) => {
    if (!user || !book || !activeFormat) return;
    
    const now = Date.now();
    const elapsedSinceLastSync = Math.max(
      0,
      Math.floor((now - (lastProgressSyncAtRef.current || now)) / 1000),
    );

    const previousPercent = Number(progress?.progress_percent);
    const fallbackPercent = Number.isFinite(previousPercent) ? previousPercent : 0;
    const progressPercent = totalPages && totalPages > 0
      ? Math.min(100, Math.round((currentPage / totalPages) * 100 * 10) / 10)
      : fallbackPercent;

    const hasPositionChanged = progress?.current_page !== currentPage
      || progress?.format !== activeFormat
      || (totalPages && progress?.total_pages !== totalPages);

    // Skip uniquement si rien n'a changé et aucun temps additionnel à comptabiliser.
    if (!force && !hasPositionChanged && elapsedSinceLastSync <= 0) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const query = buildReaderQuery(purchaseToken);
      const response = await fetch(`/api/customer/books/${book.id}/progress${query}`, {
        method: 'POST',
        headers: { 
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          format: activeFormat,
          current_page: currentPage,
          total_pages: totalPages,
          progress_percent: progressPercent,
          session_duration: elapsedSinceLastSync,
          is_new_session: !trackedSession.current,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.progress) {
          setProgress(data.progress);
        }
        trackedSession.current = true;
        lastProgressSyncAtRef.current = now;
      }
    } catch (error) {
      console.error('Erreur sauvegarde progression:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user, book, activeFormat, currentPage, totalPages, progress, purchaseToken]);

  // Reset à l'ouverture d'un nouveau livre
  useEffect(() => {
    trackedSession.current = false;
    lastProgressSyncAtRef.current = Date.now();
    setProgress(null);
    setShowResumePrompt(false);
    setCurrentPage(1);
    setTotalPages(null);
  }, [bookId]);

  // Charger le reader et la progression
  useEffect(() => {
    if (!book) return;

    let cancelled = false;
    const query = buildReaderQuery(purchaseToken);

    setReaderState({
      status: 'loading',
      payload: null,
      error: '',
    });

    fetch(`/api/books/${book.id}/reader${query}`, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || 'Impossible de charger ce lecteur.');
        }

        return data;
      })
      .then((data) => {
        if (cancelled) return;

        setReaderState({
          status: 'ready',
          payload: data,
          error: '',
        });
        
        // Charger la progression après l'accès vérifié
        loadProgress();
      })
      .catch((error) => {
        if (cancelled) return;

        setReaderState({
          status: 'error',
          payload: null,
          error: error.message || 'Impossible de charger ce lecteur.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [book?.id, purchaseToken, user?.id, loadProgress]);

  // Bloquer raccourcis
  useEffect(() => {
    const blockKeys = (event) => {
      if ((event.ctrlKey || event.metaKey) && ['s', 'p', 'S', 'P'].includes(event.key)) {
        event.preventDefault();
      }
      if (event.key === 'PrintScreen') {
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', blockKeys);
    return () => document.removeEventListener('keydown', blockKeys);
  }, []);

  // Compteur de sessions
  useEffect(() => {
    if (readerState.status !== 'ready' || trackedSession.current || !readerState.payload?.access) return;
    incrementReadSessions(safeBookId);
  }, [incrementReadSessions, readerState, safeBookId]);

  // Format actif
  useEffect(() => {
    if (readerState.status !== 'ready') return;

    const preferredFormat = readerState.payload?.reader?.preferred_format || null;
    const availableFormats = readerState.payload?.reader?.available_formats || {};

    setActiveFormat((current) => {
      // Utiliser le format de la progression si disponible
      if (progress?.format && availableFormats[progress.format]) {
        return progress.format;
      }
      if (current && availableFormats[current]) return current;
      return preferredFormat;
    });
  }, [readerState, progress]);

  // Sauvegarde automatique toutes les 30 secondes
  useEffect(() => {
    if (readerState.status !== 'ready' || !user) return;
    
    saveIntervalRef.current = setInterval(() => {
      saveProgress(false);
    }, 30000);
    
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [readerState.status, user, saveProgress]);

  // Sauvegarder à la fermeture
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveProgress(true);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveProgress]);

  const navigateToLibrary = useCallback(() => {
    if (returnTo === 'library') {
      openModal('library');
      return;
    }

    if (returnTo === 'account-library') {
      openModal('account', 'library');
      return;
    }

    onClose();
  }, [openModal, returnTo, onClose]);

  // Gestion de la fermeture
  const handleClose = async () => {
    await saveProgress(true);
    navigateToLibrary();
  };

  // Reprendre la lecture
  const handleResume = () => {
    setShowResumePrompt(false);
    if (progress?.format) {
      setActiveFormat(progress.format);
    }
    // La page sera automatiquement réglée grâce à currentPage
    showNotification(`Reprise page ${progress?.current_page || 1}`, 'info');
  };

  // Recommencer depuis le début
  const handleStartFresh = () => {
    setShowResumePrompt(false);
    setCurrentPage(1);
    showNotification('Lecture depuis le début', 'info');
  };

  // Navigation de page
  const goToPage = (page) => {
    const newPage = Math.max(1, Math.min(page, totalPages || page));
    setCurrentPage(newPage);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  const currentBookIndex = ebookBookIds.findIndex((id) => id === safeBookId);
  const nextBookId = currentBookIndex >= 0 ? (ebookBookIds[currentBookIndex + 1] ?? null) : null;
  const nextBook = nextBookId ? books.find((entry) => Number(entry.id) === nextBookId) : null;

  const handleNextBook = async () => {
    if (!nextBookId) {
      showNotification('Aucun livre suivant disponible', 'info');
      return;
    }

    await saveProgress(true);
    openModal('reader', { bookId: nextBookId, returnTo });
  };

  // Calculer la progression
  const progressPercent = totalPages && totalPages > 0 
    ? Math.min(100, Math.round((currentPage / totalPages) * 100)) 
    : (progress?.progress_percent || 0);

  if (!book) {
    return (
      <div className="reader-overlay open">
        <div className="reader-status-card">
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Chargement du livre...</p>
          <button className="btn btn-red" onClick={navigateToLibrary}>Retour bibliothèque</button>
        </div>
      </div>
    );
  }

  if (readerState.status === 'loading') {
    return (
      <div className="reader-overlay open">
        <div className="reader-status-card">
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Vérification de votre accès et préparation du lecteur...</p>
        </div>
      </div>
    );
  }

  if (readerState.status === 'error' || !readerState.payload?.access) {
    return (
      <div className="reader-overlay open">
        <div className="reader-status-card">
          <Icon name="lock" size={28} />
          <h3>Accès indisponible</h3>
          <p>{readerState.error || 'Aucune licence eBook valide trouvée pour cet ouvrage.'}</p>
          <button className="btn btn-red" onClick={navigateToLibrary}>Retour bibliothèque</button>
        </div>
      </div>
    );
  }

  const readerPayload = readerState.payload.reader || {};
  const availableFormats = readerPayload.available_formats || { pdf: false, epub: false };
  const currentFormat = activeFormat && availableFormats[activeFormat]
    ? activeFormat
    : (availableFormats.pdf ? 'pdf' : (availableFormats.epub ? 'epub' : null));
  const accessToken = readerState.payload.purchase?.access_token || purchaseToken || '';
  const fileQuery = buildReaderQuery(accessToken);
  const pdfUrl = availableFormats.pdf ? `/api/books/${book.id}/reader/pdf${fileQuery}` : '';
  const epubUrl = availableFormats.epub ? `/api/books/${book.id}/reader/epub${fileQuery}` : '';
  const buyerPhone = readerState.payload.purchase?.buyer_phone || purchase?.buyerPhone || user?.phone || '-';
  const transactionId = readerState.payload.purchase?.transaction_id || purchase?.txnId || '-';
  const hasRealFile = availableFormats.pdf || availableFormats.epub;
  const formatLabel = currentFormat === 'epub' ? 'EPUB' : currentFormat === 'pdf' ? 'PDF' : 'Extrait';
  const sessionCount = progress?.sessions_count || purchase?.readSessions || 0;
  const readingTime = progress?.reading_time || 0;

  const openCurrentFormat = () => {
    const url = currentFormat === 'epub' ? epubUrl : pdfUrl;
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderResumePrompt = () => (
    <div className="reader-resume-overlay">
      <div className="reader-resume-card">
        <div className="reader-resume-icon">
          <Icon name="bookmark" size={32} />
        </div>
        <h3>Reprendre votre lecture ?</h3>
        <p>Vous étiez à la page {progress?.current_page} ({Math.round(progress?.progress_percent || 0)}% du livre)</p>
        {progress?.last_read_at && (
          <span className="reader-resume-date">Dernière lecture : {formatDate(progress.last_read_at)}</span>
        )}
        <div className="reader-resume-actions">
          <button className="btn btn-primary" onClick={handleResume}>
            <Icon name="play" size={16} /> Reprendre
          </button>
          <button className="btn btn-outline" onClick={handleStartFresh}>
            Recommencer
          </button>
        </div>
      </div>
    </div>
  );

  const renderProgressBar = () => (
    <div className="reader-progress-bar-container">
      <div className="reader-progress-track">
        <div 
          className="reader-progress-fill" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <span className="reader-progress-text">{progressPercent}%</span>
    </div>
  );

  const renderFallback = () => (
    <div className="reader-surface reader-surface-alt">
      <div className="reader-fallback">
        <div className="reader-fallback-intro">
          <span className="reader-panel-kicker">Fichier non disponible</span>
          <h2>{book.title}</h2>
          <p>Votre achat est bien reconnu, mais aucun fichier PDF ou EPUB exploitable n'est encore associé à ce livre.</p>
        </div>
        <div className="reader-notice">
          <Icon name="warning" size={16} />
          <span>L'admin peut encore ajouter le fichier eBook sans impacter votre licence d'accès.</span>
        </div>
        <article className="reader-excerpt">
          <h3>Extrait disponible</h3>
          <p>{book.summary || 'Résumé indisponible.'}</p>
          {book.description && <p>{book.description}</p>}
          {book.quote && (
            <blockquote className="reader-quote">"{book.quote}"</blockquote>
          )}
        </article>
      </div>
    </div>
  );

  const renderPdfReader = () => (
    <div className="reader-surface">
      <iframe
        ref={iframeRef}
        key={pdfUrl}
        src={`${pdfUrl}#page=${currentPage}`}
        title={`Lecture PDF - ${book.title}`}
        className="reader-document-frame"
        onLoad={(e) => {
          // Tenter de détecter le nombre de pages
          try {
            // Note: Accès limité cross-origin, fonctionne avec même origine
            const iframe = e.target;
            if (iframe.contentWindow?.document) {
              // Pour PDF.js ou lecteur natif - peut nécessiter ajustement
            }
          } catch (err) {
            // Accès cross-origin bloqué
          }
        }}
      />
      
      {/* Contrôles de navigation */}
      <div className="reader-controls">
        <div className="reader-controls-left">
          <button 
            className="reader-nav-btn"
            onClick={prevPage}
            disabled={currentPage <= 1}
            title="Page précédente"
          >
            <Icon name="chevronLeft" size={20} />
          </button>
          
          <div className="reader-page-input-group">
            <input
              type="number"
              className="reader-page-input"
              value={currentPage}
              onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
              onBlur={() => goToPage(currentPage)}
              onKeyDown={(e) => e.key === 'Enter' && goToPage(currentPage)}
              min={1}
              max={totalPages || undefined}
            />
            {totalPages && <span className="reader-page-total">/ {totalPages}</span>}
          </div>
          
          <button 
            className="reader-nav-btn"
            onClick={nextPage}
            disabled={totalPages && currentPage >= totalPages}
            title="Page suivante"
          >
            <Icon name="chevronRight" size={20} />
          </button>
        </div>
        
        <div className="reader-controls-center">
          {renderProgressBar()}
        </div>
        
        <div className="reader-controls-right">
          {isSaving && (
            <span className="reader-saving-indicator">
              <div className="spinner-small"></div>
              Sauvegarde...
            </span>
          )}
          <button 
            className="reader-control-btn"
            onClick={() => setShowProgressPanel(!showProgressPanel)}
            title="Statistiques de lecture"
          >
            <Icon name="barChart" size={18} />
          </button>
          <button 
            className="reader-control-btn"
            onClick={() => saveProgress(true)}
            title="Sauvegarder la progression"
          >
            <Icon name="save" size={18} />
          </button>
          <button
            className="reader-control-btn"
            onClick={handleNextBook}
            disabled={!nextBookId}
            title={nextBook ? `Livre suivant: ${nextBook.title}` : 'Aucun livre suivant'}
          >
            <Icon name="skipForward" size={18} />
          </button>
          <button className="reader-link-btn" onClick={openCurrentFormat}>
            <Icon name="share" size={14} /> Ouvrir dans un onglet
          </button>
        </div>
      </div>
    </div>
  );

  const renderEpubReader = () => (
    <div className="reader-surface reader-surface-alt">
      <div className="reader-epub-state">
        <div className="reader-epub-copy">
          <span className="reader-panel-kicker">Format EPUB</span>
          <h2>{book.title}</h2>
          <p>Le fichier EPUB original est disponible. Le rendu dépend du navigateur utilisé, donc une ouverture dans un onglet dédié reste proposée.</p>
        </div>
        <div className="reader-epub-preview">
          <iframe
            key={epubUrl}
            src={epubUrl}
            title={`Lecture EPUB - ${book.title}`}
            className="reader-document-frame reader-document-frame-epub"
          />
        </div>
        <div className="reader-file-actions">
          <button className="reader-link-btn" onClick={openCurrentFormat}>
            <Icon name="share" size={14} /> Ouvrir l'EPUB dans un onglet
          </button>
          <button
            className="reader-link-btn subtle"
            onClick={handleNextBook}
            disabled={!nextBookId}
          >
            <Icon name="skipForward" size={14} /> Livre suivant
          </button>
          {availableFormats.pdf && (
            <button className="reader-link-btn subtle" onClick={() => setActiveFormat('pdf')}>
              <Icon name="bookOpen" size={14} /> Basculer vers la version PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderStage = () => {
    if (!hasRealFile) {
      return renderFallback();
    }

    if (currentFormat === 'epub') {
      return renderEpubReader();
    }

    return renderPdfReader();
  };

  return (
    <div className="reader-overlay open">
      <div className="reader-topbar">
        <div className="reader-topbar-left">
          <div className="reader-logo">
            <div className="reader-logo-icon">M</div>
            <span className="reader-logo-text">Mercury Reader</span>
          </div>
          <div className="reader-book-info">
            <h4>{book.title}</h4>
            <span>{book.author_name} · {book.publisher} · {formatLabel}</span>
          </div>
        </div>
        <div className="reader-topbar-right">
          {(availableFormats.pdf || availableFormats.epub) && (
            <div className="reader-format-switch">
              <button
                className={`reader-format-btn${currentFormat === 'pdf' ? ' active' : ''}`}
                onClick={() => setActiveFormat('pdf')}
                disabled={!availableFormats.pdf}
              >
                PDF
              </button>
              <button
                className={`reader-format-btn${currentFormat === 'epub' ? ' active' : ''}`}
                onClick={() => setActiveFormat('epub')}
                disabled={!availableFormats.epub}
              >
                EPUB
              </button>
            </div>
          )}
          <span className="reader-badge license"><Icon name="check" size={12} /> {sessionCount} session{sessionCount > 1 ? 's' : ''}</span>
          <span className="reader-badge drm"><Icon name="lock" size={12} /> Licence {user ? 'compte' : 'invite'}</span>
          
          {/* Bouton Lecteur Vocal */}
          <button 
            className={`reader-tts-btn ${ttsState.isPlaying ? 'active' : ''}`}
            onClick={ttsState.isPlaying ? togglePauseSpeech : startSpeech}
            title={ttsState.isPlaying ? (ttsState.isPaused ? 'Reprendre' : 'Pause') : 'Écouter'}
          >
            <Icon name={ttsState.isPlaying ? (ttsState.isPaused ? 'play' : 'pause') : 'volume'} size={18} />
          </button>
          {ttsState.isPlaying && (
            <button 
              className="reader-tts-stop-btn"
              onClick={stopSpeech}
              title="Arrêter"
            >
              <Icon name="stop" size={16} />
            </button>
          )}
          
          <button className="reader-close-btn" onClick={handleClose}><Icon name="close" size={20} /></button>
        </div>
      </div>

      <div className="reader-body" onContextMenu={(event) => event.preventDefault()}>
        {/* Toast notification */}
        {showToast && (
          <div className={`reader-toast reader-toast-${showToast.type}`}>
            <Icon name={showToast.type === 'success' ? 'check' : 'info'} size={16} />
            {showToast.message}
          </div>
        )}

        {/* Prompt de reprise de lecture */}
        {showResumePrompt && renderResumePrompt()}

        <div className="reader-stage">
          <div className="reader-watermark">MERCURY · {compactToken(accessToken)}</div>
          {renderStage()}

          <aside className={`reader-sidepanel ${showProgressPanel ? 'show-stats' : ''}`}>
            {/* Carte de progression */}
            <section className="reader-meta-card reader-progress-card">
              <span className="reader-panel-kicker">Progression de lecture</span>
              <div className="reader-progress-visual">
                <div className="reader-progress-ring">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" className="reader-progress-ring-bg" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      className="reader-progress-ring-fill"
                      style={{ 
                        strokeDasharray: `${progressPercent * 2.83} 283`,
                        stroke: progressPercent >= 100 ? 'var(--success)' : 'var(--mercury-red)'
                      }}
                    />
                  </svg>
                  <span className="reader-progress-ring-value">{progressPercent}%</span>
                </div>
                <div className="reader-progress-details">
                  <div className="reader-progress-stat">
                    <Icon name="bookOpen" size={14} />
                    <span>Page {currentPage}{totalPages ? ` / ${totalPages}` : ''}</span>
                  </div>
                  <div className="reader-progress-stat">
                    <Icon name="clock" size={14} />
                    <span>{formatReadingTime(readingTime)}</span>
                  </div>
                  <div className="reader-progress-stat">
                    <Icon name="layers" size={14} />
                    <span>{sessionCount} session{sessionCount > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              {progress?.last_read_at && (
                <div className="reader-last-read">
                  <Icon name="calendar" size={12} />
                  <span>Dernière lecture : {formatDate(progress.last_read_at)}</span>
                </div>
              )}
            </section>

            <section className="reader-meta-card">
              <span className="reader-panel-kicker">Licence active</span>
              <h3>{book.title}</h3>
              <p>{book.author_name}</p>
              <div className="reader-cover-card" style={{ background: book.color || 'var(--mercury-red)' }}>
                {book.cover_image ? (
                  <img src={book.cover_image} alt={book.title} className="reader-cover-image" onError={(e) => { e.target.onerror = null; e.target.src = '/images/covers/placeholder.svg'; }} />
                ) : (
                  <span>{book.title.charAt(0)}</span>
                )}
              </div>
            </section>

            <section className="reader-meta-card">
              <div className="reader-meta-row">
                <span>Formats détectés</span>
                <strong>{availableFormats.pdf && availableFormats.epub ? 'PDF / EPUB' : availableFormats.pdf ? 'PDF' : availableFormats.epub ? 'EPUB' : 'Aucun fichier'}</strong>
              </div>
              <div className="reader-meta-row">
                <span>Licence</span>
                <strong>{compactToken(accessToken)}</strong>
              </div>
              <div className="reader-meta-row">
                <span>Téléphone</span>
                <strong>{buyerPhone}</strong>
              </div>
              <div className="reader-meta-row">
                <span>Transaction</span>
                <strong>{transactionId}</strong>
              </div>
            </section>

            <section className="reader-meta-card">
              <div className="reader-notice">
                <Icon name="shield" size={16} />
                <span>Accès contrôlé côté serveur. Les fichiers sont servis uniquement après vérification de la commande.</span>
              </div>
              {hasRealFile && (
                <button className="reader-link-btn" onClick={openCurrentFormat}>
                  <Icon name="share" size={14} /> Ouvrir la source actuelle
                </button>
              )}
            </section>

            {/* Actions rapides */}
            <section className="reader-meta-card reader-quick-actions">
              <span className="reader-panel-kicker">Actions rapides</span>
              <div className="reader-action-buttons">
                <button 
                  className="reader-action-btn"
                  onClick={() => saveProgress(true)}
                  disabled={isSaving}
                >
                  <Icon name="save" size={16} />
                  <span>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                </button>
                <button
                  className="reader-action-btn"
                  onClick={handleNextBook}
                  disabled={!nextBookId}
                  title={nextBook ? `Livre suivant: ${nextBook.title}` : 'Aucun livre suivant'}
                >
                  <Icon name="skipForward" size={16} />
                  <span>{nextBook ? 'Livre suivant' : 'Fin de bibliothèque'}</span>
                </button>
                {progress?.current_page > 1 && (
                  <button 
                    className="reader-action-btn"
                    onClick={() => { setCurrentPage(1); showNotification('Retour au début'); }}
                  >
                    <Icon name="skipBack" size={16} />
                    <span>Début</span>
                  </button>
                )}
              </div>
            </section>

            {/* Lecteur Vocal (TTS) */}
            <section className="reader-meta-card reader-tts-card">
              <span className="reader-panel-kicker">
                <Icon name="headphones" size={14} /> Lecteur Vocal
              </span>
              
              {/* Contrôles principaux */}
              <div className="reader-tts-controls">
                <button 
                  className={`reader-tts-main-btn ${ttsState.isPlaying && !ttsState.isPaused ? 'playing' : ''}`}
                  onClick={ttsState.isPlaying ? togglePauseSpeech : startSpeech}
                >
                  <Icon name={ttsState.isPlaying ? (ttsState.isPaused ? 'play' : 'pause') : 'play'} size={24} />
                </button>
                {ttsState.isPlaying && (
                  <button className="reader-tts-stop" onClick={stopSpeech}>
                    <Icon name="stop" size={18} />
                  </button>
                )}
              </div>
              
              <div className="reader-tts-status">
                {ttsState.isPlaying ? (
                  <span className={`reader-tts-status-text ${ttsState.isPaused ? 'paused' : 'playing'}`}>
                    <span className="reader-tts-pulse"></span>
                    {ttsState.isPaused ? 'En pause' : 'Lecture en cours...'}
                  </span>
                ) : (
                  <span className="reader-tts-status-text idle">
                    Prêt à lire
                  </span>
                )}
              </div>
              
              {/* Vitesse de lecture */}
              <div className="reader-tts-setting">
                <label>Vitesse :</label>
                <div className="reader-tts-rate-buttons">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      className={`reader-tts-rate-btn ${ttsState.rate === rate ? 'active' : ''}`}
                      onClick={() => setTtsRate(rate)}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Sélection de voix */}
              {availableVoices.length > 0 && (
                <div className="reader-tts-setting">
                  <label>Voix :</label>
                  <select 
                    className="reader-tts-voice-select"
                    value={ttsState.voice?.name || ''}
                    onChange={(e) => {
                      const voice = availableVoices.find(v => v.name === e.target.value);
                      if (voice) setTtsVoice(voice);
                    }}
                  >
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="reader-tts-info">
                <Icon name="info" size={12} />
                <span>Lit le résumé et la description du livre</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
