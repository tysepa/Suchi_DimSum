import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingCart, CheckCircle, MapPin, Phone, User, Loader } from 'lucide-react';
import type { Product } from './MenuCard';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, newQty: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  backendUrl: string;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  backendUrl
}) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const total = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!clientName || !clientPhone || !clientAddress) {
      setErrorMsg('Please fill in all delivery details.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const itemsPayload = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      const res = await fetch(`${backendUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientPhone,
          clientAddress,
          items: itemsPayload
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit order.');
      }

      setOrderSuccess(data);
      onClearCart();
      // Clear form
      setClientName('');
      setClientPhone('');
      setClientAddress('');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOrderSuccess(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      justifyContent: 'flex-end',
      transition: 'var(--transition-smooth)'
    }}>
      {/* Background click to close */}
      <div 
        onClick={handleClose} 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} 
      />

      {/* Cart Drawer Content Panel */}
      <div 
        className="glass-panel-heavy"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          borderLeft: '1px solid var(--border-subtle)',
          borderTop: 'none',
          borderBottom: 'none',
          borderRight: 'none'
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem' }}>
            <ShoppingCart size={22} className="gold-text" />
            Your Command
          </h2>
          <button 
            onClick={handleClose} 
            style={{
              padding: '6px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Items Container */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }}>
          {orderSuccess ? (
            /* Success screen */
            <div style={{
              textAlign: 'center',
              padding: '20px 10px',
              animation: 'fadeIn 0.5s ease-out forwards',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <CheckCircle size={60} color="#4ade80" style={{ marginBottom: '20px' }} />
              <h3 className="gold-text" style={{ fontSize: '1.75rem', marginBottom: '10px', fontFamily: 'var(--font-serif)' }}>
                Order Confirmed!
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
                Your delivery request has been queued. Our kitchen is preparing your delicacies.
              </p>
              
              {/* Order Details card */}
              <div className="glass-panel" style={{
                width: '100%',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                textAlign: 'left',
                marginBottom: '30px'
              }}>
                <div style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORDER NUMBER</span>
                  <p style={{ fontWeight: 700, color: 'var(--color-gold)' }}>#GOLD-{orderSuccess.id}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DELIVER TO</span>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{orderSuccess.clientName}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{orderSuccess.clientAddress}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL VALUE</span>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-gold)' }}>${orderSuccess.totalPrice.toFixed(2)}</p>
                </div>
              </div>

              <button onClick={handleClose} className="btn btn-primary" style={{ width: '100%' }}>
                Done
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            /* Empty State */
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)'
            }}>
              <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Your shopping bag is empty.</p>
              <p style={{ fontSize: '0.85rem' }}>Select delicious sushi and dim sum from our menu to request delivery.</p>
            </div>
          ) : (
            /* Items List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cartItems.map((item) => {
                const itemImg = item.product.imageUrl.startsWith('http')
                  ? item.product.imageUrl
                  : `${backendUrl}${item.product.imageUrl}`;

                return (
                  <div 
                    key={item.product.id} 
                    style={{
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center',
                      paddingBottom: '16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <img 
                      src={itemImg} 
                      alt={item.product.name} 
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover',
                        background: '#222'
                      }}
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=100&auto=format&fit=crop";
                      }}
                    />
                    
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px' }}>
                        {item.product.name}
                      </h4>
                      <p style={{ color: 'var(--color-gold)', fontSize: '0.9rem', fontWeight: 700 }}>
                        ${item.product.price.toFixed(2)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                      {/* Quantity Toggles */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '4px',
                        padding: '2px'
                      }}>
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          style={{ padding: '4px', display: 'flex', alignItems: 'center' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '16px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          style={{ padding: '4px', display: 'flex', alignItems: 'center' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button 
                        onClick={() => onRemoveItem(item.product.id)}
                        style={{
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '0.75rem',
                          gap: '4px',
                          transition: 'var(--transition-smooth)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-red)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Checkout Form (only if items in cart & order not successful) */}
        {!orderSuccess && cartItems.length > 0 && (
          <div style={{
            padding: '24px',
            borderTop: '1px solid var(--border-light)',
            backgroundColor: 'rgba(0, 0, 0, 0.25)'
          }}>
            {/* Total Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Delivery Value:</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                ${total.toFixed(2)}
              </span>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="badge-cancelled" style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                marginBottom: '16px',
                width: '100%',
                textAlign: 'center'
              }}>
                {errorMsg}
              </div>
            )}

            {/* Checkout Form */}
            <form onSubmit={handleSubmitOrder}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }}>
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '38px', height: '42px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }}>
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="Contact Phone Number"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '38px', height: '42px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>
                    <MapPin size={16} />
                  </span>
                  <textarea
                    required
                    placeholder="Full Delivery Address"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="form-control"
                    rows={2}
                    style={{ paddingLeft: '38px', fontSize: '0.85rem', resize: 'none' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', height: '46px', gap: '8px' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Confirming Command...
                  </>
                ) : (
                  'Submit Delivery Command'
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CartDrawer;
