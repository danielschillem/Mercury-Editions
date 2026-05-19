import { useApp } from '../context/AppContext';
import Icon, { StarRating, FlagBF } from './Icons';

export default function FeaturedSection() {
  const { books, authors, openModal } = useApp();

  // Top 3 highest-rated books
  const featuredBooks = [...books].sort((a, b) => b.rating - a.rating).slice(0, 3);
  // Top 3 authors by number of books
  const featuredAuthors = [...authors]
    .map(a => ({ ...a, bookCount: books.filter(b => b.author_id === a.id).length }))
    .sort((a, b) => b.bookCount - a.bookCount)
    .slice(0, 3);

  return (
    <section className="featured-section" id="vedette">
      <div className="inner">
        <div className="section-header">
          <div className="section-tag">En vedette</div>
          <h2 className="section-title">Livres &amp; auteurs <em>à découvrir</em></h2>
          <p className="section-subtitle">Notre sélection des œuvres et plumes incontournables de la littérature burkinabè.</p>
        </div>

        {/* ── Featured Books ── */}
        <h3 className="featured-subtitle"><Icon name="star" size={18} /> Livres en vedette</h3>
        <div className="featured-books-grid">
          {featuredBooks.map((book, i) => (
            <div
              key={book.id}
              className={`featured-book-card${i === 0 ? ' featured-book-main' : ''}`}
              onClick={() => openModal('bookDetail', book.id)}
              style={{ '--accent': book.color }}
            >
              <div className="fb-rank">#{i + 1}</div>
              {book.cover_image ? (
                <img src={book.cover_image} alt={book.title} className="fb-cover-img" onError={(e) => { e.target.onerror = null; e.target.src = '/images/covers/placeholder.svg'; }} />
              ) : (
                <div className="fb-cover" style={{ background: `linear-gradient(135deg, ${book.color}, ${book.color}CC)` }}>
                  <div className="fb-cover-title">{book.title}</div>
                  <div className="fb-cover-author">{book.author_name}</div>
                </div>
              )}
              <div className="fb-info">
                {book.local && <div className="fb-local"><FlagBF size={12} /> Auteur burkinabè</div>}
                <div className="fb-title">{book.title}</div>
                <div className="fb-author">{book.author_name}</div>
                <div className="fb-rating"><StarRating rating={book.rating} /> <span>{book.rating}</span></div>
                <p className="fb-desc">{book.description.substring(0, 120)}…</p>
                <div className="fb-footer">
                  <span className="fb-price">{book.price.toLocaleString()} <small>FCFA</small></span>
                  <span className="fb-year">{book.year}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Featured Authors ── */}
        <h3 className="featured-subtitle" style={{ marginTop: '4rem' }}><Icon name="pen" size={18} /> Auteurs en vedette</h3>
        <div className="featured-authors-grid">
          {featuredAuthors.map(author => {
            const authorBooks = books.filter(b => b.author_id === author.id);
            return (
              <div
                key={author.id}
                className="featured-author-card"
                onClick={() => openModal('authorProfile', author.id)}
                style={{ '--accent': author.color }}
              >
                <div className="fa-header" style={{ background: `linear-gradient(135deg, ${author.color}, ${author.color}DD)` }}>
                  <div className="fa-avatar"><Icon name={author.icon} size={36} /></div>
                  <div className="fa-badge">{authorBooks.length} ouvrage{authorBooks.length > 1 ? 's' : ''}</div>
                </div>
                <div className="fa-body">
                  <div className="fa-name">{author.name}</div>
                  <div className="fa-origin">{author.origin}</div>
                  <div className="fa-genres">
                    {author.genres.slice(0, 2).map(g => <span key={g} className="fa-genre-tag">{g}</span>)}
                  </div>
                  <p className="fa-bio">{author.bio.replace(/<[^>]*>/g, '').substring(0, 100)}…</p>
                  <div className="fa-awards">
                    {author.awards.slice(0, 2).map((aw, i) => (
                      <div key={i} className="fa-award"><Icon name="trophy" size={12} /> {aw}</div>
                    ))}
                  </div>
                  <div className="fa-books-preview">
                    {authorBooks.slice(0, 2).map(b =>
                      b.cover_image ? (
                        <img key={b.id} src={b.cover_image} alt={b.title} className="fa-mini-book-img" />
                      ) : (
                        <div key={b.id} className="fa-mini-book" style={{ background: `linear-gradient(135deg, ${b.color}, ${b.color}CC)` }}>
                          {b.title.length > 18 ? b.title.substring(0, 18) + '…' : b.title}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
