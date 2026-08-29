import { useCallback, useEffect, useState } from 'react';
import { api } from '../admin/api';
import Icon from './Icons';

const labels = {
  roman: 'Romans', poesie: 'Poésie', conte: 'Contes', essai: 'Essais', jeunesse: 'Jeunesse',
  developpement: 'Développement personnel', sante: 'Santé', spiritualite: 'Spiritualité', histoire: 'Histoire', societe: 'Société',
};

const emptyGroup = { name: '', description: '', interest: 'roman', visibility: 'public', membership_policy: 'open', member_limit: 50, current_book_id: '' };

export default function ReaderCommunity({ books = [], toast, purchasedBookIds = [], onOpenReader }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [profile, setProfile] = useState({ alias: '', bio: '', interests: [], visible: true });
  const [groupForm, setGroupForm] = useState(emptyGroup);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [saving, setSaving] = useState(false);

  const notify = (text, type = 'success') => toast?.[type]?.(text);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/customer/community');
      setData(response);
      setProfile({
        alias: response.profile?.alias || '', bio: response.profile?.bio || '',
        interests: response.profile?.interests || [], visible: response.profile?.visible !== false,
      });
    } catch (error) { notify(error.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openGroup = async (slug) => {
    try { setSelected(await api.get(`/api/customer/community/groups/${slug}`)); }
    catch (error) { notify(error.message, 'error'); }
  };

  const saveProfile = async (event) => {
    event.preventDefault(); setSaving(true);
    try { const result = await api.put('/api/customer/community/profile', profile); notify(result.message); setProfileOpen(false); await load(); }
    catch (error) { notify(error.message, 'error'); }
    finally { setSaving(false); }
  };

  const createGroup = async (event) => {
    event.preventDefault(); setSaving(true);
    const payload = { ...groupForm, member_limit: Number(groupForm.member_limit), current_book_id: groupForm.current_book_id ? Number(groupForm.current_book_id) : null };
    try { const result = await api.post('/api/customer/community/groups', payload); notify(result.message); setCreateOpen(false); setGroupForm(emptyGroup); await load(); await openGroup(result.group.slug); }
    catch (error) { notify(error.message, 'error'); }
    finally { setSaving(false); }
  };

  const join = async (group) => {
    try { const result = await api.post(`/api/customer/community/groups/${group.slug}/join`, {}); notify(result.message); await load(); await openGroup(group.slug); }
    catch (error) { notify(error.message, 'error'); }
  };

  const leave = async (group) => {
    try { const result = await api.del(`/api/customer/community/groups/${group.slug}/leave`); notify(result.message); setSelected(null); await load(); }
    catch (error) { notify(error.message, 'error'); }
  };

  const post = async (event) => {
    event.preventDefault(); if (!message.trim() || !selected) return;
    try { await api.post(`/api/customer/community/groups/${selected.group.slug}/posts`, { body: message }); setMessage(''); setReplyingTo(null); await openGroup(selected.group.slug); }
    catch (error) { notify(error.message, 'error'); }
  };

  const moderate = async (membershipId, status) => {
    try { await api.patch(`/api/customer/community/groups/${selected.group.slug}/members/${membershipId}`, { status }); await openGroup(selected.group.slug); await load(); }
    catch (error) { notify(error.message, 'error'); }
  };

  const toggleInterest = (interest) => setProfile((current) => ({
    ...current,
    interests: current.interests.includes(interest) ? current.interests.filter((item) => item !== interest) : [...current.interests, interest],
  }));

  if (loading) return <div className="account-loading"><div className="spinner" /> Chargement de la communauté...</div>;

  if (selected) {
    const { group, membership, members = [], posts = [], pending_requests: pending = [] } = selected;
    const activeMember = membership?.status === 'active';
    const owner = membership?.role === 'owner';
    return (
      <div className="reader-community">
        <button className="account-link-btn community-back" onClick={() => setSelected(null)}><Icon name="arrowLeft" size={15} /> Tous les groupes</button>
        <section className="community-group-hero">
          <div><span className="community-pill">{labels[group.interest] || group.interest}</span><h2>{group.name}</h2><p>{group.description}</p></div>
          <div className="community-group-actions">
            <span><Icon name="users" size={15} /> {group.members_count} membres</span>
            {!membership && <button className="btn btn-red" onClick={() => join(group)}>Rejoindre</button>}
            {membership?.status === 'pending' && <span className="community-pending">Demande en attente</span>}
            {activeMember && !owner && <button className="btn btn-outline account-outline-dark" onClick={() => leave(group)}>Quitter</button>}
          </div>
        </section>
        {group.current_book && <section className="community-current-book"><Icon name="bookOpen" size={24} /><div><span>Lecture du groupe</span><strong>{group.current_book.title}</strong><small>{group.current_book.author_name}</small></div>{purchasedBookIds.includes(Number(group.current_book.id)) && <button className="btn" onClick={() => onOpenReader?.(group.current_book.id)}>Ouvrir mon ebook</button>}</section>}
        {owner && pending.length > 0 && <section className="community-panel"><h3>Demandes d’adhésion</h3>{pending.map((entry) => <div className="community-request" key={entry.membership_id}><span>{entry.name}</span><div><button onClick={() => moderate(entry.membership_id, 'active')}>Accepter</button><button onClick={() => moderate(entry.membership_id, 'rejected')}>Refuser</button></div></div>)}</section>}
        <div className="community-detail-grid">
          <section className="community-panel community-discussion"><h3><Icon name="messageCircle" size={18} /> Discussion</h3>
            <div className="community-posts">{posts.length === 0 && <div className="community-conversation-empty"><Icon name="messageCircle" size={28} /><strong>Ouvrez la discussion</strong><p>Posez une question sur le livre ou partagez un passage qui vous a marqué.</p></div>}{posts.map((entry) => <article className={`community-post${entry.is_mine ? ' mine' : ''}`} key={entry.id}><div className="community-post-head"><span className="community-post-avatar">{entry.author.charAt(0).toUpperCase()}</span><div><strong>{entry.author}</strong><time>{new Date(entry.created_at).toLocaleString('fr-FR')}</time></div></div><p>{entry.body}</p>{activeMember && <button className="community-reply" onClick={() => { setReplyingTo(entry.author); setMessage(`@${entry.author} `); }}>Répondre</button>}</article>)}</div>
            {activeMember ? <form className="community-compose" onSubmit={post}>{replyingTo && <div className="community-replying">Réponse à <strong>{replyingTo}</strong><button type="button" onClick={() => { setReplyingTo(null); setMessage(''); }}><Icon name="close" size={12} /></button></div>}<textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} placeholder="Partagez une réflexion, une citation ou une question…" /><div className="community-compose-footer"><span>{message.length}/2000 · Respect et bienveillance</span><button className="btn btn-red" disabled={!message.trim()}><Icon name="send" size={14} /> Publier</button></div></form> : <div className="community-join-callout"><Icon name="users" size={20} /><div><strong>Participez à la conversation</strong><span>Rejoignez ce cercle pour publier et répondre aux lecteurs.</span></div>{!membership && <button className="btn btn-red" onClick={() => join(group)}>Rejoindre le groupe</button>}</div>}
          </section>
          <aside className="community-panel community-members"><h3>Membres</h3>{members.map((member) => <div className="community-member" key={member.id}><span>{member.name.charAt(0).toUpperCase()}</span><div><strong>{member.name}</strong><small>{member.role === 'owner' ? 'Fondateur' : member.role === 'moderator' ? 'Modérateur' : 'Membre'}</small></div></div>)}</aside>
        </div>
      </div>
    );
  }

  const groupCard = (group) => {
    const membership = group.membership;
    return <article className="community-card" key={group.id} onClick={() => openGroup(group.slug)}><div className="community-card-top"><span className="community-pill">{labels[group.interest] || group.interest}</span><span>{group.visibility === 'private' ? <><Icon name="lock" size={12} /> Privé</> : 'Cercle public'}</span></div><h3>{group.name}</h3><p>{group.description}</p>{group.current_book && <div className="community-book-line"><Icon name="bookOpen" size={14} /><span><small>Lecture actuelle</small>{group.current_book.title}</span></div>}<footer><span><Icon name="users" size={14} /> {group.members_count} lecteur{group.members_count > 1 ? 's' : ''}</span>{membership?.status === 'active' ? <button>Ouvrir le cercle <Icon name="arrowRight" size={13} /></button> : membership?.status === 'pending' ? <em>Demande envoyée</em> : <button className="community-card-join" onClick={(event) => { event.stopPropagation(); join(group); }}>{group.membership_policy === 'approval' ? 'Demander à rejoindre' : 'Rejoindre'} <Icon name="arrowRight" size={13} /></button>}</footer></article>;
  };

  return (
    <div className="reader-community">
      <section className="community-header"><div><span className="account-panel-kicker">Le cercle Mercury</span><h2>Lire ensemble, aller plus loin</h2><p>Retrouvez des lecteurs qui partagent vos centres d’intérêt et faites vivre vos lectures.</p></div><div className="community-header-actions"><button className="btn btn-outline account-outline-dark" onClick={() => setProfileOpen(true)}><Icon name="user" size={14} /> Profil lecteur</button><button className="btn btn-red" onClick={() => setCreateOpen(true)}><Icon name="users" size={14} /> Créer un groupe</button></div></section>
      <section className="community-how"><div className="community-how-heading"><span>Comment participer ?</span><h3>Votre club de lecture en trois étapes</h3></div><ol><li><b>01</b><span><strong>Choisissez un cercle</strong><small>Explorez les groupes par thème ou livre en cours.</small></span></li><li><b>02</b><span><strong>Rejoignez-le</strong><small>L’accès est immédiat ou validé par le fondateur.</small></span></li><li><b>03</b><span><strong>Échangez</strong><small>Publiez une idée, posez une question et répondez aux membres.</small></span></li></ol></section>
      <div className="community-stats"><div><strong>{data.stats.groups}</strong><span>groupes actifs</span></div><div><strong>{data.stats.memberships}</strong><span>groupes rejoints</span></div><div><strong>{profile.interests.length}</strong><span>centres d’intérêt</span></div></div>
      {data.my_groups.length > 0 && <section className="community-section"><h3>Mes groupes</h3><div className="community-grid">{data.my_groups.map(groupCard)}</div></section>}
      <section className="community-section"><h3>Groupes recommandés</h3>{data.suggested_groups.length ? <div className="community-grid">{data.suggested_groups.map(groupCard)}</div> : <div className="account-empty"><Icon name="users" size={36} /><p>Aucun autre groupe pour le moment. Créez le premier cercle autour de votre lecture.</p></div>}</section>

      {profileOpen && <div className="community-modal-backdrop" onClick={() => setProfileOpen(false)}><form className="community-modal" onSubmit={saveProfile} onClick={(e) => e.stopPropagation()}><h3>Mon profil lecteur</h3><label>Pseudonyme public<input value={profile.alias} onChange={(e) => setProfile({ ...profile, alias: e.target.value })} maxLength={60} placeholder="Votre nom dans les groupes" /></label><label>Quelques mots sur vos lectures<textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} maxLength={600} /></label><fieldset><legend>Centres d’intérêt</legend><div className="community-interest-list">{data.available_interests.map((interest) => <button type="button" className={profile.interests.includes(interest) ? 'active' : ''} onClick={() => toggleInterest(interest)} key={interest}>{labels[interest]}</button>)}</div></fieldset><label className="community-check"><input type="checkbox" checked={profile.visible} onChange={(e) => setProfile({ ...profile, visible: e.target.checked })} /> Rendre mon profil visible aux membres</label><div className="community-modal-actions"><button type="button" onClick={() => setProfileOpen(false)}>Annuler</button><button className="btn btn-red" disabled={saving}>Enregistrer</button></div></form></div>}
      {createOpen && <div className="community-modal-backdrop" onClick={() => setCreateOpen(false)}><form className="community-modal" onSubmit={createGroup} onClick={(e) => e.stopPropagation()}><h3>Créer un groupe de lecture</h3><label>Nom<input required minLength={3} maxLength={100} value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} /></label><label>Description<textarea required minLength={20} maxLength={1500} value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} /></label><div className="community-form-grid"><label>Thématique<select value={groupForm.interest} onChange={(e) => setGroupForm({ ...groupForm, interest: e.target.value })}>{data.available_interests.map((interest) => <option value={interest} key={interest}>{labels[interest]}</option>)}</select></label><label>Livre du moment<select value={groupForm.current_book_id} onChange={(e) => setGroupForm({ ...groupForm, current_book_id: e.target.value })}><option value="">Aucun pour le moment</option>{books.map((book) => <option value={book.id} key={book.id}>{book.title}</option>)}</select></label><label>Visibilité<select value={groupForm.visibility} onChange={(e) => setGroupForm({ ...groupForm, visibility: e.target.value })}><option value="public">Public</option><option value="private">Privé</option></select></label><label>Adhésion<select value={groupForm.membership_policy} onChange={(e) => setGroupForm({ ...groupForm, membership_policy: e.target.value })}><option value="open">Libre</option><option value="approval">Sur validation</option></select></label><label>Nombre maximum<input type="number" min="2" max="500" value={groupForm.member_limit} onChange={(e) => setGroupForm({ ...groupForm, member_limit: e.target.value })} /></label></div><div className="community-modal-actions"><button type="button" onClick={() => setCreateOpen(false)}>Annuler</button><button className="btn btn-red" disabled={saving}>Créer le groupe</button></div></form></div>}
    </div>
  );
}
