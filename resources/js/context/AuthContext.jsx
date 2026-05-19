import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);

  // Vérifier la session au chargement
  useEffect(() => {
    fetch('/api/customer/me', { headers: { Accept: 'application/json' }, credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setUser(data.user || null);
      })
      .catch(() => {
        setUser(null);
        setWishlist([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const register = useCallback(async (name, email, phone, password) => {
    const res = await fetch('/api/customer/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/customer/logout', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    setUser(null);
    setWishlist([]);
  }, []);

  const updateProfile = useCallback(async (name, email, phone) => {
    const res = await fetch('/api/customer/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    setUser(data.user);
    return data.user;
  }, []);

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/customer/orders', {
      headers: { Accept: 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  }, []);

  const fetchPurchases = useCallback(async () => {
    const res = await fetch('/api/customer/purchases', {
      headers: { Accept: 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const res = await fetch('/api/customer/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  }, []);

  const resetPassword = useCallback(async (email, code, password) => {
    const res = await fetch('/api/customer/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, code, password }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    setUser(data.user);
    return data;
  }, []);

  const resendVerification = useCallback(async () => {
    const res = await fetch('/api/customer/resend-verification', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  }, []);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch('/api/customer/wishlist', { headers: { Accept: 'application/json' }, credentials: 'include' });
      if (res.ok) { const ids = await res.json(); setWishlist(Array.isArray(ids) ? ids : []); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (user) {
      fetchWishlist();
      return;
    }

    setWishlist([]);
  }, [user, fetchWishlist]);

  const toggleWishlist = useCallback(async (bookId) => {
    const inList = wishlist.includes(bookId);
    const method = inList ? 'DELETE' : 'POST';
    const res = await fetch(`/api/customer/wishlist/${bookId}`, { method, headers: { Accept: 'application/json' }, credentials: 'include' });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || 'Impossible de mettre à jour vos favoris.');
    }

    setWishlist(prev => inList ? prev.filter(id => id !== bookId) : [...prev, bookId]);
    return !inList;
  }, [wishlist]);

  const isWishlisted = useCallback((bookId) => wishlist.includes(bookId), [wishlist]);

  return (
    <AuthContext.Provider value={{ user, loading, wishlist, register, login, logout, updateProfile, fetchOrders, fetchPurchases, forgotPassword, resetPassword, resendVerification, toggleWishlist, isWishlisted }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
