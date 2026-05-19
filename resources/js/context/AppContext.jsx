import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// Debug logging - silenced in production
const isDev = import.meta.env.DEV;
const log = (...args) => isDev && console.log('[AppContext]', ...args);

const STORAGE_KEYS = { cart: 'mercury_cart_v1', purchases: 'mercury_purchases_v1' };
const PHYSICAL_PRICE_MULTIPLIER = 1.6;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeFormat(format) {
  return format === 'physical' ? 'physical' : 'ebook';
}

function getUnitPrice(book, format) {
  const basePrice = toNumber(book?.price, 0);
  return format === 'physical' ? Math.round(basePrice * PHYSICAL_PRICE_MULTIPLIER) : basePrice;
}

function normalizeCartItem(item, books) {
  const id = Number(item?.id);
  if (!Number.isInteger(id)) return null;

  const book = books.find((entry) => Number(entry.id) === id);
  if (!book) return null;

  const format = normalizeFormat(item?.format);
  const quantity = Math.max(1, Math.min(99, Number(item?.quantity) || 1));
  const defaultPrice = getUnitPrice(book, format);
  const finalPrice = Math.max(0, toNumber(item?.finalPrice, defaultPrice));

  return {
    ...book,
    format,
    quantity,
    finalPrice,
  };
}

