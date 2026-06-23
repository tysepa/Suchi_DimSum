import React, { useState, useEffect } from 'react';
import { LogIn, Plus, Edit, Trash2, Package, Image, ClipboardList, Key, LogOut, RefreshCw } from 'lucide-react';
import type { Product } from './MenuCard';
import type { GalleryItem } from './Gallery';

interface AdminDashboardProps {
  backendUrl: string;
  onRefreshProducts: () => void;
  onRefreshGallery: () => void;
}

interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  items: OrderItem[];
  totalPrice: number;
  status: string;
  createdAt: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  backendUrl,
  onRefreshProducts,
  onRefreshGallery
}) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Tabs: 'products' | 'gallery' | 'orders'
  const [activeTab, setActiveTab] = useState<'products' | 'gallery' | 'orders'>('products');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'sushi',
    imageUrl: ''
  });

  // Gallery state
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryForm, setGalleryForm] = useState({
    imageUrl: '',
    caption: ''
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Status feedback states
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [formMsg, setFormMsg] = useState({ text: '', type: 'success' });

  // Log in administrative handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    try {
      const res = await fetch(`${backendUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      localStorage.setItem('admin_token', data.token);
      setToken(data.token);
      setUsernameInput('');
      setPasswordInput('');
    } catch (err: any) {
      setAuthError(err.message || 'Invalid credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  // Fetch admin dashboard data
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    }
  };

  const fetchGallery = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/gallery`);
      if (res.ok) {
        const data = await res.json();
        setGalleryItems(data);
      }
    } catch (err) {
      console.error('Fetch gallery error:', err);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`${backendUrl}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchGallery();
      fetchOrders();
    }
  }, [token]);

  // Product submission (Add or Edit)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.description || !prodForm.price || !prodForm.imageUrl) {
      setFormMsg({ text: 'Please fill in all product fields', type: 'error' });
      return;
    }

    const payload = {
      name: prodForm.name,
      description: prodForm.description,
      price: Number(prodForm.price),
      category: prodForm.category,
      imageUrl: prodForm.imageUrl
    };

    try {
      const url = editingProduct 
        ? `${backendUrl}/api/products/${editingProduct.id}` 
        : `${backendUrl}/api/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Product save failed');
      }

      setFormMsg({ 
        text: editingProduct ? 'Product updated successfully' : 'Product created successfully', 
        type: 'success' 
      });
      
      setProdForm({ name: '', description: '', price: '', category: 'sushi', imageUrl: '' });
      setEditingProduct(null);
      fetchProducts();
      onRefreshProducts(); // Update parent home view
    } catch (err: any) {
      setFormMsg({ text: err.message || 'Error saving product', type: 'error' });
    }
  };

  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name,
      description: prod.description,
      price: prod.price.toString(),
      category: prod.category,
      imageUrl: prod.imageUrl
    });
    setFormMsg({ text: '', type: 'success' });
    // Scroll to form
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${backendUrl}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFormMsg({ text: 'Product deleted successfully', type: 'success' });
        fetchProducts();
        onRefreshProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Gallery submissions
  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.imageUrl || !galleryForm.caption) {
      setFormMsg({ text: 'All gallery fields are required', type: 'error' });
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/gallery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(galleryForm)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save gallery item');
      }

      setFormMsg({ text: 'Gallery item added successfully', type: 'success' });
      setGalleryForm({ imageUrl: '', caption: '' });
      fetchGallery();
      onRefreshGallery();
    } catch (err: any) {
      setFormMsg({ text: err.message || 'Error saving gallery item', type: 'error' });
    }
  };

  const handleDeleteGallery = async (id: number) => {
    if (!window.confirm('Delete this gallery image?')) return;
    try {
      const res = await fetch(`${backendUrl}/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFormMsg({ text: 'Gallery item removed', type: 'success' });
        fetchGallery();
        onRefreshGallery();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update delivery order status
  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const formatBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending': return 'badge-pending';
      case 'Preparing': return 'badge-preparing';
      case 'Out for Delivery': return 'badge-delivery';
      case 'Delivered': return 'badge-delivered';
      default: return 'badge-cancelled';
    }
  };

  if (!token) {
    /* Login View */
    return (
      <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px' }}>
        <div className="glass-panel animate-fade" style={{ width: '100%', maxWidth: '400px', padding: '40px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <span className="gold-text" style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>
              GOLDEN DRAGON
            </span>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Administration Access
            </p>
          </div>

          {authError && (
            <div className="badge-cancelled" style={{ padding: '10px 14px', borderRadius: '4px', textAlign: 'center', width: '100%', marginBottom: '20px', fontSize: '0.85rem' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }}>
                  <Key size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }}>
                  <Key size={16} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="admin123"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', gap: '8px' }}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Authenticating...' : 'Log In Dashboard'}
              <LogIn size={18} />
            </button>
          </form>
          
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <p>Default credentials: <b>admin</b> / <b>admin123</b></p>
          </div>
        </div>
      </section>
    );
  }

  /* Admin Main View */
  return (
    <section style={{ padding: '120px 0 80px', minHeight: '90vh' }}>
      <div className="container animate-fade">
        
        {/* Header Summary */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '24px',
          marginBottom: '36px'
        }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)' }}>
              Golden Dragon <span className="gold-text">Dashboard</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Welcome back, Administrator. Control prices, menu items, order status, and gallery.
            </p>
          </div>

          <button 
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--color-red)' }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

        {/* Dashboard Tabs Selectors */}
        <div className="glass-panel" style={{
          display: 'flex',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '40px'
        }}>
          {[
            { id: 'products', label: 'Manage Products', icon: <Package size={16} /> },
            { id: 'gallery', label: 'Manage Gallery', icon: <Image size={16} /> },
            { id: 'orders', label: 'Delivery Orders', icon: <ClipboardList size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setFormMsg({ text: '', type: 'success' });
              }}
              style={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 20px',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                fontWeight: 600,
                fontSize: '0.9rem',
                backgroundColor: activeTab === tab.id ? 'var(--color-gold-light)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-gold)' : 'var(--text-secondary)',
                transition: 'var(--transition-smooth)'
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'orders' && orders.filter(o => o.status === 'Pending').length > 0 && (
                <span style={{
                  background: 'var(--color-red)',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {orders.filter(o => o.status === 'Pending').length} new
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ========================================================
            TAB: MANAGE PRODUCTS (SUSHI & DIM SUM)
            ======================================================== */}
        {activeTab === 'products' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '40px',
            alignItems: 'start'
          }} className="admin-grid">
            
            {/* Form Section */}
            <div className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} className="gold-text" />
                {editingProduct ? 'Update Item / Price' : 'Add New Menu Item'}
              </h3>

              {formMsg.text && (
                <div 
                  className={formMsg.type === 'success' ? 'badge-delivered' : 'badge-cancelled'} 
                  style={{
                    padding: '10px 14px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    marginBottom: '20px',
                    fontSize: '0.85rem',
                    width: '100%'
                  }}
                >
                  {formMsg.text}
                </div>
              )}

              <form onSubmit={handleProductSubmit}>
                <div className="form-group">
                  <label className="form-label">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rainbow Sashimi Roll"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="form-control"
                    style={{ background: '#111', border: '1px solid var(--border-light)' }}
                  >
                    <option value="sushi">Sushi</option>
                    <option value="dimsum">Dim Sum</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL / Path</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. /images/dragon_roll.png"
                    value={prodForm.imageUrl}
                    onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                    className="form-control"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Available defaults: `/images/dragon_roll.png`, `/images/salmon_nigiri.png`, `/images/spicy_tuna.png`, `/images/har_gow.png`, `/images/shumai.png`, `/images/char_siu_bao.png`
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Description</label>
                  <textarea
                    required
                    placeholder="Describe culinary properties and ingredients..."
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    className="form-control"
                    rows={3}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>
                    {editingProduct ? 'Save Product' : 'Add Item'}
                  </button>
                  {editingProduct && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingProduct(null);
                        setProdForm({ name: '', description: '', price: '', category: 'sushi', imageUrl: '' });
                      }} 
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Table Section */}
            <div className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} className="gold-text" />
                Active Menu Items ({products.length})
              </h3>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Preview</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Details</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Category</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Price</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(prod => (
                    <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                      <td style={{ padding: '16px' }}>
                        <img 
                          src={prod.imageUrl.startsWith('http') ? prod.imageUrl : `${backendUrl}${prod.imageUrl}`} 
                          alt={prod.name} 
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=100&auto=format&fit=crop"; }}
                        />
                      </td>
                      <td style={{ padding: '16px', maxWidth: '280px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{prod.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {prod.description}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textTransform: 'capitalize', fontSize: '0.9rem' }}>
                        <span className={prod.category === 'sushi' ? 'badge badge-pending' : 'badge badge-delivery'} style={{ border: 'none' }}>
                          {prod.category}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontWeight: 700, color: 'var(--color-gold)' }}>
                        ${prod.price.toFixed(2)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleEditProductClick(prod)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 12px', border: 'none', background: 'rgba(255,255,255,0.05)' }}
                            title="Edit details and change price"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 12px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-red)' }}
                            title="Delete item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB: MANAGE GALLERY
            ======================================================== */}
        {activeTab === 'gallery' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '40px',
            alignItems: 'start'
          }} className="admin-grid">
            
            {/* Form Box */}
            <div className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} className="gold-text" />
                Add Image to Gallery
              </h3>

              {formMsg.text && (
                <div 
                  className={formMsg.type === 'success' ? 'badge-delivered' : 'badge-cancelled'} 
                  style={{
                    padding: '10px 14px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    marginBottom: '20px',
                    fontSize: '0.85rem'
                  }}
                >
                  {formMsg.text}
                </div>
              )}

              <form onSubmit={handleGallerySubmit}>
                <div className="form-group">
                  <label className="form-label">Image URL / Path</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. /images/gallery_sushi_plating.png"
                    value={galleryForm.imageUrl}
                    onChange={(e) => setGalleryForm({ ...galleryForm, imageUrl: e.target.value })}
                    className="form-control"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Available defaults: `/images/gallery_sushi_plating.png`, `/images/gallery_dim_sum_steam.png`, `/images/gallery_restaurant_interior.png`, `/images/gallery_dim_sum_making.png`
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Caption / Description</label>
                  <input
                    type="text"
                    required
                    placeholder="Describe this gourmet scene..."
                    value={galleryForm.caption}
                    onChange={(e) => setGalleryForm({ ...galleryForm, caption: e.target.value })}
                    className="form-control"
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Upload to Gallery Listing
                </button>
              </form>
            </div>

            {/* Gallery Images List */}
            <div className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Image size={18} className="gold-text" />
                Active Gallery Visuals ({galleryItems.length})
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '20px'
              }}>
                {galleryItems.map(item => (
                  <div 
                    key={item.id}
                    className="premium-card"
                    style={{ position: 'relative', overflow: 'hidden' }}
                  >
                    <img 
                      src={item.imageUrl.startsWith('http') ? item.imageUrl : `${backendUrl}${item.imageUrl}`} 
                      alt={item.caption}
                      style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=200&auto=format&fit=crop"; }}
                    />
                    <div style={{ padding: '12px' }}>
                      <p style={{ fontSize: '0.75rem', height: '40px', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                        {item.caption}
                      </p>
                      
                      <button
                        onClick={() => handleDeleteGallery(item.id)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          width: '100%',
                          marginTop: '8px',
                          border: 'none',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: 'var(--color-red)',
                          padding: '6px'
                        }}
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB: CLIENT DELIVERY ORDERS
            ======================================================== */}
        {activeTab === 'orders' && (
          <div className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-md)' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <ClipboardList size={18} className="gold-text" />
                Delivery Commands Queue ({orders.length})
              </h3>
              
              <button 
                onClick={fetchOrders}
                disabled={loadingOrders}
                className="btn btn-secondary btn-sm"
                style={{ height: '36px', gap: '6px' }}
              >
                <RefreshCw size={14} className={loadingOrders ? 'animate-spin' : ''} />
                Refresh List
              </button>
            </div>

            {loadingOrders && orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={36} className="animate-spin gold-text" style={{ marginBottom: '12px' }} />
                <p>Loading delivery commands...</p>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p>No delivery orders found yet.</p>
              </div>
            ) : (
              /* Orders Timeline Queue */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {orders.map(order => (
                  <div 
                    key={order.id} 
                    className="glass-panel"
                    style={{
                      padding: '24px',
                      borderRadius: 'var(--radius-md)',
                      border: order.status === 'Pending' ? '1px solid rgba(201, 160, 84, 0.4)' : '1px solid var(--border-light)',
                      boxShadow: order.status === 'Pending' ? '0 0 15px rgba(201, 160, 84, 0.08)' : 'none',
                      animation: order.status === 'Pending' ? 'pulse-gold 2.5s infinite' : 'none'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      paddingBottom: '16px',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORDER NUMBER</span>
                        <h4 style={{ fontSize: '1.15rem', color: 'var(--color-gold)', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>
                          #GOLD-{order.id}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Ordered: {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Status Selector dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={`badge ${formatBadgeClass(order.status)}`}>
                          {order.status}
                        </span>

                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="form-control"
                          style={{
                            fontSize: '0.8rem',
                            padding: '6px 12px',
                            background: '#111',
                            height: '32px',
                            width: '150px',
                            borderRadius: '4px'
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Customer & Items Details columns */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '24px'
                    }}>
                      {/* Left: Client info */}
                      <div>
                        <h5 style={{ color: 'var(--color-gold)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                          Delivery Details
                        </h5>
                        <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>{order.clientName}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          📞 {order.clientPhone}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--color-gold)' }}>
                          📍 {order.clientAddress}
                        </p>
                      </div>

                      {/* Right: Items detail list */}
                      <div>
                        <h5 style={{ color: 'var(--color-gold)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                          Delicacies Ordered
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {order.items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px dashed rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                              <span>
                                <span style={{ fontWeight: 700, color: 'var(--color-gold)' }}>{item.quantity}x</span> {item.name}
                              </span>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontWeight: 700,
                            fontSize: '1.05rem',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            paddingTop: '8px',
                            marginTop: '8px'
                          }}>
                            <span>Total Value:</span>
                            <span style={{ color: 'var(--color-gold)' }}>
                              ${order.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      
      {/* Embedded CSS grid responsive helper */}
      <style>{`
        .admin-grid {
          grid-template-columns: 350px 1fr !important;
        }
        @media (max-width: 900px) {
          .admin-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .table-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.01) !important;
        }
      `}</style>
    </section>
  );
};

export default AdminDashboard;
