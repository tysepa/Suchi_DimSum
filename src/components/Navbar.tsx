import React from 'react';
import { ShoppingBag, ShieldAlert, X, Menu } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onCartToggle: () => void;
  onAdminToggle: () => void;
  isAdminMode: boolean;
  scrollToSection: (id: string) => void;
  activeSection: string;
  backendUrl: string;
}

const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onCartToggle,
  onAdminToggle,
  isAdminMode,
  scrollToSection,
  activeSection,
  backendUrl,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Menu', id: 'menu' },
    { name: 'Services', id: 'services' },
    { name: 'Gallery', id: 'gallery' },
    { name: 'About', id: 'about' },
    { name: 'Contact', id: 'contact' },
  ];

  const handleLinkClick = (id: string) => {
    scrollToSection(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="glass-panel" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 1000,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      padding: '16px 0',
      transition: 'var(--transition-smooth)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* Restaurant Brand Title */}
        <div 
          onClick={() => handleLinkClick('home')} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <img 
            src={`${backendUrl}/images/logo.png`} 
            alt="Golden Dragon Logo" 
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              objectFit: 'cover', 
              border: '1px solid var(--color-gold)',
              filter: 'invert(1) hue-rotate(180deg)'
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="gold-text" style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.4rem',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '0.05em'
            }}>
              GOLDEN DRAGON
            </span>
            <span style={{
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              color: 'var(--text-secondary)',
              marginTop: '2px'
            }}>
              SUSHI & DIM SUM
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        {!isAdminMode && (
          <ul style={{
            display: 'flex',
            gap: '32px',
            listStyle: 'none',
            alignItems: 'center'
          }} className="desktop-only-flex">
            {navLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => handleLinkClick(link.id)}
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: activeSection === link.id ? 'var(--color-gold)' : 'var(--text-secondary)',
                    transition: 'var(--transition-smooth)',
                    padding: '8px 0',
                    borderBottom: `2px solid ${activeSection === link.id ? 'var(--color-gold)' : 'transparent'}`
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== link.id) e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== link.id) e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {link.name}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Admin Toggle button */}
          <button
            onClick={onAdminToggle}
            className={`btn btn-sm ${isAdminMode ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              fontSize: '0.75rem',
              padding: '8px 16px',
            }}
          >
            <ShieldAlert size={14} />
            {isAdminMode ? 'Customer View' : 'Admin Panel'}
          </button>

          {/* Cart Icon (only in Customer Mode) */}
          {!isAdminMode && (
            <button
              onClick={onCartToggle}
              style={{
                position: 'relative',
                padding: '8px',
                color: 'var(--text-primary)',
                transition: 'var(--transition-smooth)',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-gold-light)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              title="Open Shopping Cart"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--color-red)',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                }}>
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          {!isAdminMode && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-only"
              style={{
                padding: '8px',
                color: 'var(--text-primary)',
                display: 'none' // Controlled in responsive styling
              }}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {isMobileMenuOpen && !isAdminMode && (
          <div className="glass-panel-heavy" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            padding: '20px 24px',
            marginTop: '8px',
            borderRadius: '0 0 var(--radius-md) var(--radius-md)',
            animation: 'fadeIn 0.3s ease-out forwards',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 999
          }}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                style={{
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '10px 0',
                  color: activeSection === link.id ? 'var(--color-gold)' : 'var(--text-secondary)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                {link.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Embedded CSS for responsive overrides since we are using Vanilla CSS */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-only-flex {
            display: none !important;
          }
          .mobile-only {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