function normalizePurchaseItem(item) {
  if (!item || typeof item !== 'object') return null;

  const rawBookId = item.bookId ?? item.book_id ?? item.id;
  const bookId = Number(rawBookId);
  if (!Number.isInteger(bookId)) return null;

  return {
    bookId,
    format: normalizeFormat(item.format),
    accessToken: String(item.accessToken ?? item.access_token ?? ''),
    txnId: String(item.txnId ?? item.txn_id ?? item.transaction_id ?? ''),
    buyerPhone: String(item.buyerPhone ?? item.buyer_phone ?? ''),
    purchaseDate: item.purchaseDate ?? item.purchase_date ?? new Date().toISOString(),
    readSessions: Math.max(0, Number(item.readSessions ?? item.read_sessions ?? 0) || 0),
  };
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [cart, setCart] = useState([]);
  const [purchasedBooks, setPurchasedBooks] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // 'cart' | 'checkout' | 'bookDetail' | 'authorProfile' | 'library' | 'reader'
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const cartSyncTimer = useRef(null);

  // Fetch books & authors from API
  useEffect(() => {
    const headers = { Accept: 'application/json' };
    Promise.all([
      fetch('/api/books', { headers }).then((r) => (r.ok ? r.json() : [])),
      fetch('/api/authors', { headers }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([booksData, authorsData]) => {
        const normalizedBooks = Array.isArray(booksData) ? booksData : [];
        const normalizedAuthors = Array.isArray(authorsData) ? authorsData : [];

        setBooks(normalizedBooks);
        setAuthors(normalizedAuthors);

        // Restore cart from localStorage after books are loaded
        try {
          const savedCart = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || '[]');
          if (Array.isArray(savedCart) && savedCart.length > 0) {
            const restored = savedCart
              .map((item) => normalizeCartItem(item, normalizedBooks))
              .filter(Boolean);

            setCart(restored);
          }
        } catch { /* ignore */ }

        // Restore purchases
        try {
          const savedPurchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.purchases) || '[]');
          if (Array.isArray(savedPurchases)) {
            setPurchasedBooks(savedPurchases.map(normalizePurchaseItem).filter(Boolean));
          }
        } catch { /* ignore */ }
      })
      .catch(() => {
        setBooks([]);
        setAuthors([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Save state to localStorage
  useEffect(() => {
    try {
      const compactCart = cart.map((item) => ({
        id: item.id,
        format: normalizeFormat(item.format),
        finalPrice: Math.max(0, toNumber(item.finalPrice, item.price || 0)),
        quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
      }));

      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(compactCart));
      localStorage.setItem(STORAGE_KEYS.purchases, JSON.stringify(purchasedBooks));
    } catch { /* ignore */ }
  }, [cart, purchasedBooks]);

  const addToCart = useCallback((bookId, format = 'ebook') => {
    const safeFormat = normalizeFormat(format);

    setCart(prev => {
      const existing = prev.find((c) => c.id === bookId && c.format === safeFormat);
      if (existing) {
        return prev.map((c) => (
          c.id === bookId && c.format === safeFormat
            ? { ...c, quantity: Math.min(99, (c.quantity || 1) + 1) }
            : c
        ));
      }

      const book = books.find((b) => b.id === bookId);
      if (!book) return prev;

      const finalPrice = getUnitPrice(book, safeFormat);
      return [...prev, { ...book, format: safeFormat, finalPrice, quantity: 1 }];
    });
  }, [books]);

  const removeFromCart = useCallback((bookId, format) => {
    if (!format) {
      setCart((prev) => prev.filter((c) => c.id !== bookId));
      return;
    }

    const safeFormat = normalizeFormat(format);
    setCart((prev) => prev.filter((c) => !(c.id === bookId && c.format === safeFormat)));
  }, []);

  const updateQuantity = useCallback((bookId, format, qty) => {
    const nextQuantity = Number(qty);
    if (!Number.isFinite(nextQuantity)) return;

    if (nextQuantity < 1) {
      removeFromCart(bookId, format);
      return;
    }

    const safeFormat = normalizeFormat(format);
    setCart((prev) => prev.map((c) => (
      c.id === bookId && c.format === safeFormat
        ? { ...c, quantity: Math.min(99, Math.floor(nextQuantity)) }
        : c
    )));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const mergePurchases = useCallback((current, incoming) => {
    const merged = current.map(normalizePurchaseItem).filter(Boolean);
    const normalizedIncoming = incoming.map(normalizePurchaseItem).filter(Boolean);

    for (const purchase of normalizedIncoming) {
      const exists = merged.some((item) => {
        if (item.bookId !== purchase.bookId) return false;
        if (normalizeFormat(item.format) !== normalizeFormat(purchase.format)) return false;

        if (item.txnId && purchase.txnId) {
          return item.txnId === purchase.txnId;
        }

        return true;
      });

      if (!exists) {
        merged.push(purchase);
      }
    }

    return merged;
  }, []);

  const addPurchase = useCallback((purchase) => {
    const normalizedPurchase = normalizePurchaseItem(purchase);
    if (!normalizedPurchase) return;
    setPurchasedBooks((prev) => mergePurchases(prev, [normalizedPurchase]));
  }, [mergePurchases]);

  const syncPurchasesFromServer = useCallback((serverPurchases) => {
    if (!Array.isArray(serverPurchases)) return;
    setPurchasedBooks((prev) => mergePurchases(prev, serverPurchases));
  }, [mergePurchases]);

  const replacePurchasesFromServer = useCallback((serverPurchases) => {
    if (!Array.isArray(serverPurchases)) {
      return;
    }

    const normalized = serverPurchases.map(normalizePurchaseItem).filter(Boolean);
    setPurchasedBooks(normalized);
  }, []);

  const incrementReadSessions = useCallback((bookId) => {
    const safeBookId = Number(bookId);
    setPurchasedBooks(prev => prev.map(p => Number(p.bookId) === safeBookId ? { ...p, readSessions: (p.readSessions || 0) + 1 } : p));
  }, []);

  const syncCartFromServer = useCallback(async (booksData) => {
    try {
      const res = await fetch('/api/customer/cart', { headers: { Accept: 'application/json' }, credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401 || res.status === 419) {
          return;
        }

        return;
      }

      const serverCart = await res.json();
      if (!Array.isArray(serverCart)) return;

      const sourceBooks = Array.isArray(booksData) ? booksData : books;
      const normalized = serverCart
        .map((item) => normalizeCartItem(item, sourceBooks))
        .filter(Boolean);

      setCart(normalized);
    } catch { /* ignore */ }
  }, [books]);

  const saveCartToServer = useCallback(() => {
    if (cartSyncTimer.current) clearTimeout(cartSyncTimer.current);

    cartSyncTimer.current = setTimeout(() => {
      const compact = cart.map((c) => ({
        id: c.id,
        format: normalizeFormat(c.format),
        finalPrice: Math.max(0, toNumber(c.finalPrice, c.price || 0)),
        quantity: Math.max(1, Math.min(99, Number(c.quantity) || 1)),
      }));

      fetch('/api/customer/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cart: compact }),
      }).catch(() => {});
    }, 1500);
  }, [cart]);

  const openModal = useCallback((type, data = null) => {
    console.log('[AppContext] openModal:', type, data);
    setActiveModal(type);
    setModalData(data);
    document.documentElement.classList.add('modal-open');
  }, []);

  const closeModal = useCallback(() => {
    console.log('[AppContext] closeModal');
    setActiveModal(null);
    setModalData(null);
    document.documentElement.classList.remove('modal-open');
  }, []);

  const cartTotal = cart.reduce((acc, c) => acc + c.finalPrice * (c.quantity || 1), 0);
  const cartCount = cart.reduce((acc, c) => acc + (c.quantity || 1), 0);

  return (
    <AppContext.Provider value={{
      books, authors, loading,
      cart, setCart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount,
      purchasedBooks, addPurchase, syncPurchasesFromServer, replacePurchasesFromServer, incrementReadSessions,
      syncCartFromServer, saveCartToServer,
      activeModal, modalData, openModal, closeModal,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
