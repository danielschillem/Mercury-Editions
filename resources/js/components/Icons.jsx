// Mercury SVG Icon Library — Real vector icons replacing all emojis
// Usage: <Icon name="cart" size={20} /> or <Icon name="cart" />

const paths = {
  // ─── Navigation & UI ───
  cart:       'M7 4h14l-1.5 9H8.5L7 4zm0 0L6 2H2m6 14a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z',
  close:      'M18 6L6 18M6 6l12 12',
  menu:       'M4 6h16M4 12h16M4 18h16',
  arrowRight: 'M5 12h14m-7-7 7 7-7 7',
  arrowLeft:  'M19 12H5m7-7-7 7 7 7',
  check:      'M5 13l4 4L19 7',
  search:     'M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  sortAsc:    'M3 4h13M3 8h9M3 12h5m5 0l4 4m0 0l4-4m-4 4V4',
  chevronDown:'M6 9l6 6 6-6',
  chevronLeft:'M15 18l-6-6 6-6',
  chevronRight:'M9 18l6-6-6-6',
  warning:    'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  error:      'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.5 13.5L12 12l-3.5 3.5m0-7L12 12l3.5-3.5',
  moon:       'M21 12.79A9 9 0 1 1 11.21 3c-.02.33-.03.66-.03 1a8 8 0 0 0 8 8c.34 0 .67-.01 1-.03z',
  sun:        'M12 4V2m0 20v-2m8-8h2M2 12h2m12.95 6.95l1.41 1.41M4.64 4.64l1.41 1.41m10.9-1.41-1.41 1.41M6.05 17.95l-1.41 1.41M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  bell:       'M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0',
  info:       'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-14v.01M12 11v5',

  // ─── Player & Media Controls ───
  play:       'M5 3l14 9-14 9V3z',
  pause:      'M6 4h4v16H6zM14 4h4v16h-4z',
  stop:       'M6 4h12v16H6z',
  skipBack:   'M19 20L9 12l10-8v16zM5 19V5',
  skipForward:'M5 4l10 8-10 8V4zM19 5v14',
  barChart:   'M12 20V10M6 20V4M18 20v-6',
  
  // ─── Audio & Voice ───
  volume:     'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07',
  volume2:    'M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07',
  volumeX:    'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6',
  mic:        'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8',
  headphones: 'M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z',
  settings:   'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  
  // ─── Reading Progress ───
  bookmark:   'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  save:       'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
  clock:      'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  calendar:   'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18',
  layers:     'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',

  // ─── Formats ───
  smartphone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm5 18h.01',
  package:    'M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12',

  // ─── Books & Reading ───
  book:       'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z',
  bookOpen:   'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zm20 0h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  library:    'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15zM8 7h8M8 11h6',
  scroll:     'M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4zM10 17V3h12v14',

  // ─── Payment ───
  creditCard: 'M1 10h22M1 6a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6z',
  lock:       'M5 11V7a7 7 0 0 1 14 0v4m-2 0H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 1-2-2v-7a2 2 0 0 0-2-2z',
  shield:     'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',

  // ─── People & Authors ───
  user:       'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  pen:        'M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z',
  newspaper:  'M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2-3v16a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2zm-8 3h4m-4 4h4m-8 4h8',
  globe:      'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z',
  theater:    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 13.5v-3m4 3v-3m-5 5c1 1 2.5 1.5 3 1.5s2-.5 3-1.5M8.5 9a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0zm6 0a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0z',
  drum:       'M12 5c-4.42 0-8 1.34-8 3v8c0 1.66 3.58 3 8 3s8-1.34 8-3V8c0-1.66-3.58-3-8-3zm0 0c4.42 0 8 1.34 8 3M4 8c0 1.66 3.58 3 8 3s8-1.34 8-3',

  // ─── Status & Awards ───
  trophy:     'M6 9a6 6 0 0 0 12 0V3H6v6zM6 3H2v3a4 4 0 0 0 4 4m12-7h4v3a4 4 0 0 1-4 4m-6 4v4m-4 0h8',
  award:      'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm0 0v7m-4-3.5L12 22l4-3.5',
  graduation: 'M22 10l-10-6L2 10l10 6 10-6zM6 12.5v4c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5v-4',
  scale:      'M12 3v18m-7-4l3.5-7L12 3l3.5 7L19 17M5 17h4m6 0h4',
  dove:       'M12 3c-1 4-4 7-8 8 3-1 5 0 7 2-2 0-4 1-5 3 2-1 4-1 6 0-1 2-2 4-2 6 2-1 4-1 5 0 4 0 8-3 9-7-3-1-5-3-6-6 2-1 3-3 3-5-2 1-5 2-9-1z',
  museum:     'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01',

  // ─── Misc ───
  mail:       'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2 8 5 8-5',
  flag:       'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zm0 7v-7',
  star:       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  starHalf:   'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77V2z',
  printer:    'M6 9V2h12v7m-12 8h12v5H6v-5zm0-8h12a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3m-12 0a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3',
  tag:        'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  noEntry:    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM4.93 4.93l14.14 14.14',
  download:   'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3',
  celebrate:  'M12 2v4m-7.07.93L7.05 9.05m12.02-2.12L16.95 9.05M5 18h14M6 14l6 6 6-6',
  heart:      'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  share:      'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8m-4-6l-4-4-4 4m4-4v13',
  send:       'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  messageCircle: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
  users:      'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m22 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mapPin:     'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  
  // ─── Carousel & Navigation ───
  'chevron-left':  'M15 18l-6-6 6-6',
  'chevron-right': 'M9 18l6-6-6-6',
  sparkles:   'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z M20 3v4m2-2h-4M4 17v2m1-1H3',
  'hand-pointer': 'M11.5 4V2.5m3 3.5L13 4.5m-6 4L5.5 7M18 13l2 2m-4-4l1.5-1.5M7 12l10.5 2.5a.5.5 0 0 1 .4.6l-1.1 4.9a2 2 0 0 1-2.1 1.6l-5.7-.9a2 2 0 0 1-1.6-1.3l-2.3-6.2a1 1 0 0 1 1.3-1.3z',
};

export default function Icon({ name, size = 18, className = '', style = {}, strokeWidth = 2 }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

// Star rating component — vector stars for ratings (full/half/empty)
export function StarRating({ rating, size = 14 }) {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <span style={{ display: 'inline-flex', gap: '1px', color: '#D4A017' }}>
      {Array(full).fill(null).map((_, i) => (
        <svg key={`f${i}`} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
        </svg>
      ))}
      {hasHalf && (
        <svg width={size} height={size} viewBox="0 0 24 24" stroke="none">
          <defs><clipPath id="halfClip"><rect x="0" y="0" width="12" height="24" /></clipPath></defs>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" fill="currentColor" clipPath="url(#halfClip)" />
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
      {Array(empty).fill(null).map((_, i) => (
        <svg key={`e${i}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
        </svg>
      ))}
    </span>
  );
}

// Burkina Faso flag — vector SVG
export function FlagBF({ size = 16 }) {
  return (
    <svg width={size} height={Math.round(size * 0.67)} viewBox="0 0 18 12" style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }} aria-label="Burkina Faso">
      <rect width="18" height="6" fill="#EF2B2D" />
      <rect y="6" width="18" height="6" fill="#009E49" />
      <polygon points="9,2.5 9.9,5 12.5,5 10.3,6.8 11.1,9.3 9,7.7 6.9,9.3 7.7,6.8 5.5,5 8.1,5" fill="#FCD116" />
    </svg>
  );
}
