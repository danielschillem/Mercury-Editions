import { useApp } from '../context/AppContext';
import Icon from './Icons';

export default function MyLibrary({ onClose }) {
  const { books, purchasedBooks, openModal } = useApp();

  const myBooks = purchasedBooks.map(p => {
    const purchaseBookId = Number(p.bookId ?? p.book_id);
    const book = books.find(b => Number(b.id) === purchaseBookId);
    return book ? { ...p, book } : null;
  }).filter(Boolean);

  return (
    <div className="modal-overlay active" onClick={e => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', fontWeight: 900 }}><Icon name="library" size={22} /> Ma Bibliothèque</h2>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.95rem' }}>{myBooks.length} ouvrage{myBooks.length > 1 ? 's' : ''} acquis</p>
        </div>

        {myBooks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--warm-gray)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><Icon name="bookOpen" size={48} /></div>
            <p>Votre bibliothèque est vide.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Explorez notre catalogue et acquérez vos premiers ouvrages.</p>
            <button className="btn btn-red" onClick={onClose} style={{ marginTop: '1.5rem' }}>Explorer le catalogue</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myBooks.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: '1.25rem',
                padding: '1.25rem', background: 'var(--sand)', borderRadius: '16px'
              }}>
                {item.book.cover_image ? (
                  <img src={item.book.cover_image} alt={item.book.title} style={{
                    width: '60px', height: '80px', borderRadius: '10px',
                    objectFit: 'cover', flexShrink: 0
                  }} onError={(e) => { e.target.onerror = null; e.target.src = '/images/covers/placeholder.svg'; }} />
                ) : (
                  <div style={{
                    width: '60px', height: '80px', borderRadius: '10px',
                    background: item.book.color || 'var(--mercury-red)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 900, fontSize: '1.4rem', flexShrink: 0
                  }}>
                    {item.book.title.charAt(0)}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', marginBottom: '0.25rem' }}>{item.book.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--warm-gray)', marginBottom: '0.5rem' }}>{item.book.author_name}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                    <span style={{ padding: '2px 8px', background: item.format === 'ebook' ? 'rgba(185,28,28,0.1)' : 'rgba(0,0,0,0.06)', borderRadius: '6px', color: item.format === 'ebook' ? 'var(--mercury-red)' : 'var(--charcoal)' }}>
                      {item.format === 'ebook' ? <><Icon name="smartphone" size={11} /> eBook</> : <><Icon name="package" size={11} /> Papier</>}
                    </span>
                    <span style={{ padding: '2px 8px', background: 'rgba(0,0,0,0.04)', borderRadius: '6px', color: '#888' }}>
                      {item.readSessions} session{item.readSessions !== 1 ? 's' : ''} de lecture
                    </span>
                    <span style={{ padding: '2px 8px', background: 'rgba(0,0,0,0.04)', borderRadius: '6px', color: '#888' }}>
                      Acheté le {new Date(item.purchaseDate || Date.now()).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {item.format === 'ebook' && (
                    <button className="btn btn-red" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                      onClick={() => { onClose(); openModal('reader', { bookId: Number(item.bookId ?? item.book_id), returnTo: 'library' }); }}>
                      <Icon name="bookOpen" size={14} /> Lire
                    </button>
                  )}
                  <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    onClick={() => { onClose(); openModal('bookDetail', Number(item.bookId ?? item.book_id)); }}>
                    Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
