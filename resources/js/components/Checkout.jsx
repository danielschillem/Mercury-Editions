import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from './Icons';

const OM_CONFIG = {
  paymentEndpoint: '/api/payments/mobile',
  production: { ussd_prefix: '*144*4*6*', ussd_suffix: '#' },
  sandbox: { ussd_prefix: '*865*4*6*', ussd_suffix: '#' },
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
  const [gateway, setGateway] = useState({ provider: 'MynaPay', environment: 'sandbox', simulation: false, operators: [{ id: 'orange', name: 'Orange Money', flow: 'otp' }, { id: 'moov', name: 'Moov Money', flow: 'push' }], status_check: true });
  const [selectedOperator, setSelectedOperator] = useState('orange');
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

  useEffect(() => {
    fetch('/api/payments/config', { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((config) => { if (config) setGateway(config); })
      .catch(() => {});
  }, []);

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
    if (selectedOperator === 'moov') {
      processPayment('moov');
      return;
    }
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

  const processPayment = useCallback(async (operatorOverride = null) => {
    const operator = typeof operatorOverride === 'string' ? operatorOverride : selectedOperator;
    if (operator === 'orange' && !/^\d{6}$/.test(otpValue)) {
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

    addLog('Initialisation sécurisée du paiement Mercury...');
    await delay(600);
    addLog(`Passerelle ${gateway.provider} · environnement ${gateway.simulation ? 'simulation locale' : gateway.environment}`, 'ok');
    await delay(500);
    addLog(`Préparation de la collecte ${operator === 'moov' ? 'Moov Money' : 'Orange Money'}...`);
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
      addLog(`Clé d’idempotence: ${extTxnId}`);
      await delay(400);
      addLog('Transmission de la collecte à l’API MynaPay...', 'warn');
      await delay(1200);
      addLog(operator === 'moov' ? 'MynaPay envoie la demande de confirmation sur votre téléphone Moov...' : 'MynaPay transmet l’OTP au rail Orange Money...');
      await delay(800);

      // 2) Lancer la collecte mobile money sélectionnée
      addLog('Envoi sécurisé vers le backend de paiement...', 'warn');
      await delay(500);

      const response = await fetch(OM_CONFIG.paymentEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, amount: total, operator, ...(operator === 'orange' ? { otp: otpValue } : {}), refNumber, extTxnId }),
      });

      let data = await response.json();

      // MynaPay peut accepter la collecte avant d'obtenir la confirmation
      // opérateur. La commande reste pending tant que le statut n'est pas final.
      if (response.ok && data.status === 'pending' && data.collectionId) {
        addLog('Paiement reçu par MynaPay, confirmation opérateur en attente...', 'warn');
        for (let attempt = 0; attempt < 8 && data.status === 'pending'; attempt++) {
          await delay(2000);
          const checkResponse = await fetch(
            `${OM_CONFIG.paymentEndpoint}/${encodeURIComponent(data.collectionId)}/check`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ refNumber, extTxnId }),
            },
          );
          data = await checkResponse.json().catch(() => ({
            status: 'error', errorCode: String(checkResponse.status), message: 'Vérification du paiement impossible.',
          }));
          if (!checkResponse.ok && data.status !== 'pending') break;
        }
      }

      if (data.status === 'pending') {
        addLog('Confirmation toujours en attente. La commande reste ouverte.', 'warn');
        setResult({
          type: 'partial',
          data: {
            amount: Number(data.amount || total), phone: data.phone || phone, operator, refNumber, extTxnId,
            date: new Date().toLocaleString('fr-FR'),
            message: 'Paiement en cours de confirmation chez l’opérateur. Ne recommencez pas la transaction ; contactez le support avec la référence de commande.',
          },
        });
        return;
      }

      if (!response.ok || data.status !== 'success') {
        const errCode = data?.errorCode || String(response.status || '90001');
        addLog(`Erreur ${errCode}: ${data?.message || 'Echec'}`, 'warn');
        await markOrderFailed(data?.message || `Paiement ${operator === 'moov' ? 'Moov Money' : 'Orange Money'} refusé.`);
        await delay(300);
        setResult({ type: 'error', data: { errorCode: errCode, message: data?.message || OM_ERRORS[errCode] || 'Erreur inconnue.' } });
        return;
      }

      addLog(`Collecte confirmée par MynaPay et ${operator === 'moov' ? 'Moov Money' : 'Orange Money'}.`, 'ok');
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
        // Le paiement mobile money a réussi mais la confirmation en DB a échoué
        addLog('ATTENTION: Paiement effectué mais confirmation non enregistrée!', 'warn');
        setResult({
          type: 'partial',
          data: {
            transId: data.transId,
            amount: Number(data.amount || total),
            phone: data.phone || phone,
            operator,
            refNumber,
            extTxnId,
            date: new Date().toLocaleString('fr-FR'),
            message: `Votre paiement ${operator === 'moov' ? 'Moov Money' : 'Orange Money'} a été effectué, mais nous n’avons pas pu confirmer la commande. Veuillez contacter le support avec votre numéro de transaction.`
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
        data: { transId: data.transId, amount: Number(data.amount || total), phone: data.phone || phone, operator, refNumber, extTxnId, date: new Date().toLocaleString('fr-FR') }
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
  }, [otpValue, phone, total, cart, addPurchase, name, email, toast, hasPhysical, shipping, gateway, selectedOperator]);

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

  const gatewayEnvironment = gateway.environment === 'production' ? 'production' : 'sandbox';
  const env = OM_CONFIG[gatewayEnvironment];
  const m = String(Math.floor(otpSeconds / 60)).padStart(2, '0');
  const s = String(otpSeconds % 60).padStart(2, '0');
  const stepGuidance = {
    1: {
      eyebrow: 'Etape 1',
      title: 'Confirmez vos informations de paiement',
      description: 'Mercury prépare votre commande avant de transmettre la collecte mobile money à la passerelle MynaPay.',
    },
    2: {
      eyebrow: 'Etape 2',
      title: 'Générez votre code OTP',
      description: 'Générez votre OTP Orange par USSD. Il sera envoyé uniquement au backend Mercury, puis à MynaPay.',
    },
    3: {
      eyebrow: 'Etape 3',
      title: 'Validez votre paiement',
      description: 'L’OTP, le montant et la référence unique servent à créer une collecte MynaPay idempotente.',
    },
    4: {
      eyebrow: 'Etape 4',
      title: 'Traitement en cours',
      description: 'Mercury interroge MynaPay jusqu’au statut final avant de confirmer la commande et la bibliothèque.',
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
        <span>Frais de paiement mobile (1%)</span><span>{fees.toLocaleString()} F</span>
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
            <p>Collecte MynaPay confirmée via {txn.operator === 'moov' ? 'Moov Money' : 'Orange Money'}</p>
            <p style={{ color: 'var(--success)', fontWeight: 600 }}>{gateway.simulation ? 'Simulation locale MynaPay terminée avec succès.' : 'La confirmation opérateur a été enregistrée par Mercury.'}</p>
            <div className="txn-details-card">
              {[['ID Transaction', txn.transId], ['Montant', `${txn.amount.toLocaleString()} FCFA`], ['Numéro', txn.phone], ['Passerelle', gateway.provider], ['Opérateur', txn.operator === 'moov' ? 'Moov Money' : 'Orange Money'], ['Date', txn.date]].map(([l, v]) => (
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

  const checkoutStepLabels = selectedOperator === 'moov'
    ? ['Coordonnées', 'Push Moov', 'Confirmation', 'Validation']
    : ['Coordonnées', 'Générer OTP', 'Confirmer', 'Validation'];
  const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className="checkout-overlay open mynapay-checkout-overlay">
      <div className="checkout-modal mynapay-checkout">
        <header className="mynapay-header">
          <div className="mynapay-brandmark">M</div>
          <div className="mynapay-title"><span>Paiement orchestré par</span><strong>MynaPay</strong></div>
          <div className={`mynapay-environment${gateway.simulation ? ' simulation' : ''}`}><i />{gateway.simulation ? 'Simulation locale' : gateway.environment}</div>
          <button type="button" className="mynapay-close" onClick={handleClose} aria-label="Fermer"><Icon name="close" size={18} /></button>
        </header>

        <nav className="mynapay-progress" aria-label="Étapes du paiement">
          {checkoutStepLabels.map((label, index) => {
            const number = index + 1;
            return <div key={label} className={`mynapay-progress-step${number === step ? ' active' : number < step ? ' done' : ''}`}><span>{number < step ? <Icon name="check" size={12} /> : number}</span><small>{label}</small></div>;
          })}
        </nav>

        <div className="mynapay-layout">
          <main className="mynapay-main">
            <div className="mynapay-step-heading"><span>{stepGuidance[step]?.eyebrow}</span><h2>{stepGuidance[step]?.title}</h2><p>{step === 1 ? `Choisissez Orange Money par OTP ou Moov Money par confirmation push. La collecte sera orchestrée par ${gateway.provider}.` : stepGuidance[step]?.description}</p></div>

            {step === 1 && <div className="mynapay-step-content">
              <div className="mynapay-operator-picker" role="radiogroup" aria-label="Choisir un opérateur mobile money">
                <button type="button" className={`mynapay-operator orange${selectedOperator === 'orange' ? ' selected' : ''}`} onClick={() => setSelectedOperator('orange')}><span className="mynapay-operator-logo"><img src="/images/images.png" alt="Logo Orange Money" /></span><div><small>Paiement par OTP</small><strong>Orange Money</strong><em>Code USSD puis OTP à 6 chiffres</em></div>{selectedOperator === 'orange' && <Icon name="check" size={17} />}</button>
                <button type="button" className={`mynapay-operator moov${selectedOperator === 'moov' ? ' selected' : ''}`} onClick={() => setSelectedOperator('moov')}><span className="mynapay-operator-logo"><img src="/images/moov%20money.png" alt="Logo Moov Money Burkina Faso" /></span><div><small>Paiement push</small><strong>Moov Money</strong><em>Confirmation avec votre PIN sur le téléphone</em></div>{selectedOperator === 'moov' && <Icon name="check" size={17} />}</button>
              </div>
              <div className="mynapay-fields-grid">
                <div className="form-group full"><label><Icon name="smartphone" size={14} /> Numéro {selectedOperator === 'moov' ? 'Moov Money' : 'Orange Money'}</label><input type="tel" placeholder="Ex : 70 12 34 56" maxLength="12" value={phone} onChange={e => { setPhone(e.target.value); setPhoneError(''); }} className={phoneError ? 'error' : ''} /><div className="form-hint">Numéro burkinabè à 8 chiffres</div>{phoneError && <div className="form-error visible">{phoneError}</div>}</div>
                <div className="form-group"><label><Icon name="user" size={14} /> Nom complet</label><input type="text" value={name} onChange={e => setName(e.target.value)} /></div>
                <div className="form-group"><label><Icon name="mail" size={14} /> Email du reçu</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              </div>
              {hasPhysical && <div className="mynapay-shipping"><h3><Icon name="mapPin" size={16} /> Livraison des livres papier</h3><div className="mynapay-fields-grid"><div className="form-group"><label>Adresse</label><input value={shipping.address} onChange={e => setShipping(p => ({ ...p, address: e.target.value }))} /></div><div className="form-group"><label>Ville</label><input value={shipping.city} onChange={e => setShipping(p => ({ ...p, city: e.target.value }))} /></div><div className="form-group full"><label>Instructions</label><textarea rows="2" value={shipping.notes} onChange={e => setShipping(p => ({ ...p, notes: e.target.value }))} /></div></div></div>}
              <button className={`mynapay-primary ${selectedOperator}`} onClick={goToStep2}>{selectedOperator === 'moov' ? 'Envoyer la demande sur mon téléphone' : 'Continuer vers l’OTP'} <Icon name="arrowRight" size={16} /></button>
            </div>}

            {step === 2 && <div className="mynapay-step-content"><button className="mynapay-back" onClick={() => goToStep(1)}><Icon name="arrowLeft" size={14} /> Modifier les coordonnées</button><div className="mynapay-ussd-card"><div className="mynapay-phone-visual"><span>*</span><Icon name="smartphone" size={34} /></div><span className="mynapay-overline">Depuis le téléphone associé au {phone}</span><h3>Composez le code Orange</h3><button type="button" className="mynapay-ussd-code" onClick={() => navigator.clipboard?.writeText(`${env.ussd_prefix}${total}${env.ussd_suffix}`)}>{env.ussd_prefix}{total}{env.ussd_suffix}<small>Cliquer pour copier</small></button><ol><li>Composez le code puis validez l’appel USSD.</li><li>Saisissez votre code PIN Orange Money.</li><li>Conservez l’OTP à 6 chiffres reçu par SMS.</li></ol><div className="mynapay-security-note"><Icon name="shield" size={16} /> Votre PIN Orange Money n’est jamais saisi sur Mercury.</div></div><button className="mynapay-primary" onClick={() => goToStep(3)}>J’ai mon code OTP <Icon name="arrowRight" size={16} /></button></div>}

            {step === 3 && <div className="mynapay-step-content"><button className="mynapay-back" onClick={() => goToStep(2)}><Icon name="arrowLeft" size={14} /> Revoir le code USSD</button><div className="mynapay-otp-card"><div className="mynapay-lock"><Icon name="lock" size={24} /></div><span className="mynapay-overline">Autorisation Orange Money</span><h3>Saisissez votre OTP</h3><p>Une seule tentative métier sera envoyée à MynaPay avec la référence de votre commande.</p><div className="otp-input-group">{otp.map((digit, index) => <input key={index} ref={element => otpRefs.current[index] = element} type="text" className={`otp-digit${digit ? ' filled' : ''}`} maxLength="1" inputMode="numeric" value={digit} onChange={event => handleOtpChange(index, event.target.value)} onKeyDown={event => handleOtpKeyDown(index, event)} />)}</div>{otpError && <div className="form-error visible">{otpError}</div>}<div className="mynapay-otp-time"><Icon name="clock" size={14} /> Expire dans <strong>{otpSeconds > 0 ? `${m}:${s}` : 'Expiré'}</strong></div></div><button className="mynapay-primary" onClick={() => processPayment()} disabled={!otpComplete}>Payer {total.toLocaleString('fr-FR')} FCFA <Icon name="arrowRight" size={16} /></button></div>}

            {step === 4 && !result && <div className="mynapay-step-content"><div className="mynapay-processing"><div className="processing-anim"><div className="processing-ring" /><div className="processing-icon"><Icon name="shield" size={32} /></div></div><span className="mynapay-overline">Collecte en cours</span><h3>MynaPay vérifie la transaction</h3><p>La commande reste en attente tant que l’opérateur n’a pas confirmé le paiement.</p><div className="processing-log">{logs.map((line, index) => <div key={index} className="log-line">{line.type === 'ok' ? <span className="log-ok"><Icon name="check" size={12} /></span> : line.type === 'warn' ? <span className="log-warn"><Icon name="warning" size={12} /></span> : <Icon name="arrowRight" size={12} />} {line.text}</div>)}</div></div></div>}
          </main>

          <aside className="mynapay-summary">
            <div className="mynapay-customer"><div>{user.name?.charAt(0)?.toUpperCase()}</div><span><small>Compte Mercury</small><strong>{user.name}</strong><em>{user.email}</em></span></div>
            <div className="mynapay-summary-title"><span>Votre commande</span><small>{itemCount} article{itemCount > 1 ? 's' : ''}</small></div>
            <div className="mynapay-items">{cart.map(item => <div className="mynapay-item" key={`${item.id}-${item.format}`}><div>{item.cover_image ? <img src={item.cover_image} alt="" /> : <span>{item.title.charAt(0)}</span>}</div><section><strong>{item.title}</strong><small>{item.format === 'physical' ? 'Livre papier' : 'Ebook'} · ×{item.quantity || 1}</small></section><b>{(item.finalPrice * (item.quantity || 1)).toLocaleString('fr-FR')} F</b></div>)}</div>
            <div className="mynapay-totals"><div><span>Sous-total</span><b>{cartTotal.toLocaleString('fr-FR')} F</b></div><div><span>Frais mobile money</span><b>{fees.toLocaleString('fr-FR')} F</b></div><div className="total"><span>Total</span><b>{total.toLocaleString('fr-FR')} <small>FCFA</small></b></div></div>
            <div className="mynapay-route"><div><span>Mercury</span><Icon name="arrowRight" size={12} /><span>MynaPay</span><Icon name="arrowRight" size={12} /><span>{selectedOperator === 'moov' ? 'Moov' : 'Orange'}</span></div><p><Icon name="shield" size={13} /> API backend, idempotence et contrôle du statut</p></div>
            <button className="mynapay-cancel" onClick={handleClose}>Annuler le paiement</button>
          </aside>
        </div>
      </div>
    </div>
  );
}
