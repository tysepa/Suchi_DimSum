import React from 'react';
import { Plus } from 'lucide-react';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: 'sushi' | 'dimsum';
  imageUrl: string;
}

interface MenuCardProps {
  product: Product;
  onAddToOrder: (product: Product) => void;
  backendUrl: string;
}

const MenuCard: React.FC<MenuCardProps> = ({ product, onAddToOrder, backendUrl }) => {
  // Resolve image URL
  const imgUrl = product.imageUrl.startsWith('http') 
    ? product.imageUrl 
    : `${backendUrl}${product.imageUrl}`;

  return (
    <div className="premium-card animate-fade" style={{ height: '100%' }}>
      {/* Product Image Container with Zoom hover */}
      <div style={{
        position: 'relative',
        paddingTop: '68%',
        overflow: 'hidden',
        background: '#111'
      }}>
        <img 
          src={imgUrl} 
          alt={product.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)'
          }}
          className="product-image-hover"
          onError={(e) => {
            // Fallback placeholder image if server image fails
            e.currentTarget.src = "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800&auto=format&fit=crop";
          }}
        />

        {/* Category Badge overlay */}
        <span 
          className="badge" 
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            backgroundColor: product.category === 'sushi' ? 'rgba(11, 12, 16, 0.85)' : 'rgba(235, 60, 41, 0.85)',
            border: `1px solid ${product.category === 'sushi' ? 'var(--color-gold)' : 'white'}`,
            color: product.category === 'sushi' ? 'var(--color-gold)' : 'white',
            backdropFilter: 'blur(4px)',
            fontSize: '0.65rem'
          }}
        >
          {product.category === 'sushi' ? 'Sushi Roll' : 'Dim Sum'}
        </span>
      </div>

      {/* Info Container */}
      <div style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          marginBottom: '10px',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}>
          {product.name}
        </h3>

        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: '20px',
          flexGrow: 1
        }}>
          {product.description}
        </p>

        {/* Price & Action Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Price
            </span>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-gold)'
            }}>
              ${product.price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => onAddToOrder(product)}
            className="btn btn-primary btn-sm"
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              textTransform: 'none',
              letterSpacing: 'normal'
            }}
          >
            <Plus size={16} />
            Add to Order
          </button>
        </div>
      </div>

      {/* Styling for image zoom */}
      <style>{`
        .premium-card:hover .product-image-hover {
          transform: scale(1.08);
        }
      `}</style>
    </div>
  );
};

export default MenuCard;
