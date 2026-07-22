import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, run } from './db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'premium-sushi-dim-sum-secret-key-2026';

// Extend Request interface to include admin payload
export interface AuthenticatedRequest extends Request {
  adminId?: number;
}

// Authentication Middleware
export const authenticateAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization header provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    req.adminId = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Configure Multer Storage (memory storage for Vercel/ImgBB uploads, disk storage for local dev)
const storage = (process.env.IMGBB_API_KEY || process.env.VERCEL)
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.resolve(__dirname, '../public/images');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'upload-' + uniqueSuffix + ext);
      }
    });

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit size to 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, jpeg, png, webp, gif) are allowed'));
  }
});

// File upload endpoint (protected, Admin only)
router.post('/upload', authenticateAdmin, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const apiKey = process.env.IMGBB_API_KEY;

  if (apiKey) {
    try {
      const base64Image = req.file.buffer.toString('base64');
      const bodyParams = new URLSearchParams();
      bodyParams.append('image', base64Image);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams
      });

      const result: any = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Failed to upload to ImgBB');
      }

      return res.json({ imageUrl: result.data.url });
    } catch (error: any) {
      console.error('ImgBB upload error:', error);
      return res.status(500).json({ message: error.message || 'Cloud image upload failed' });
    }
  } else {
    // If on Vercel and no apiKey is set, return a clean error instead of trying to write to read-only disk
    if (process.env.VERCEL) {
      return res.status(400).json({ 
        message: 'Image uploads in production require the IMGBB_API_KEY environment variable to be configured in Vercel settings.' 
      });
    }

    const fileUrl = `/images/${req.file.filename}`;
    return res.json({ imageUrl: fileUrl });
  }
});



// ==========================================
// 1. ADMIN AUTHENTICATION
// ==========================================

router.post('/admin/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const admins = await query('SELECT * FROM admin WHERE username = ?', [username]);
    if (admins.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const admin = admins[0];
    const isPasswordValid = bcrypt.compareSync(password, admin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, username: admin.username });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper route to check if token is valid
router.get('/admin/verify', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ valid: true });
});

// ==========================================
// 2. PRODUCTS (SUSHI & DIM SUM MENU)
// ==========================================

// Get all products
router.get('/products', async (req: Request, res: Response) => {
  try {
    const products = await query('SELECT * FROM products ORDER BY category, id DESC');
    return res.json(products);
  } catch (error: any) {
    console.error('Get products error:', error);
    return res.status(500).json({ message: 'Failed to retrieve products' });
  }
});

// Create product (Admin only)
router.post('/products', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, price, category, imageUrl } = req.body;

  if (!name || !description || price === undefined || !category || !imageUrl) {
    return res.status(400).json({ message: 'All product fields are required' });
  }

  try {
    const result = await run(
      'INSERT INTO products (name, description, price, category, imageUrl) VALUES (?, ?, ?, ?, ?)',
      [name, description, Number(price), category, imageUrl]
    );
    return res.status(201).json({
      id: result.lastID,
      name,
      description,
      price: Number(price),
      category,
      imageUrl
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    return res.status(500).json({ message: 'Failed to create product' });
  }
});

// Update product / price (Admin only)
router.put('/products/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, price, category, imageUrl } = req.body;

  if (!name || !description || price === undefined || !category || !imageUrl) {
    return res.status(400).json({ message: 'All product fields are required' });
  }

  try {
    const existing = await query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await run(
      'UPDATE products SET name = ?, description = ?, price = ?, category = ?, imageUrl = ? WHERE id = ?',
      [name, description, Number(price), category, imageUrl, id]
    );

    return res.json({
      id: Number(id),
      name,
      description,
      price: Number(price),
      category,
      imageUrl
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    return res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete product (Admin only)
router.delete('/products/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const existing = await query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await run('DELETE FROM products WHERE id = ?', [id]);
    return res.json({ message: 'Product deleted successfully', id: Number(id) });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return res.status(500).json({ message: 'Failed to delete product' });
  }
});

// ==========================================
// 3. GALLERY ITEMS
// ==========================================

// Get all gallery items
router.get('/gallery', async (req: Request, res: Response) => {
  try {
    const items = await query('SELECT * FROM gallery ORDER BY id DESC');
    return res.json(items);
  } catch (error: any) {
    console.error('Get gallery error:', error);
    return res.status(500).json({ message: 'Failed to retrieve gallery items' });
  }
});

// Create gallery item (Admin only)
router.post('/gallery', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { imageUrl, caption } = req.body;

  if (!imageUrl || !caption) {
    return res.status(400).json({ message: 'Image URL and caption are required' });
  }

  try {
    const result = await run('INSERT INTO gallery (imageUrl, caption) VALUES (?, ?)', [imageUrl, caption]);
    return res.status(201).json({
      id: result.lastID,
      imageUrl,
      caption
    });
  } catch (error: any) {
    console.error('Create gallery item error:', error);
    return res.status(500).json({ message: 'Failed to create gallery item' });
  }
});

// Delete gallery item (Admin only)
router.delete('/gallery/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const existing = await query('SELECT * FROM gallery WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    await run('DELETE FROM gallery WHERE id = ?', [id]);
    return res.json({ message: 'Gallery item deleted successfully', id: Number(id) });
  } catch (error: any) {
    console.error('Delete gallery item error:', error);
    return res.status(500).json({ message: 'Failed to delete gallery item' });
  }
});

// ==========================================
// 4. ORDERS (DELIVERY COMMANDS)
// ==========================================

// Submit new order (Public)
router.post('/orders', async (req: Request, res: Response) => {
  const { clientName, clientPhone, clientAddress, items } = req.body;

  if (!clientName || !clientPhone || !clientAddress || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Client details and non-empty items list are required' });
  }

  try {
    // Calculate total price based on products table to avoid client-side price tampering
    let totalPrice = 0;
    const enrichedItems = [];

    for (const item of items) {
      const prods = await query('SELECT * FROM products WHERE id = ?', [item.productId]);
      if (prods.length === 0) {
        return res.status(400).json({ message: `Product with ID ${item.productId} not found` });
      }
      const prod = prods[0];
      const quantity = Number(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid product quantity' });
      }

      totalPrice += prod.price * quantity;
      enrichedItems.push({
        productId: prod.id,
        name: prod.name,
        price: prod.price,
        quantity: quantity
      });
    }

    const itemsJson = JSON.stringify(enrichedItems);
    const createdAt = new Date().toISOString();
    const status = 'Pending';

    const result = await run(
      'INSERT INTO orders (clientName, clientPhone, clientAddress, itemsJson, totalPrice, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [clientName, clientPhone, clientAddress, itemsJson, totalPrice, status, createdAt]
    );

    return res.status(201).json({
      id: result.lastID,
      clientName,
      clientPhone,
      clientAddress,
      items: enrichedItems,
      totalPrice,
      status,
      createdAt
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Failed to submit order' });
  }
});

// Retrieve all orders (Admin only)
router.get('/orders', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await query('SELECT * FROM orders ORDER BY id DESC');
    // Parse itemsJson back to object
    const parsedOrders = orders.map(ord => ({
      ...ord,
      items: JSON.parse(ord.itemsJson)
    }));
    return res.json(parsedOrders);
  } catch (error: any) {
    console.error('Get orders error:', error);
    return res.status(500).json({ message: 'Failed to retrieve orders' });
  }
});

// Update order status (Admin only)
router.put('/orders/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const existing = await query('SELECT * FROM orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    
    return res.json({
      id: Number(id),
      status
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    return res.status(500).json({ message: 'Failed to update order status' });
  }
});

export default router;
