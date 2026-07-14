import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MenuCard from './components/MenuCard';
import type { Product } from './components/MenuCard';
import CartDrawer from './components/CartDrawer';
import type { CartItem } from './components/CartDrawer';
import Gallery from './components/Gallery';
import type { GalleryItem } from './components/Gallery';
import AdminDashboard from './components/AdminDashboard';
import { ChefHat, Truck, Clock, Sparkles, MapPin, Phone, Award } from 'lucide-react';


const BACKEND_URL = import.meta.env.VITE_API_URL || 
  (window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin);


const CHEF_PHOTOS = [
  { src: '/images/chef_muami.jpg', label: 'Master Chef Portrait' },
  { src: '/images/chef_muami_alternate.jpg', label: 'Artistry in Action' },
  { src: '/images/chef_fish.jpg', label: 'Selecting Fresh Catch' },
  { src: '/images/chef_team.jpg', label: 'Culinary Team Presentation' },
  { src: '/images/chef_angel_pose.jpg', label: 'Culinary Director Pose' },
  { src: '/images/chef_skol_backdrop.jpg', label: 'Corporate Showcase Event' },
  { src: '/images/chef_angel_smile.jpg', label: 'Culinary Director Smile' }
];

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // API Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [menuFilter, setMenuFilter] = useState<'all' | 'sushi' | 'dimsum'>('all');
  const [loading, setLoading] = useState(true);

  // Chef Section state and animations
  const [aboutVisible, setAboutVisible] = useState(false);
  const [chefPhotoIndex, setChefPhotoIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAboutVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    const element = document.getElementById('about');
    if (element) {
      observer.observe(element);
    }
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setChefPhotoIndex((prev) => (prev + 1) % CHEF_PHOTOS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);



  // Fetch menu and gallery data
  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch(`${BACKEND_URL}/api/products`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }

      const galRes = await fetch(`${BACKEND_URL}/api/gallery`);
      if (galRes.ok) {
        const galData = await galRes.json();
        setGalleryItems(galData);
      }
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set active link on scroll
  useEffect(() => {
    if (isAdminMode) return;
    
    const handleScroll = () => {
      const sections = ['home', 'menu', 'services', 'gallery', 'about'];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const offsetTop = el.offsetTop;
          const offsetHeight = el.offsetHeight;
          if (scrollPos >= offsetTop && scrollPos < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAdminMode]);

  const scrollToSection = (id: string) => {
    if (isAdminMode) {
      setIsAdminMode(false);
      // Let React render customer view, then scroll
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Cart operations
  const handleAddToOrder = (product: Product) => {
    setCartItems(prevItems => {
      const existing = prevItems.find(item => item.product.id === product.id);
      if (existing) {
        return prevItems.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
    // Shake shopping bag or trigger sidebar drawer open
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const filteredProducts = products.filter(prod => {
    if (menuFilter === 'all') return true;
    return prod.category === menuFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* 1. Global Navigation Bar */}
      <Navbar 
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onCartToggle={() => setIsCartOpen(!isCartOpen)}
        onAdminToggle={() => setIsAdminMode(!isAdminMode)}
        isAdminMode={isAdminMode}
        scrollToSection={scrollToSection}
        activeSection={activeSection}
        backendUrl={BACKEND_URL}
      />

      {/* Main Container Switch */}
      {isAdminMode ? (
        /* ========================================================
            ADMIN WORKING VIEW
            ======================================================== */
        <AdminDashboard 
          backendUrl={BACKEND_URL}
          onRefreshProducts={fetchData}
          onRefreshGallery={fetchData}
        />
      ) : (
        /* ========================================================
            CUSTOMER PRESENTATION VIEW
            ======================================================== */
        <>
          {/* 2. Hero Header */}
          <Hero onExploreClick={() => scrollToSection('menu')} backendUrl={BACKEND_URL} />

          {/* 3. Products Menu Section */}
          <section id="menu" style={{ padding: '100px 0', borderBottom: '1px solid var(--border-light)' }}>
            <div className="container">
              {/* Menu Title */}
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-gold)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  fontWeight: 600
                }}>
                  Exquisite Selection
                </span>
                <h2 style={{ fontSize: '2.5rem', marginTop: '8px', fontFamily: 'var(--font-serif)' }}>
                  Gourmet Menu
                </h2>
                <div style={{
                  width: '60px',
                  height: '2px',
                  background: 'var(--color-gold)',
                  margin: '16px auto 0'
                }} />
              </div>

              {/* Category Filter Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '48px',
                flexWrap: 'wrap'
              }}>
                {[
                  { id: 'all', label: 'All Delicacies' },
                  { id: 'sushi', label: 'Sushi Rolls & Nigiri' },
                  { id: 'dimsum', label: 'Steamed Dim Sum' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setMenuFilter(tab.id as any)}
                    className={`btn btn-sm ${menuFilter === tab.id ? 'btn-primary animate-pulse-gold' : 'btn-secondary'}`}
                    style={{ textTransform: 'capitalize', letterSpacing: 'normal' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Loader or Products Grid */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <p>Loading culinary delicacies...</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '30px'
                }}>
                  {filteredProducts.map(product => (
                    <MenuCard 
                      key={product.id}
                      product={product}
                      onAddToOrder={handleAddToOrder}
                      backendUrl={BACKEND_URL}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 4. Services Advertise Section */}
          <section id="services" style={{
            padding: '100px 0',
            borderBottom: '1px solid var(--border-light)',
            background: 'linear-gradient(rgba(11, 12, 16, 0.97), rgba(11, 12, 16, 0.97)), url("/images/gallery_dim_sum_steam.png") no-repeat center center/cover'
          }}>
            <div className="container">
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-gold)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  fontWeight: 600
                }}>
                  Our Offerings
                </span>
                <h2 style={{ fontSize: '2.5rem', marginTop: '8px', fontFamily: 'var(--font-serif)' }}>
                  Premium Services
                </h2>
                <div style={{
                  width: '60px',
                  height: '2px',
                  background: 'var(--color-gold)',
                  margin: '16px auto 0'
                }} />
              </div>

              {/* Service Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '30px'
              }}>
                {[
                  {
                    icon: <Truck size={36} className="gold-text" />,
                    title: 'On-Demand Delivery',
                    desc: 'Freshly prepared dishes dispatched immediately upon order command, maintaining heat and moisture.'
                  },
                  {
                    icon: <ChefHat size={36} className="gold-text" />,
                    title: 'Private Catering',
                    desc: 'Bring a certified sushi master and dim sum artisan directly to your estate for bespoke sushi events.'
                  },
                  {
                    icon: <Clock size={36} className="gold-text" />,
                    title: 'Bespoke Pre-Orders',
                    desc: 'Schedule custom banquets and culinary boxes 24 hours in advance to guarantee specific fresh catches.'
                  },
                  {
                    icon: <Sparkles size={36} className="gold-text" />,
                    title: 'Signature Omakase',
                    desc: 'Let our head chef dictate your palette with a rotating, curated selection of premium imports.'
                  }
                ].map((serv, idx) => (
                  <div 
                    key={idx} 
                    className="glass-panel" 
                    style={{
                      padding: '40px 30px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      transition: 'var(--transition-smooth)',
                      border: '1px solid var(--border-light)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-gold)';
                      e.currentTarget.style.transform = 'translateY(-5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-light)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      display: 'inline-flex',
                      padding: '16px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.02)',
                      marginBottom: '24px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      {serv.icon}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{serv.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{serv.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 5. Gallery Section */}
          <Gallery items={galleryItems} backendUrl={BACKEND_URL} />

          {/* 6. About Section */}
          <section id="about" style={{ padding: '100px 0', borderBottom: '1px solid var(--border-light)', overflow: 'hidden', position: 'relative' }}>
            {/* Style tags for advanced animations */}
            <style>{`
              .reveal-section {
                opacity: 0;
                transform: translateY(40px);
                transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
              }
              .reveal-section.reveal-visible {
                opacity: 1;
                transform: translateY(0);
              }
              .credential-card {
                padding: 16px;
                border-radius: var(--radius-md);
                border: 1px solid var(--border-subtle);
                transition: var(--transition-spring);
                display: flex;
                flex-direction: column;
                gap: 8px;
                background: rgba(255, 255, 255, 0.01);
              }
              .credential-card:hover {
                border-color: var(--color-gold) !important;
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(201, 160, 84, 0.12);
                background: var(--color-gold-light) !important;
              }
              .chef-image-container {
                position: relative;
                width: 100%;
                height: 500px;
                cursor: pointer;
              }
              .chef-img-layer {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: opacity 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1);
                border-radius: var(--radius-lg);
              }
              .chef-image-container:hover .chef-img-layer {
                transform: scale(1.03);
              }
              @keyframes float-ring {
                0% { transform: translate(0, 0) rotate(0deg); }
                50% { transform: translate(12px, -18px) rotate(180deg); }
                100% { transform: translate(0, 0) rotate(360deg); }
              }
              .floating-ring-1 {
                position: absolute;
                width: 300px;
                height: 300px;
                border: 2px dashed rgba(201, 160, 84, 0.15);
                border-radius: 50%;
                top: -50px;
                right: -50px;
                pointer-events: none;
                animation: float-ring 25s linear infinite;
                z-index: 0;
              }
              .floating-ring-2 {
                position: absolute;
                width: 200px;
                height: 200px;
                border: 1px dashed rgba(201, 160, 84, 0.1);
                border-radius: 50%;
                bottom: -30px;
                left: -30px;
                pointer-events: none;
                animation: float-ring 18s linear infinite reverse;
                z-index: 0;
              }
            `}</style>

            {/* Floating background decorative rings */}
            <div className="floating-ring-1" />
            <div className="floating-ring-2" />

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '60px',
                alignItems: 'center'
              }}>
                {/* Left side details */}
                <div className={`reveal-section ${aboutVisible ? 'reveal-visible' : ''}`}>
                  <span style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-gold)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    fontWeight: 600,
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Founder & Culinary Director
                  </span>
                  <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', marginBottom: '20px' }}>
                    Meet Chef <br />
                    <span className="gold-text" style={{ fontSize: '3rem' }}>Muami Suleiman</span>
                  </h2>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.7 }}>
                    Chef Muami Suleiman is the proud owner, founder, and culinary director of this website and company. Fusing deep Asian heritage with modern gourmet execution, he brings decades of specialized experience in high-end sushi craftsmanship and traditional Cantonese dim sum.
                  </p>

                  {/* Badges Grid (4 credentials cards) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                  }}>
                    {[
                      {
                        title: 'Owner & Founder',
                        desc: 'The guiding force behind the Golden Dragon brand, platform, and kitchen standards.',
                        icon: <Sparkles size={18} style={{ color: 'var(--color-gold)' }} />
                      },
                      {
                        title: 'Japan Kitchen Certified',
                        desc: 'Holding prestigious certifications from traditional kitchens and master chefs in Japan.',
                        icon: <Award size={18} style={{ color: 'var(--color-gold)' }} />
                      },
                      {
                        title: 'Pan-Asian Master',
                        desc: 'Trained extensively across all of Asia, mastering Cantonese dim sum steaming techniques.',
                        icon: <ChefHat size={18} style={{ color: 'var(--color-gold)' }} />
                      },
                      {
                        title: 'Sushi & Dim Sum Expert',
                        desc: 'Decades of authentic, hand-rolled sushi and delicate dumpling culinary execution.',
                        icon: <Clock size={18} style={{ color: 'var(--color-gold)' }} />
                      }
                    ].map((badge, bIdx) => (
                      <div key={bIdx} className="credential-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(201, 160, 84, 0.08)',
                            border: '1px solid rgba(201, 160, 84, 0.15)'
                          }}>
                            {badge.icon}
                          </div>
                          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{badge.title}</h4>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{badge.desc}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Master chef quote card */}
                  <div className="glass-panel" style={{
                    padding: '20px 24px',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '4px solid var(--color-gold)',
                    background: 'rgba(255, 255, 255, 0.02)'
                  }}>
                    <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      "Gastronomy is the silent dialogue of texture, fresh ingredients, and steam. My mission is to bring the absolute pinnacle of Asian culinary perfection directly to your residential command."
                    </p>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginTop: '12px', color: 'var(--color-gold)', letterSpacing: '0.05em' }}>
                      — Chef Muami Suleiman, Founder & Master Chef
                    </span>
                  </div>
                </div>

                {/* Right side chef photo with hover crossfade animation and manual controls */}
                <div className={`reveal-section ${aboutVisible ? 'reveal-visible' : ''}`} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Gold decorative border */}
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    width: '100%',
                    height: '500px',
                    border: '2px solid var(--color-gold)',
                    borderRadius: 'var(--radius-lg)',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }} />
                  
                  {/* Image container frame */}
                  <div className="chef-image-container" style={{ zIndex: 2 }}>
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-lg)'
                    }}>
                      {CHEF_PHOTOS.map((photo, index) => (
                        <img 
                          key={index}
                          src={`${BACKEND_URL}${photo.src}`} 
                          alt={`Chef Muami Suleiman - ${photo.label}`} 
                          className="chef-img-layer"
                          style={{
                            opacity: chefPhotoIndex === index ? 1 : 0,
                            pointerEvents: chefPhotoIndex === index ? 'auto' : 'none',
                            transition: 'opacity 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)'
                          }}
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop";
                          }}
                        />
                      ))}

                      {/* Left/Right Navigation Arrows overlay */}
                      <button 
                        onClick={() => setChefPhotoIndex((prev) => (prev === 0 ? CHEF_PHOTOS.length - 1 : prev - 1))}
                        style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'white',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)',
                          zIndex: 10
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-gold)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                        aria-label="Previous image"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </button>
                      <button 
                        onClick={() => setChefPhotoIndex((prev) => (prev === CHEF_PHOTOS.length - 1 ? 0 : prev + 1))}
                        style={{
                          position: 'absolute',
                          right: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'white',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)',
                          zIndex: 10
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-gold)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                        aria-label="Next image"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>

                      {/* Small Caption Label on bottom of photo */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '16px 20px',
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                        color: 'white',
                        zIndex: 5,
                        pointerEvents: 'none'
                      }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                          Chef Muami Suleiman
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>
                          {CHEF_PHOTOS[chefPhotoIndex].label}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dot Indicators */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '24px',
                    zIndex: 3,
                    position: 'relative'
                  }}>
                    {CHEF_PHOTOS.map((photo, idx) => (
                      <button
                        key={idx}
                        onClick={() => setChefPhotoIndex(idx)}
                        title={photo.label}
                        style={{
                          width: chefPhotoIndex === idx ? '24px' : '8px',
                          height: '8px',
                          borderRadius: 'var(--radius-full)',
                          background: chefPhotoIndex === idx ? 'var(--color-gold)' : 'rgba(255,255,255,0.25)',
                          border: 'none',
                          transition: 'var(--transition-smooth)',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </section>

          {/* 7. Restaurant Footer */}
          <footer style={{ backgroundColor: 'hsl(220, 20%, 4%)', padding: '80px 0 40px', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}>
            <div className="container">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '40px',
                marginBottom: '60px'
              }}>
                {/* Brand column */}
                <div>
                  <h3 className="gold-text" style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '8px' }}>
                    GOLDEN DRAGON
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '20px' }}>
                    SUSHI & DIM SUM
                  </p>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                    Fusing Japanese sushi craftsmanship and Cantonese dim sum traditions to create an unparalleled residential dining experience.
                  </p>
                </div>

                {/* Opening Hours */}
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>
                    Opening Hours
                  </h4>
                  <ul style={{ listStyle: 'none', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <li>Monday - Thursday: 12:00 PM - 10:00 PM</li>
                    <li style={{ color: 'var(--color-gold)' }}>Friday - Saturday: 12:00 PM - 11:30 PM</li>
                    <li>Sunday: 1:00 PM - 9:30 PM</li>
                  </ul>
                </div>

                {/* Contact details */}
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>
                    Connect & Order
                  </h4>
                  <ul style={{ listStyle: 'none', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} className="gold-text" />
                      +1 (800) 555-GOLD
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={14} className="gold-text" />
                      888 Golden Dragon Ave, Suite S, NY
                    </li>
                  </ul>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                    <a href="#" className="gold-text" style={{ opacity: 0.7 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    </a>
                    <a href="#" className="gold-text" style={{ opacity: 0.7 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Divider & Copyright */}
              <div style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '30px',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                <p>&copy; {new Date().getFullYear()} GOLDEN DRAGON Asian Gastronomy. All rights reserved. Handcrafted delivery on client command.</p>
              </div>
            </div>
          </footer>

          {/* 8. Interactive Cart Sidebar */}
          <CartDrawer 
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            backendUrl={BACKEND_URL}
          />
        </>
      )}

    </div>
  );
}

export default App;
