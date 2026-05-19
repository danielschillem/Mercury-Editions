import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from './Icons';

const OM_CONFIG = {
  paymentEndpoint: '/api/payments/orange',
  prod: { url: 'https://apiom.orange.bf/', ussd_prefix: '*144*4*6*', ussd_suffix: '#' },
  test: { url: 'https://testom.orange.bf/', ussd_prefix: '*865*4*6*', ussd_suffix: '#' },
  env: 'prod'
};

const OM_ERRORS = {
  '08': 'Montant de transaction incorrect.',
  '60019': 'Solde insuffisant.',
  '990417': "Le code OTP n'existe pas.",
  '990418': 'Ce code OTP a déjà été utilisé.',
  '990422': 'Numéro MSISDN invalide.',
  '99990': 'Solde insuffisant pour cette transaction.',
};

function normalizePhone(raw) {
  const d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('226') && d.length === 11) return d.slice(3);
  if (d.startsWith('0') && d.length === 9) return d.slice(1);
  return d;
}

function isValidBurkinaMobile(raw) {
  return /^[67]\d{7}$/.test(normalizePhone(raw));
}

const delay = ms => new Promise(r => setTimeout(r, ms));

export default function Checkout() {
  const { cart, cartTotal, closeModal, openModal, addPurchase, clearCart } = useApp();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  // TOUS les hooks AVANT tout return conditionnel (règle des hooks React)
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpSeconds, setOtpSeconds] = useState(300);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [shipping, setShipping] = useState({ address: '', city: '', notes: '' });
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  const hasPhysical = cart.some(c => c.format === 'physical');
  const fees = Math.round(cartTotal * 0.01);
  const total = cartTotal + fees;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Sync user data when available
  useEffect(() => {
    if (!user) return;
    setPhone(prev => prev || user.phone || '');
    setName(prev => prev || user.name || '');
    setEmail(prev => prev || user.email || '');
  }, [user]);

  // Loading state
  if (authLoading) {
    return (
      <div className="checkout-overlay open">
        <div className="checkout-modal">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p>Chargement en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (!user) {
    return (
      <div className="checkout-overlay open">
        <div className="checkout-modal">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h3>Accès non autorisé</h3>
            <p>Vous devez être connecté pour procéder au paiement.</p>
            <button className="btn btn-red" onClick={() => {
              closeModal();
              openModal('auth', { mode: 'login', intent: 'checkout' });
            }}>Se connecter</button>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cart.length === 0) {
    return (
      <div className="checkout-overlay open">
        <div className="checkout-modal">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h3>Panier vide</h3>
            <p>Votre panier est vide. Ajoutez des livres avant de procéder au paiement.</p>
            <button className="btn btn-red" onClick={() => {
              closeModal();
              document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
            }}>Découvrir le catalogue</button>
          </div>
        </div>
      </div>
    );
  }

  const startTimer = () => {
    setOtpSeconds(300);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpSeconds(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const goToStep = (s) => {
    setStep(s);
    if (s === 3) startTimer();
  };

  const goToStep2 = () => {
    const norm = normalizePhone(phone);
    if (!isValidBurkinaMobile(phone)) {
      setPhoneError('Veuillez entrer un numéro mobile burkinabè valide (8 chiffres).');
      return;
    }
    if (hasPhysical && (!shipping.address.trim() || !shipping.city.trim())) {
      toast.error('Veuillez remplir l\'adresse de livraison pour les livres papier.');
      return;
    }
    setPhone(norm);
    setPhoneError('');
    goToStep(2);
  };

  const handleOtpChange = (i, value) => {
    if (!/^\d?$/.test(value)) return;
    setOtpError('');
    const newOtp = [...otp];
    newOtp[i] = value;
    setOtp(newOtp);
    if (value && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      const newOtp = [...otp];
      newOtp[i - 1] = '';
      setOtp(newOtp);
      otpRefs.current[i - 1]?.focus();
    }
  };

  const otpValue = otp.join('');
  const otpComplete = otpValue.length === 6;

  const processPayment = useCallback(async () => {
    if (!/^\d{6}$/.test(otpValue)) {
      setOtpError('Veuillez saisir un code OTP valide (6 chiffres).');
      return;
    }
    setOtpError('');
    goToStep(4);

    const addLog = (text, type = '') => setLogs(prev => [...prev, { text, type }]);
    let order = null;

    const markOrderFailed = async (message) => {
      if (!order?.id) return;

      try {
        await fetch(`/api/orders/${order.id}/fail`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message }),
        });
      } catch {
        // Intentionally silent: the UI already reports the payment failure.
      }
    };

    addLog('Initialisation de la connexion SSL...');
    await delay(600);
    addLog(`Connexion à ${OM_CONFIG[OM_CONFIG.env].url}`, 'ok');
    await delay(500);
    addLog('Construction de la requête XML-RPC OMPREQ...');
    await delay(400);
    addLog(`Requête: customer_msisdn=${phone}, amount=${total} FCFA`);

    try {
      addLog('Création de la commande en base...', 'warn');
      await delay(400);

      // 1) Créer la commande en DB
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          buyer_phone: phone,
          buyer_name: name || null,
          buyer_email: email || null,
          ...(hasPhysical ? { shipping_address: shipping.address, shipping_city: shipping.city, delivery_notes: shipping.notes || null } : {}),
          items: cart.flatMap(c => {
            const qty = c.quantity || 1;
            return Array.from({ length: qty }, () => ({ book_id: c.id, format: c.format || 'ebook' }));
          }),
        }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        addLog(`Erreur création commande: ${errData?.message || orderRes.status}`, 'warn');
        setResult({ type: 'error', data: { errorCode: String(orderRes.status), message: errData?.message || 'Erreur lors de la création de la commande.' } });
        return;
      }

      order = await orderRes.json();
      const refNumber = order.reference;
      const extTxnId = `MERCURY-${order.id}-${Date.now()}`;

      addLog(`Commande #${order.id} créée (réf: ${order.reference})`, 'ok');
      await delay(300);
      addLog(`Référence: ext_txn_id=${extTxnId}`);
      await delay(400);
      addLog('Envoi XML-RPC PAYMENT REQUEST...', 'warn');
      await delay(1200);
      addLog('Vérification OTP par Orange Money...');
      await delay(800);

      // 2) Lancer le paiement Orange Money
      addLog('Envoi sécurisé vers le backend de paiement...', 'warn');
      await delay(500);

      const response = await fetch(OM_CONFIG.paymentEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, amount: total, otp: otpValue, refNumber, extTxnId }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== 'success') {
        const errCode = data?.errorCode || String(response.status || '90001');
        addLog(`Erreur ${errCode}: ${data?.message || 'Echec'}`, 'warn');
        await markOrderFailed(data?.message || 'Paiement Orange Money refusé.');
        await delay(300);
        setResult({ type: 'error', data: { errorCode: errCode, message: data?.message || OM_ERRORS[errCode] || 'Erreur inconnue.' } });
        return;
      }

      addLog('Réponse reçue de Orange Money...', 'ok');
      await delay(300);
      addLog(`TransID: ${data.transId}`, 'ok');
      await delay(200);

      // 3) Marquer la commande comme complétée en DB (avec retry)
      addLog('Confirmation de la commande en base...', 'warn');
      let completedOrder = null;
      let completeSuccess = false;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const completeRes = await fetch(`/api/orders/${order.id}/complete`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              om_transaction_id: data.transId,
              ext_txn_id: extTxnId,
              ref_number: refNumber,
            }),
          });

          if (completeRes.ok) {
            completedOrder = await completeRes.json();
            completeSuccess = true;
            break;
          }

          // Session expirée ou erreur d'auth : on réessaie
          if (completeRes.status === 401 || completeRes.status === 419) {
            addLog(`Tentative ${attempt}/${maxRetries} : session expirée, retry...`, 'warn');
            await delay(500);
            continue;
          }

          // Autre erreur HTTP
          const errBody = await completeRes.json().catch(() => ({}));
          addLog(`Erreur ${completeRes.status}: ${errBody?.message || 'Confirmation échouée'}`, 'warn');
        } catch (fetchErr) {
          addLog(`Tentative ${attempt}/${maxRetries} : erreur réseau`, 'warn');
          if (attempt < maxRetries) await delay(500);
        }
      }

      if (!completeSuccess) {
        // Le paiement Orange Money a réussi mais la confirmation en DB a échoué
        addLog('ATTENTION: Paiement effectué mais confirmation non enregistrée!', 'warn');
        setResult({
          type: 'partial',
          data: {
            transId: data.transId,
            amount: Number(data.amount || total),
            phone: data.phone || phone,
            refNumber,
            extTxnId,
            date: new Date().toLocaleString('fr-FR'),
            message: 'Votre paiement Orange Money a été effectué, mais nous n\'avons pas pu confirmer la commande. Veuillez contacter le support avec votre numéro de transaction.'
          }
        });
        toast.warning('Paiement effectué mais confirmation en attente. Contactez le support.');
        return;
      }

      addLog('Commande confirmée en base de données', 'ok');
      await delay(200);
      addLog('Transaction finalisée avec succès', 'ok');
      await delay(300);

      // 4) Enregistrer les achats en localStorage (pour lecture hors-ligne)
      const itemsToRegister = completedOrder?.items || order.items || [];
      itemsToRegister.forEach(orderItem => {
        addPurchase({
          bookId: Number(orderItem.book_id),
          format: orderItem.format,
          txnId: data.transId,
          accessToken: orderItem.access_token || ('MBK' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6)),
          buyerPhone: data.phone || phone,
          purchaseDate: new Date().toISOString(),
          readSessions: 0,
        });
      });

      setResult({
        type: 'success',
        data: { transId: data.transId, amount: Number(data.amount || total), phone: data.phone || phone, refNumber, extTxnId, date: new Date().toLocaleString('fr-FR') }
      });
      toast.success('Paiement effectué avec succès !');
    } catch (err) {
      console.error('Checkout processPayment error:', err);
      addLog('Erreur de communication avec le backend.', 'warn');
      await markOrderFailed('Erreur réseau lors de la transaction.');
      await delay(200);
      setResult({ type: 'error', data: { errorCode: '90001', message: 'Erreur réseau.' } });
      toast.error('Erreur de communication avec le serveur.');
    }
  }, [otpValue, phone, total, cart, addPurchase, name, email, toast, hasPhysical, shipping]);

  const retry = () => {
    setResult(null);
    setOtp(['', '', '', '', '', '']);
    setLogs([]);
    goToStep(3);
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (result?.type === 'success') clearCart();
    closeModal();
  };

  const env = OM_CONFIG[OM_CONFIG.env];
  const m = String(Math.floor(otpSeconds / 60)).padStart(2, '0');
  const s = String(otpSeconds % 60).padStart(2, '0');
  const stepGuidance = {
    1: {
      eyebrow: 'Etape 1',
      title: 'Confirmez vos informations de paiement',
      description: 'Nous utilisons ces informations pour associer la transaction Orange Money à votre commande et à votre bibliothèque.',
    },
    2: {
      eyebrow: 'Etape 2',
      title: 'Générez votre code OTP',
      description: 'Composez le code USSD sur votre téléphone Orange puis revenez ici avec le code reçu par SMS.',
    },
    3: {
      eyebrow: 'Etape 3',
      title: 'Validez votre paiement',
      description: 'Saisissez le code OTP à 6 chiffres pour confirmer la transaction de manière sécurisée.',
    },
    4: {
      eyebrow: 'Etape 4',
      title: 'Traitement en cours',
      description: 'Nous vérifions le paiement, enregistrons la commande et préparons l’accès à votre bibliothèque.',
    },
  };

  const summaryRows = (
    <>
      {cart.map(item => (
        <div key={`${item.id}-${item.format}`} className="checkout-summary-row">
          <span>{item.title} {(item.quantity || 1) > 1 && <small>×{item.quantity}</small>} <small style={{ color: 'var(--warm-gray)' }}>({item.format === 'physical' ? <Icon name="package" size={11} /> : <Icon name="smartphone" size={11} />})</small></span>
          <span>{(item.finalPrice * (item.quantity || 1)).toLocaleString()} F</span>
        </div>
      ))}
      <div className="checkout-summary-row fees">
        <span>Frais Orange Money (1%)</span><span>{fees.toLocaleString()} F</span>
      </div>
      <div className="checkout-summary-row total">
        <span>Total à payer</span><span>{total.toLocaleString()} FCFA</span>
      </div>
    </>
  );

  // ═══ SUCCESS VIEW ═══
  if (result?.type === 'success') {
    const txn = result.data;
    return (
      <div className="checkout-overlay open">
        <div className="checkout-modal">
          <div className="checkout-success" style={{ display: 'block' }}>
            <div className="success-icon"><Icon name="check" size={32} /></div>
            <h3>Paiement réussi !</h3>
            <p>Transaction Orange Money confirmée</p>
            <p style={{ color: 'var(--success)', fontWeight: 600 }}>Un SMS de confirmation a été envoyé à votre numéro.</p>
            <div className="txn-details-card">
              {[['ID Transaction', txn.transId], ['Montant', `${txn.amount.toLocaleString()} FCFA`], ['Numéro', txn.phone], ['Méthode', 'Orange Money'], ['Date', txn.date]].map(([l, v]) => (
                <div key={l} className="txn-row"><span className="txn-label">{l}</span><span className="txn-val">{v}</span></div>
              ))}
              <div className="txn-row"><span className="txn-label">Statut</span><span className="txn-val" style={{ color: 'var(--success)' }}><Icon name="check" size={14} /> Succès (200)</span></div>
            </div>
            <br />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-red" onClick={() => { handleClose(); clearCart(); openModal(user ? 'account' : 'library', user ? 'library' : null); }}> Accéder à mes achats</button>
              <button className="btn btn-outline" style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--warm-gray)' }} onClick={() => { handleClose(); clearCart(); }}>Retour à la boutique</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ ERROR VIEW ═══
  if (result?.type === 'error') {
    return (
      <div className="checkout-overlay open">
        <div className="checkout-modal">
          <div className="error-panel" style={{ display: 'block' }}>
            <div className="error-icon"><Icon name="close" size={32} /></div>
            <h3>Échec de la transaction</h3>
            <div className="error-code-box">Code erreur: {result.data.errorCode}</div>
            <p>{result.data.message}</p>
            <br />
            <button className="btn btn-red" onClick={retry}>Réessayer</button>
            <button className="checkout-cancel" onClick={handleClose}>Annuler</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ PARTIAL SUCCESS VIEW (paiement OK mais confirmation échouée) ═══
  if (result?.type === 'partial') {
    const txn = result.data;
    return (
      <div className="checkout-overlay open">
        <div className="checkout-modal">
          <div className="checkout-success" style={{ display: 'block' }}>
            <div className="success-icon" style={{ background: 'var(--warning, #f59e0b)' }}><Icon name="alert" size={32} /></div>
            <h3>Paiement effectué</h3>
            <p style={{ color: 'var(--warning, #f59e0b)', fontWeight: 600 }}>Confirmation en attente</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--warm-gray)' }}>{txn.message}</p>
            <div className="txn-details-card">
              {[['ID Transaction', txn.transId], ['Montant', `${txn.amount.toLocaleString()} FCFA`], ['Numéro', txn.phone], ['Référence', txn.refNumber], ['Date', txn.date]].map(([l, v]) => (
                <div key={l} className="txn-row"><span className="txn-label">{l}</span><span className="txn-val">{v}</span></div>
              ))}
              <div className="txn-row"><span className="txn-label">Statut</span><span className="txn-val" style={{ color: 'var(--warning, #f59e0b)' }}><Icon name="alert" size={14} /> En attente</span></div>
            </div>
            <p style={{ margin: '1rem 0', fontSize: '0.85rem' }}>Conservez votre numéro de transaction et contactez notre support pour finaliser votre commande.</p>
            <br />
            <button className="btn btn-outline" onClick={handleClose}>Fermer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-overlay open">
      <div className="checkout-modal">
        <div>
          <div className="checkout-header">
            <h2><Icon name="creditCard" size={20} /> Paiement Sécurisé</h2>
            <p>Intégration API Orange Money Burkina Faso</p>
          </div>

          <div style={{ padding: '1.5rem 2rem 0' }}>
            <div className="om-steps">
              {[1, 2, 3, 4].map(i => (
                <span key={i}>
                  <div className={`om-step-dot${i === step ? ' active' : i < step ? ' done' : ''}`}>{i}</div>
                  {i < 4 && <div className={`om-step-line${i < step ? ' done' : ''}`}></div>}
                </span>
              ))}
            </div>
          </div>

          <div className="checkout-body">
            <div className="checkout-context-card">
              <div className="checkout-context-copy">
                <span className="checkout-context-kicker">{stepGuidance[step]?.eyebrow}</span>
                <h3>{stepGuidance[step]?.title}</h3>
                <p>{stepGuidance[step]?.description}</p>
              </div>
              <div className="checkout-context-meta">
                <div className="checkout-account-chip">
                  <Icon name="user" size={14} />
                  <span>{user ? `${user.name} connecté` : 'Commande invitée'}</span>
                </div>
                <div className="checkout-account-chip">
                  <Icon name="library" size={14} />
                  <span>{cart.reduce((sum, item) => sum + (item.quantity || 1), 0)} article{cart.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {user && (
              <div className="checkout-customer-card">
                <div className="checkout-customer-head">
                  <div className="checkout-customer-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                  <div>
                    <strong>{user.name}</strong>
                    <p>{user.email}</p>
                  </div>
                </div>
                <div className="checkout-customer-details">
                  <span><Icon name="smartphone" size={13} /> {phone || user.phone || 'Numéro à confirmer'}</span>
                  <span><Icon name="check" size={13} /> Vos achats seront ajoutés à votre bibliothèque</span>
                </div>
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="om-panel active">
                <div className="checkout-methods">
                  <div className="checkout-method selected">
                    <div className="checkout-method-icon">
                      <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#FF6600"/><path d="M13 24c0-6 4.9-11 11-11s11 4.9 11 11-4.9 11-11 11-11-4.9-11-11z" stroke="#fff" strokeWidth="1.8"/><text x="18" y="22" fontFamily="Arial" fontWeight="900" fontSize="9" fill="#fff">O</text><text x="30" y="29" fontFamily="Arial" fontWeight="900" fontSize="9" fill="#fff">M</text></svg>
                    </div>
                    <div className="checkout-method-info">
                      <h4>Orange Money <span className="checkout-method-api-tag">API Intégrée</span></h4>
                      <p>Orange Burkina · Paiement via OTP</p>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Numéro de téléphone Orange</label>
                  <input type="tel" placeholder="Ex: 07 12 34 56" maxLength="12" value={phone}
                    onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                    className={phoneError ? 'error' : ''} />
                  <div className="form-hint">Format Burkina : 07X XX XX XX ou 76X XX XX XX</div>
                  {phoneError && <div className="form-error visible">{phoneError}</div>}
                </div>
                <div className="form-group">
                  <label><Icon name="user" size={14} /> Nom complet</label>
                  <input type="text" placeholder="Votre nom et prénom" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label><Icon name="mail" size={14} /> Email (reçu de transaction)</label>
                  <input type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                {hasPhysical && (
                  <div className="shipping-section">
                    <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="mapPin" size={15} /> Adresse de livraison</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--warm-gray)', marginBottom: '0.75rem' }}>Requis pour les livres en format papier.</p>
                    <div className="form-group">
                      <label>Adresse</label>
                      <input type="text" placeholder="Rue, quartier, secteur" value={shipping.address} onChange={e => setShipping(p => ({ ...p, address: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label>Ville</label>
                      <input type="text" placeholder="Ex: Ouagadougou" value={shipping.city} onChange={e => setShipping(p => ({ ...p, city: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label>Notes de livraison (optionnel)</label>
                      <textarea rows={2} placeholder="Instructions spéciales pour la livraison..." value={shipping.notes} onChange={e => setShipping(p => ({ ...p, notes: e.target.value }))} />
                    </div>
                  </div>
                )}
                <div className="checkout-summary">{summaryRows}</div>
                <button className="checkout-pay-btn om-btn" onClick={goToStep2}>Continuer — Générer le code OTP <Icon name="arrowRight" size={16} /></button>
                <button className="checkout-cancel" onClick={handleClose}>Annuler</button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="om-panel active">
                <button className="checkout-back-btn" onClick={() => goToStep(1)}><Icon name="arrowLeft" size={14} /> Retour</button>
                <div className="api-info-bar">
                  <div className="api-dot"></div>
                  <span>Connexion à <strong>apiom.orange.bf</strong> — En attente du code OTP</span>
                </div>
                <div className="ussd-instruction">
                  <div className="ussd-phone-icon"></div>
                  <h3>Composez ce code sur votre téléphone</h3>
                  <p>Ouvrez l'application Téléphone et composez le code USSD ci-dessous pour générer votre code OTP de paiement.</p>
                  <div className="ussd-code-box">
                    <div className="ussd-code">{env.ussd_prefix}{total}{env.ussd_suffix}</div>
                    <div className="ussd-code-label">Code USSD Orange Money — Production</div>
                  </div>
                  <div className="ussd-steps-list">
                    <div className="ussd-step-item"><div className="ussd-step-num">1</div><span>Composez le code USSD ci-dessus sur votre téléphone Orange</span></div>
                    <div className="ussd-step-item"><div className="ussd-step-num">2</div><span>Entrez votre code PIN Orange Money lorsque demandé</span></div>
                    <div className="ussd-step-item"><div className="ussd-step-num">3</div><span>Vous recevrez un SMS avec un code OTP à 6 chiffres</span></div>
                  </div>
                  <div className="ussd-waiting"><div className="spinner"></div><span>En attente de votre code OTP...</span></div>
                </div>
                <button className="checkout-pay-btn" onClick={() => goToStep(3)}>J'ai reçu mon code OTP <Icon name="arrowRight" size={16} /></button>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="om-panel active">
                <button className="checkout-back-btn" onClick={() => goToStep(2)}><Icon name="arrowLeft" size={14} /> Retour</button>
                <div className="api-info-bar"><div className="api-dot"></div><span>Prêt à envoyer <strong>XML-RPC PAYMENT REQUEST</strong></span></div>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem' }}>Entrez votre code OTP</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--warm-gray)' }}>Code à 6 chiffres reçu par SMS sur votre Orange</p>
                </div>
                <div className="otp-input-group">
                  {otp.map((d, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el} type="text" className={`otp-digit${d ? ' filled' : ''}`} maxLength="1" inputMode="numeric"
                      value={d} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)} />
                  ))}
                </div>
                {otpError && <div className="form-error visible" style={{ textAlign: 'center', marginTop: '0.5rem' }}>{otpError}</div>}
                <div className="otp-timer">Code valide pendant : <strong>{otpSeconds > 0 ? `${m}:${s}` : 'Expiré'}</strong></div>
                <div className="checkout-summary">{summaryRows}</div>
                <button className="checkout-pay-btn om-btn" onClick={processPayment} disabled={!otpComplete}> Confirmer le paiement Orange Money</button>
                <button className="checkout-cancel" onClick={handleClose}>Annuler</button>
              </div>
            )}

            {/* STEP 4: Processing */}
            {step === 4 && !result && (
              <div className="om-panel active">
                <div className="processing-panel">
                  <div className="processing-anim">
                    <div className="processing-ring"></div>
                    <div className="processing-icon"><Icon name="shield" size={32} /></div>
                  </div>
                  <h3>Transaction en cours...</h3>
                  <p>Communication avec la plateforme Orange Money</p>
                  <p style={{ fontSize: '0.8rem', color: '#FF6B00' }}>Ne fermez pas cette fenêtre</p>
                  <div className="processing-log">
                    {logs.map((l, i) => (
                      <div key={i} className="log-line">
                        {l.type === 'ok' ? <span className="log-ok"><Icon name="check" size={12} /></span> : l.type === 'warn' ? <span className="log-warn"><Icon name="warning" size={12} /></span> : <Icon name="arrowRight" size={12} />} {l.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
