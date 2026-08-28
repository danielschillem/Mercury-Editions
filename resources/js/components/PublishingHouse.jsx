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
  {
    name: 'Mercury Patrimoines & Savoirs libres',
    slug: 'patrimoines-savoirs-libres',
    description: 'Classiques, patrimoines et ressources sous licence ouverte, sélectionnés, vérifiés et édités par Mercury.',
    icon: 'scroll',
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
          <div className="publishing-eyebrow"><span>Mercury Éditions</span><i /></div>
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
          <div className="publishing-trust">
            <span><Icon name="check" size={14} /> Lecture attentive</span>
            <span><Icon name="check" size={14} /> Réponse éditoriale</span>
            <span><Icon name="check" size={14} /> Diffusion multiformat</span>
          </div>
        </div>

        <div className="publishing-panel" aria-label="Engagements éditoriaux Mercury">
          <div className="publishing-panel-kicker"><span>Notre rôle</span><Icon name="sparkles" size={18} /></div>
          <div className="publishing-proof-grid">
            <div>
              <strong>{collections.length}</strong>
              <span>collections éditoriales</span>
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
        <div className="collections-heading">
          <div className="section-tag">Nos univers</div>
          <h3>Une collection pour chaque voix</h3>
          <p>Des lignes éditoriales lisibles, pensées pour guider les auteurs et les lecteurs.</p>
        </div>
        {collections.map((collection, index) => (
          <article className="collection-card" key={collection.slug || collection.name}>
            <span className="collection-number">0{index + 1}</span>
            <div className="collection-icon">
              <Icon name={collection.icon} size={22} />
            </div>
            <h3>{collection.name}</h3>
            <p>{collection.description}</p>
            <span className="collection-link">Découvrir la collection <Icon name="arrowRight" size={14} /></span>
          </article>
        ))}
      </div>

      <div className="publishing-inner editorial-chain">
        <div>
          <div className="section-tag">Processus</div>
          <h3>Une chaîne éditoriale claire</h3>
          <p>Du premier regard au lancement, votre texte avance avec une équipe et des repères précis.</p>
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
