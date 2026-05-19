import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Icon from './Icons';

export default function CartPanel() {
  const { user } = useAuth();
  const { cart, removeFromCart, updateQuantity, closeModal, openModal, cartTotal, cartCount, clearCart } = useApp();

  const openAuthForCheckout = (mode) => {
    openModal('auth', { intent: 'checkout', mode });
  };

  const continueShopping = () => {
    closeModal();
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCheckout = () => {
    if (!user) {
      openAuthForCheckout('register');
      return;
    }

    openModal('checkout');
  };

  const handleDecrease = (item) => {
    const currentQty = item.quantity || 1;
    const nextQty = currentQty - 1;

    if (nextQty < 1) {
      removeFromCart(item.id, item.format);
      return;
    }

    updateQuantity(item.id, item.format, nextQty);
  };

  const hasPhysicalItems = cart.some((item) => item.format === 'physical');

  return (
    <>
      <div className="cart-overlay open" onClick={closeModal}></div>
      <div className="cart-panel open">
        <div className="cart-header">
          <h2><Icon name="cart" size={20} /> Mon panier <span className="cart-header-count">{cartCount}</span></h2>
          <button className="cart-close" onClick={closeModal}><Icon name="close" size={18} /></button>
        </div>
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon"></div>
              <p>Votre panier est vide</p>
              <p style={{ fontSize: '0.85rem' }}>Explorez notre catalogue pour trouver vos prochaines lectures !</p>
              <button className="btn btn-red" style={{ marginTop: '1rem' }} onClick={continueShopping}>Découvrir le catalogue</button>
            </div>
          ) : (
            cart.map(item => (
              <div key={`${item.id}-${item.format}`} className="cart-item">
                {item.cover_image ? (
                  <img src={item.cover_image} alt={item.title} className="cart-item-cover" style={{ borderRadius: '6px', width: '48px', height: '64px', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = '/images/covers/placeholder.svg'; }} />
                ) : (
                  <div className="cart-item-cover" style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}CC)`, borderRadius: '6px' }}></div>
                )}
                <div className="cart-item-info">
                  <div className="cart-item-title">{item.title}</div>
                  <div className="cart-item-author">{item.author_name}</div>
                  <span className={`cart-item-format${item.format === 'physical' ? ' physical' : ''}`}>
                    {item.format === 'physical' ? <><Icon name="package" size={12} /> Papier</> : <><Icon name="smartphone" size={12} /> eBook</>}
                  </span>
                  <div className="cart-qty-controls">
                    <button className="qty-btn" onClick={() => handleDecrease(item)}>−</button>
                    <span className="qty-value">{item.quantity || 1}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.format, (item.quantity || 1) + 1)}>+</button>
                  </div>
                </div>
                <div className="cart-item-price">{(item.finalPrice * (item.quantity || 1)).toLocaleString()} F</div>
                <button className="cart-item-remove" onClick={() => removeFromCart(item.id, item.format)}><Icon name="close" size={14} /></button>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="cart-footer" style={{ display: 'block' }}>
            <div className="cart-total">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-amount">{cartTotal.toLocaleString()} FCFA</span>
            </div>
            {hasPhysicalItems && (
              <div className="cart-auth-note">
                <Icon name="mapPin" size={14} /> Des livres papier sont dans votre panier: l'adresse de livraison sera demandée au paiement.
              </div>
            )}
            {!user && (
              <div className="cart-auth-note">
                <Icon name="lock" size={14} /> Connectez-vous pour finaliser votre achat et retrouver vos livres dans votre bibliothèque.
              </div>
            )}
            <div className="cart-auth-actions">
              <button className="cart-secondary-btn" onClick={continueShopping}>Continuer mes achats</button>
              <button className="cart-secondary-btn" onClick={clearCart}>Vider le panier</button>
            </div>
            {!user ? (
              <div className="cart-auth-actions">
                <button className="cart-checkout-btn" onClick={handleCheckout}>
                  Créer un compte et payer <Icon name="arrowRight" size={16} />
                </button>
                <button className="cart-secondary-btn" onClick={() => openAuthForCheckout('login')}>
                  J'ai déjà un compte
                </button>
              </div>
            ) : (
              <button className="cart-checkout-btn" onClick={handleCheckout}>
                Procéder au paiement <Icon name="arrowRight" size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
