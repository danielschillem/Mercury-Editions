/**
 * Utilitaires Mercury Editions
 */

/**
 * Formate un prix en FCFA
 * @param {number} price - Prix à formater
 * @param {boolean} showCurrency - Afficher la devise
 */
export function formatPrice(price, showCurrency = true) {
  if (price == null || isNaN(price)) return '—';
  const formatted = new Intl.NumberFormat('fr-FR').format(price);
  return showCurrency ? `${formatted} FCFA` : formatted;
}

/**
 * Formate une date
 * @param {string|Date} date - Date à formater
 * @param {string} format - Format ('short', 'long', 'relative')
 */
export function formatDate(date, format = 'short') {
  if (!date) return '—';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  const options = {
    short: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  };

  if (format === 'relative') {
    return getRelativeTime(d);
  }

  return new Intl.DateTimeFormat('fr-FR', options[format] || options.short).format(d);
}

/**
 * Retourne le temps relatif (il y a X jours, etc.)
 * @param {Date} date - Date
 */
export function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
  if (diffHour < 24) return `Il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
  if (diffDay < 30) return `Il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
  if (diffMonth < 12) return `Il y a ${diffMonth} mois`;
  return `Il y a ${diffYear} an${diffYear > 1 ? 's' : ''}`;
}

/**
 * Tronque un texte avec ellipsis
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 */
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength).trim() + '…';
}

/**
 * Génère un slug à partir d'un texte
 * @param {string} text - Texte source
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Capitalise la première lettre
 * @param {string} text - Texte
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Valide un email
 * @param {string} email - Email à valider
 */
export function isValidEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Valide un numéro de téléphone (format Burkina)
 * @param {string} phone - Téléphone à valider
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  // Accepte les formats: 70123456, 07 01 23 45 67, +226 70 12 34 56
  const cleaned = phone.replace(/[\s\-\.]/g, '');
  const re = /^(\+226)?0?[567]\d{7}$/;
  return re.test(cleaned);
}

/**
 * Génère des initiales à partir d'un nom
 * @param {string} name - Nom complet
 * @param {number} maxChars - Nombre max de caractères
 */
export function getInitials(name, maxChars = 2) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0].toUpperCase())
    .slice(0, maxChars)
    .join('');
}

/**
 * Génère une couleur à partir d'une chaîne
 * @param {string} str - Chaîne source
 */
export function stringToColor(str) {
  if (!str) return '#888888';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
}

/**
 * Retourne les étoiles de notation
 * @param {number} rating - Note (0-5)
 */
export function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return { full, half, empty };
}

/**
 * Classe conditionnelle (mini clsx)
 * @param  {...any} args - Classes et conditions
 */
export function cn(...args) {
  return args
    .flat()
    .filter(x => typeof x === 'string' && x.trim())
    .join(' ');
}

/**
 * Debounce une fonction
 * @param {Function} fn - Fonction à debouncer
 * @param {number} delay - Délai en ms
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle une fonction
 * @param {Function} fn - Fonction à throttler
 * @param {number} limit - Intervalle minimum en ms
 */
export function throttle(fn, limit = 300) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Génère un ID unique
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Deep clone un objet
 * @param {Object} obj - Objet à cloner
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Vérifie si un objet est vide
 * @param {Object} obj - Objet à vérifier
 */
export function isEmpty(obj) {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

/**
 * Groupe un tableau par propriété
 * @param {Array} array - Tableau à grouper
 * @param {string|Function} key - Clé ou fonction de groupement
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = typeof key === 'function' ? key(item) : item[key];
    (result[group] = result[group] || []).push(item);
    return result;
  }, {});
}

/**
 * Attend un certain temps (Promise)
 * @param {number} ms - Millisecondes
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse les query params de l'URL
 * @param {string} search - URL search string
 */
export function parseQueryParams(search = window.location.search) {
  const params = new URLSearchParams(search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/**
 * Construit une query string
 * @param {Object} params - Paramètres
 */
export function buildQueryString(params) {
  const entries = Object.entries(params).filter(([_, v]) => v != null && v !== '');
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries).toString();
}

/**
 * Formate la taille d'un fichier
 * @param {number} bytes - Taille en bytes
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Télécharge un fichier
 * @param {string} url - URL du fichier
 * @param {string} filename - Nom du fichier
 */
export function downloadFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
