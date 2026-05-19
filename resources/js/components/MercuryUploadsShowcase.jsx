import Icon from './Icons';
import { useApp } from '../context/AppContext';

// Les nouvelles couvertures Mercury - Collection Premium
const mercuryCovers = [
  { id: 13, title: 'Le Capitaine Ibrahim Traoré a dit', image: '/images/covers/mercury/le-capitaine-ibrahim-traoré-à-dit.png', tag: 'Leadership' },
  { id: 14, title: 'Capitaine Thomas Sankara', image: '/images/covers/mercury/capitaine-thomas-sankara-à-la-découverte-dun-leader-charismatique.png', tag: 'Biographie' },
  { id: 16, title: 'La Force d\'oser', image: '/images/covers/mercury/la-force-doser.png', tag: 'Inspiration' },
  { id: 17, title: 'Intelligence artificielle', image: '/images/covers/mercury/intéligence-artificielle-comprendre-pour-mieux-adopter-et-saisir-les-opporttunnités.png', tag: 'Innovation' },
  { id: 18, title: 'Cinquante ans d\'avocature', image: '/images/covers/mercury/cinquante-ans-dune-avocature-en-mouvement.png', tag: 'Mémoires' },
  { id: 21, title: 'Le Patriote', image: '/images/covers/mercury/le-patriote.png', tag: 'Roman' },
  { id: 22, title: 'La Rose noire', image: '/images/covers/mercury/la-rose-noire.png', tag: 'Roman' },
  { id: 23, title: 'Osez rêver votre vie', image: '/images/covers/mercury/osez-rêver-votre-vie-pour-vivre-votre-rêve.png', tag: 'Développement' },
  { id: 25, title: 'Mieux vivre sa ménopause', image: '/images/covers/mercury/mieux-vivre-sa-ménopose.png', tag: 'Santé' },
  { id: 27, title: 'Les Murmurations', image: '/images/covers/mercury/les-murmurations-chemin-de-vie-et-transformation-spirituelle.png', tag: 'Spiritualité' },
  { id: 28, title: 'Devenir un ancêtre', image: '/images/covers/mercury/devenir-un-ancêtre.png', tag: 'Philosophie' },
  { id: 32, title: 'Burkina Faso, un ténor de l\'Or', image: '/images/covers/mercury/burkina-faso-un-ténor-de-lor.png', tag: 'Économie' },
  { id: 33, title: 'Monsieur le Maire', image: '/images/covers/mercury/monsieur-le-maire.png', tag: 'Satire' },
  { id: 36, title: 'Kisgu, l\'éducation par les interdits', image: '/images/covers/mercury/kisgu-ou-léducation-par-les-interdits.png', tag: 'Tradition' },
  { id: 37, title: 'Pour le Faso, j\'ai tenu', image: '/images/covers/mercury/pour-le-faso-jai-tenu.png', tag: 'Témoignages' },
  { id: 44, title: 'Entendez ma voix', image: '/images/covers/mercury/enntendez-ma-voix.png', tag: 'Poésie' },
];

export default function MercuryUploadsShowcase() {
  const { openModal } = useApp();

  return (
    <section className="uploads-showcase" id="arrivages-mercury">
      <div className="inner">
        <div className="section-header">
          <div className="section-tag uploads-tag">
            <Icon name="sparkles" size={14} /> Collection Mercury
          </div>
          <h2 className="section-title">Nouveautés <em>exclusives</em></h2>
        </div>

        <div className="uploads-grid">
          {mercuryCovers.map((cover) => (
            <article 
              key={cover.id} 
              className="upload-card" 
              onClick={() => openModal('bookDetail', cover.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="upload-card-media">
                <img src={cover.image} alt={cover.title} className="upload-card-image" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = '/images/covers/placeholder.svg'; }} />
                <div className="upload-card-tag">{cover.tag}</div>
              </div>
              <div className="upload-card-body">
                <h3 className="upload-card-title">{cover.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}