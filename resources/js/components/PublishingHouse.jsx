import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import Icon from './Icons';

const fallbackCollections = [
  {
    name: 'Littérature & récits',
    description: 'Romans, nouvelles, poésie et textes de scène pour faire entendre les imaginaires du Burkina et du continent.',
    icon: 'bookOpen',
  },
  {
    name: 'Savoirs & société',
    description: 'Essais, histoire, droit, citoyenneté et sciences sociales pour publier des idées utiles au débat public.',
    icon: 'library',
  },
  {
    name: 'Jeunesse & transmission',
    description: 'Albums, contes, manuels et textes courts pour accompagner les jeunes lecteurs, les familles et les écoles.',
    icon: 'graduation',
  },
];

const editorialSteps = [
  'Lecture du manuscrit',
  'Comité éditorial',
  'Direction littéraire',
  'Correction & maquette',
  'Publication papier et numérique',
];

export default function PublishingHouse() {
  const { openModal } = useApp();
  const [collections, setCollections] = useState(fallbackCollections);

  useEffect(() => {
    fetch('/api/editorial-collections', { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCollections(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="publishing-house-section" id="maison">
      <div className="publishing-inner">
        <div className="publishing-manifesto">
          <div className="section-tag">Maison d'édition</div>
          <h2 className="section-title">Publier, accompagner, <em>faire circuler</em></h2>
          <p>
            Mercury Editions devient une maison d'édition burkinabè à part entière:
            un lieu de sélection, d'accompagnement éditorial, de fabrication et de
            diffusion pour les auteurs qui veulent donner une forme durable à leurs textes.
          </p>
          <div className="publishing-actions">
            <button type="button" className="btn btn-red" onClick={() => openModal('manuscriptSubmission')}>
              <Icon name="send" size={16} /> Soumettre un manuscrit
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => openModal('contact')}>
              <Icon name="mail" size={16} /> Parler à l'édition
            </button>
          </div>
        </div>

        <div className="publishing-panel" aria-label="Engagements éditoriaux Mercury">
          <div className="publishing-panel-kicker">Notre rôle</div>
          <div className="publishing-proof-grid">
            <div>
              <strong>3</strong>
              <span>collections fondatrices</span>
            </div>
            <div>
              <strong>5</strong>
              <span>étapes éditoriales</span>
            </div>
            <div>
              <strong>2</strong>
              <span>formats: papier et ebook</span>
            </div>
          </div>
          <p>
            Chaque livre publié par Mercury doit pouvoir être lu, acheté,
            recommandé et archivé avec le même soin qu'un ouvrage imprimé.
          </p>
        </div>
      </div>

      <div className="publishing-inner publishing-collections">
        {collections.map((collection) => (
          <article className="collection-card" key={collection.slug || collection.name}>
            <div className="collection-icon">
              <Icon name={collection.icon} size={22} />
            </div>
            <h3>{collection.name}</h3>
            <p>{collection.description}</p>
          </article>
        ))}
      </div>

      <div className="publishing-inner editorial-chain">
        <div>
          <div className="section-tag">Processus</div>
          <h3>Une chaîne éditoriale claire</h3>
        </div>
        <ol className="editorial-steps">
          {editorialSteps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
