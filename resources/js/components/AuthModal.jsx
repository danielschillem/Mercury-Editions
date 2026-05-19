import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import Icon from './Icons';

// Debug logging - silenced in production
const isDev = import.meta.env.DEV;
const log = (...args) => isDev && console.log('[AuthModal]', ...args);

function normalizePhone(raw) {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('226') && digits.length === 11) return digits.slice(3);
  if (digits.startsWith('0') && digits.length === 9) return digits.slice(1);
  return digits;
}

export default function AuthModal({ onClose, intent }) {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const { openModal, cartCount } = useApp();
  const toast = useToast();
  const [mode, setMode] = useState(intent?.mode || 'login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', code: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [debugCode, setDebugCode] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setMode(intent?.mode || 'login');
  }, [intent]);

  const continueAfterAuth = () => {
    setRedirecting(true);
    setTimeout(() => {
      if (intent?.intent === 'checkout') {
        openModal('checkout');
      } else if (intent?.intent === 'library' || intent?.intent === 'account') {
        openModal('account', intent.intent === 'library' ? 'library' : 'overview');
      } else {
        openModal('account', 'overview');
      }
      setRedirecting(false);
    }, 1200);
  };

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setFieldErrors(prev => ({ ...prev, [key]: undefined }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    setSubmitting(true);

    log('Submit mode:', mode);

    try {
      if (mode === 'login') {
        log('Attempting login...');
        await login(form.email, form.password);
        log('Login success');
        toast.success('Connexion réussie !');
        continueAfterAuth();
      } else if (mode === 'register') {
        const clientErrors = {};
        if (!form.name.trim()) clientErrors.name = ['Veuillez renseigner votre nom complet.'];
        if (normalizePhone(form.phone).length !== 8) clientErrors.phone = ['Veuillez entrer un numéro mobile burkinabè valide.'];
        if (form.password.length < 6) clientErrors.password = ['Le mot de passe doit contenir au moins 6 caractères.'];
        if (form.password !== form.confirmPassword) clientErrors.confirmPassword = ['Les mots de passe ne correspondent pas.'];

        if (Object.keys(clientErrors).length > 0) {
          log('Client validation errors:', clientErrors);
          setFieldErrors(clientErrors);
          setSubmitting(false);
          return;
        }

        log('Attempting register...');
        await register(form.name, form.email, normalizePhone(form.phone), form.password);
        log('Register success');
        toast.success('Compte créé avec succès !');
        continueAfterAuth();
      } else if (mode === 'forgot') {
        const data = await forgotPassword(form.email);
        setSuccess(data.message);
        if (data.debug_code) setDebugCode(data.debug_code);
        setMode('reset');
      } else if (mode === 'reset') {
        await resetPassword(form.email, form.code, form.newPassword);
        toast.success('Mot de passe réinitialisé avec succès !');
        onClose();
      }
    } catch (err) {
      console.error('[AuthModal] Error:', err);
      
      // Erreur réseau (fetch failed)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
        toast.error('Erreur réseau');
        return;
      }
      
      // Erreur API avec details
      if (err?.errors) {
        setFieldErrors(err.errors);
        log('Field errors:', err.errors);
      }
      
      const errMsg = err?.message || (typeof err === 'string' ? err : 'Une erreur est survenue.');
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setSuccess('');
    setFieldErrors({});
    setDebugCode('');
    setRedirecting(false);
  };

  if (redirecting) {
    return (
      <div className="modal-overlay active" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content auth-modal-v2">
          <div className="auth-redirect-v2">
            <div className="success-checkmark">
              <Icon name="check" size={40} />
            </div>
            <h3>{intent?.intent === 'checkout' ? 'Compte prêt' : 'Connexion réussie'}</h3>
            <p>{intent?.intent === 'checkout' ? 'Redirection vers le paiement...' : 'Ouverture de votre espace...'}</p>
            <div className="redirect-progress">
              <div className="redirect-progress-bar" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay active" onClick={e => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal-content auth-modal-v2">
        <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>

        <div className="auth-visual-side">
          <div className="auth-brand-logo">
            <img
              src="/images/logo/logo.png"
              alt="Mercury"
              width="44"
              height="44"
              style={{ width: '44px', height: '44px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = 'M'; }}
            />
          </div>
          <h2>{mode === 'login' ? 'Bienvenue' : mode === 'register' ? 'Rejoignez-nous' : mode === 'forgot' ? 'Mot de passe oublié ?' : 'Réinitialisez'}</h2>
          <p>{mode === 'login' ? 'Connectez-vous à votre espace' : mode === 'register' ? 'Créez votre compte Mercury' : mode === 'forgot' ? 'Nous vous enverrons un code' : 'Entrez votre nouveau mot de passe'}</p>
        </div>

        <div className="auth-form-side">
          {intent?.intent === 'checkout' && (
            <div className="auth-alert" style={{marginBottom: '1.25rem', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e', border: '1px solid #fcd34d'}}>
              <Icon name="cart" size={16} /> {mode === 'register' ? 'Créez votre compte pour effectuer votre achat' : 'Connectez-vous pour finaliser votre commande'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-v2">
            {mode === 'register' && (
              <div className="auth-input-group">
                <label><Icon name="user" size={12} /> Nom complet</label>
                <div className="auth-input-wrapper">
                  <Icon name="user" size={16} className="input-icon" />
                  <input type="text" placeholder="Ex: Konaté Ibrahim" value={form.name}
                    onChange={e => set('name', e.target.value)} className={fieldErrors.name ? 'error' : ''} />
                </div>
                {fieldErrors.name && <div className="auth-field-error"><Icon name="warning" size={12} /> {fieldErrors.name[0]}</div>}
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div className="auth-input-group">
                <label><Icon name="mail" size={12} /> Adresse email</label>
                <div className="auth-input-wrapper">
                  <Icon name="mail" size={16} className="input-icon" />
                  <input type="email" placeholder="votre@email.com" value={form.email}
                    onChange={e => set('email', e.target.value)} className={fieldErrors.email ? 'error' : ''} />
                </div>
                {fieldErrors.email && <div className="auth-field-error"><Icon name="warning" size={12} /> {fieldErrors.email[0]}</div>}
              </div>
            )}

            {mode === 'register' && (
              <div className="auth-input-group">
                <label><Icon name="smartphone" size={12} /> Téléphone</label>
                <div className="auth-input-wrapper">
                  <Icon name="smartphone" size={16} className="input-icon" />
                  <input type="tel" placeholder="07 12 34 56" maxLength="12" value={form.phone}
                    onChange={e => set('phone', e.target.value)} className={fieldErrors.phone ? 'error' : ''} />
                </div>
                <div className="auth-input-hint">Format burkinabè (8 chiffres)</div>
                {fieldErrors.phone && <div className="auth-field-error"><Icon name="warning" size={12} /> {fieldErrors.phone[0]}</div>}
              </div>
            )}

            {(mode === 'login' || mode === 'register') && (
              <div className="auth-input-group">
                <label><Icon name="lock" size={12} /> Mot de passe</label>
                <div className="auth-input-wrapper">
                  <Icon name="lock" size={16} className="input-icon" />
                  <input type="password" placeholder="••••••••" value={form.password}
                    onChange={e => set('password', e.target.value)} className={fieldErrors.password ? 'error' : ''} />
                </div>
                {mode === 'register' && <div className="auth-input-hint">Minimum 6 caractères</div>}
                {fieldErrors.password && <div className="auth-field-error"><Icon name="warning" size={12} /> {fieldErrors.password[0]}</div>}
              </div>
            )}

            {mode === 'register' && (
              <div className="auth-input-group">
                <label><Icon name="lock" size={12} /> Confirmation</label>
                <div className="auth-input-wrapper">
                  <Icon name="lock" size={16} className="input-icon" />
                  <input type="password" placeholder="••••••••" value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)} className={fieldErrors.confirmPassword ? 'error' : ''} />
                </div>
                {fieldErrors.confirmPassword && <div className="auth-field-error"><Icon name="warning" size={12} /> {fieldErrors.confirmPassword[0]}</div>}
              </div>
            )}

            {mode === 'reset' && (
              <>
                {success && <div className="auth-alert success"><Icon name="check" size={16} /> {success}</div>}
                {debugCode && <div className="auth-alert" style={{background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd'}}>Code dev: <strong>{debugCode}</strong></div>}
                <div className="auth-input-group">
                  <label><Icon name="lock" size={12} /> Code à 6 chiffres</label>
                  <div className="auth-input-wrapper">
                    <Icon name="lock" size={16} className="input-icon" />
                    <input type="text" placeholder="123456" maxLength="6" inputMode="numeric" value={form.code}
                      onChange={e => set('code', e.target.value.replace(/\D/g, ''))} className={fieldErrors.code ? 'error' : ''} />
                  </div>
                  {fieldErrors.code && <div className="auth-field-error"><Icon name="warning" size={12} /> {fieldErrors.code[0]}</div>}
                </div>
                <div className="auth-input-group">
                  <label><Icon name="lock" size={12} /> Nouveau mot de passe</label>
                  <div className="auth-input-wrapper">
                    <Icon name="lock" size={16} className="input-icon" />
                    <input type="password" placeholder="••••••••" value={form.newPassword}
                      onChange={e => set('newPassword', e.target.value)} className={fieldErrors.password ? 'error' : ''} />
                  </div>
                  <div className="auth-input-hint">Minimum 6 caractères</div>
                  {fieldErrors.password && <div className="auth-field-error"><Icon name="warning" size={12} /> {fieldErrors.password[0]}</div>}
                </div>
              </>
            )}

            {error && <div className="auth-alert error"><Icon name="warning" size={16} /> {error}</div>}

            <button type="submit" className="auth-btn-submit" disabled={submitting}>
              {submitting ? <span className="btn-loader"></span> : (
                <>
                  {mode === 'login' ? 'Se connecter' : mode === 'register' ? 'Créer mon compte' : mode === 'forgot' ? 'Envoyer le code' : 'Réinitialiser'}
                  <Icon name="arrowRight" size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            {mode === 'login' && (
              <>
                <p><button type="button" className="auth-footer-link" onClick={() => switchMode('forgot')}>Mot de passe oublié ?</button></p>
                <p>Pas de compte ? <button type="button" className="auth-footer-link" onClick={() => switchMode('register')}>Créer un compte</button></p>
              </>
            )}
            {mode === 'register' && (
              <p>Déjà inscrit ? <button type="button" className="auth-footer-link" onClick={() => switchMode('login')}>Se connecter</button></p>
            )}
            {(mode === 'forgot' || mode === 'reset') && (
              <p><button type="button" className="auth-footer-link" onClick={() => switchMode('login')}>← Retour à la connexion</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
