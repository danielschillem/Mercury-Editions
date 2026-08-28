import { useApp } from '../context/AppContext';
import Icon, { FlagBF } from './Icons';

function Cover({ book, className }) {
  if (book.cover_image) {
    return <img src={book.cover_image} alt={`Couverture de ${book.title}`} className={className} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/covers/placeholder.svg'; }} />;
  }

  return (
    <div className={`${className} spotlight-cover-fallback`} style={{ background: `linear-gradient(145deg, ${book.color}, #2b1715)` }}>
      <strong>{book.title}</strong><span>{book.author_name}</span>
    </div>
  );
}

export default function FeaturedSection() {
  const { books, openModal } = useApp();
  const curatedBooks = books.filter((book) => book.is_featured);
  const featuredBooks = (curatedBooks.length > 0 ? curatedBooks : books)
    .slice()
    .sort((a, b) => Number(b.rating) - Number(a.rating) || Number(b.year) - Number(a.year))
    .slice(0, 3);

  if (featuredBooks.length === 0) return null;

  const [leadBook, ...secondaryBooks] = featuredBooks;
  const showBook = (book) => openModal('bookDetail', book.id);

  return (
    <section className="featured-section spotlight-section" id="vedette">
      <div className="inner spotlight-inner">
        <header className="spotlight-heading">
          <div>
            <div className="spotlight-kicker"><span /> La sélection Mercury</div>
            <h2>Trois livres qui font <em>bouger les lignes</em></h2>
          </div>
          <p>Des voix fortes, des idées qui restent et des récits à transmettre. Découvrez les choix de notre comité éditorial.</p>
        </header>

        <div className="spotlight-layout">
          <article className="spotlight-lead" onClick={() => showBook(leadBook)} style={{ '--book-accent': leadBook.color }}>
            <div className="spotlight-lead-art">
              <span className="spotlight-number">01</span>
              <div className="spotlight-halo" />
              <Cover book={leadBook} className="spotlight-lead-cover" />
            </div>
            <div className="spotlight-lead-copy">
              <div className="spotlight-meta">
                {leadBook.local && <span><FlagBF size={12} /> Voix du Burkina</span>}
                <span>{leadBook.category}</span>
                <span>{leadBook.year}</span>
              </div>
              <h3>{leadBook.title}</h3>
              <p className="spotlight-author">par {leadBook.author_name}</p>
              <p className="spotlight-description">{leadBook.description}</p>
              <div className="spotlight-lead-footer">
                <div><strong>{leadBook.price.toLocaleString('fr-FR')}</strong><small> FCFA</small></div>
                <button type="button">Découvrir l’œuvre <Icon name="arrowRight" size={15} /></button>
              </div>
            </div>
          </article>

          <div className="spotlight-secondary">
            <div className="spotlight-secondary-label"><Icon name="sparkles" size={15} /> À lire ensuite</div>
            {secondaryBooks.map((book, index) => (
              <article className="spotlight-mini" key={book.id} onClick={() => showBook(book)} style={{ '--book-accent': book.color }}>
                <div className="spotlight-mini-art">
                  <span className="spotlight-mini-number">0{index + 2}</span>
                  <Cover book={book} className="spotlight-mini-cover" />
                </div>
                <div className="spotlight-mini-copy">
                  <span className="spotlight-mini-category">{book.category} · {book.year}</span>
                  <h3>{book.title}</h3>
                  <p>{book.author_name}</p>
                  <footer>
                    <strong>{book.price.toLocaleString('fr-FR')} <small>FCFA</small></strong>
                    <span aria-hidden="true"><Icon name="arrowRight" size={15} /></span>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="spotlight-bottomline">
          <span>Romans</span><i /> <span>Essais</span><i /> <span>Poésie</span>
          <button type="button" onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}>
            Explorer les {books.length} œuvres <Icon name="arrowRight" size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
