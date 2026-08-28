import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import Icon from './Icons';

export default function ContactModal({ onClose }) {
    const toast = useToast();
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Message envoyé !');
                onClose();
            } else {
                const errors = data.errors ? Object.values(data.errors).flat().join(' ') : data.message;
                toast.error(errors || 'Erreur lors de l\'envoi.');
            }
        } catch {
            toast.error('Erreur réseau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Fermer"><Icon name="close" size={18} /></button>
                <div className="contact-modal-header">
                    <span className="form-header-icon"><Icon name="messageCircle" size={22} /></span>
                    <div className="form-eyebrow">Équipe Mercury</div>
                    <h2>Nous contacter</h2>
                    <p>Parlez-nous de votre demande. Notre équipe vous répondra avec un suivi clair et personnalisé.</p>
                </div>
                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="contact-form-row">
                        <div className="contact-field">
                        <label><Icon name="user" size={14} /> Nom complet</label>
                            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Votre nom" required />
                        </div>
                        <div className="contact-field">
                        <label><Icon name="mail" size={14} /> Adresse email</label>
                            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="votre@email.com" required />
                        </div>
                    </div>
                    <div className="contact-field">
                        <label><Icon name="tag" size={14} /> Sujet</label>
                        <input type="text" value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="Objet de votre message" required />
                    </div>
                    <div className="contact-field">
                        <label><Icon name="messageCircle" size={14} /> Votre message</label>
                        <textarea rows={5} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Décrivez votre demande en détail..." required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Envoi en cours...' : <><Icon name="send" size={16} /> Envoyer le message</>}
                    </button>
                    <p className="form-privacy"><Icon name="shield" size={14} /> Vos coordonnées sont uniquement utilisées pour répondre à cette demande.</p>
                </form>
            </div>
        </div>
    );
}
