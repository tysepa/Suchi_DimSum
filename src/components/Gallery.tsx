import React, { useState } from 'react';
import { Maximize2, X } from 'lucide-react';

export interface GalleryItem {
  id: number;
  imageUrl: string;
  caption: string;
}

interface GalleryProps {
  items: GalleryItem[];
  backendUrl: string;
}

const Gallery: React.FC<GalleryProps> = ({ items, backendUrl }) => {
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const getFullImgUrl = (path: string) => {
    return path.startsWith('http') ? path : `${backendUrl}${path}`;
  };

  return (
    <section id="gallery" style={{ padding: '80px 0', borderBottom: '1px solid var(--border-light)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--color-gold)',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            fontWeight: 600
          }}>
            Culinary Artistry
          </span>
          <h2 style={{ fontSize: '2.5rem', marginTop: '8px', fontFamily: 'var(--font-serif)' }}>
            Our Gallery
          </h2>
          <div style={{
            width: '60px',
            height: '2px',
            background: 'var(--color-gold)',
            margin: '16px auto 0'
          }} />
        </div>

        {/* Gallery Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '24px'
        }}>
          {(isExpanded ? items : items.slice(0, 4)).map((item) => (
            <div 
              key={item.id}
              onClick={() => setActiveItem(item)}
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                cursor: 'pointer',
                aspectRatio: '1',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-md)',
                transition: 'var(--transition-spring)'
              }}
              className="gallery-item-card"
            >
              <img 
                src={getFullImgUrl(item.imageUrl)} 
                alt={item.caption} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)'
                }}
                className="gallery-img"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600&auto=format&fit=crop";
                }}
              />

              {/* Hover overlay */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'flex-start'
                }}
                className="gallery-hover-overlay"
              >
                <span style={{
                  color: 'var(--color-gold)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '6px',
                  borderRadius: '50%',
                  marginBottom: '10px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <Maximize2 size={16} />
                </span>
                
                <p style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'white',
                  lineHeight: 1.4,
                  transform: 'translateY(10px)',
                  transition: 'transform 0.3s ease'
                }} className="gallery-caption">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {items.length > 4 && (
          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn btn-secondary"
              style={{ padding: '12px 30px', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              {isExpanded ? 'Show Less' : 'See More'}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Dialog Modal */}
      {activeItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(5, 6, 10, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 3000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          {/* Close button */}
          <button 
            onClick={() => setActiveItem(null)}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              color: 'white',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '10px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3010
            }}
          >
            <X size={24} />
          </button>

          {/* Expanded Image container */}
          <div style={{
            maxWidth: '900px',
            maxHeight: '75vh',
            position: 'relative',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            animation: 'fadeIn 0.4s ease-out forwards'
          }}>
            <img 
              src={getFullImgUrl(activeItem.imageUrl)} 
              alt={activeItem.caption} 
              style={{
                width: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                display: 'block'
              }}
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800&auto=format&fit=crop";
              }}
            />
          </div>

          {/* Caption text */}
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            textAlign: 'center',
            marginTop: '20px',
            maxWidth: '600px',
            lineHeight: 1.5,
            animation: 'fadeIn 0.5s ease-out forwards'
          }}>
            {activeItem.caption}
          </p>
        </div>
      )}

      {/* Grid Hover Styling */}
      <style>{`
        .gallery-item-card:hover {
          transform: scale(1.03);
          border-color: var(--color-gold);
        }
        .gallery-item-card:hover .gallery-img {
          transform: scale(1.08);
        }
        .gallery-item-card:hover .gallery-hover-overlay {
          opacity: 1;
        }
        .gallery-item-card:hover .gallery-caption {
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
};

export default Gallery;
