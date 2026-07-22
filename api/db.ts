import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const isVercel = !!process.env.VERCEL;
let finalDbPath = path.resolve(__dirname, '../database.sqlite');

if (isVercel) {
  const tmpDbPath = '/tmp/database.sqlite';
  if (!fs.existsSync(tmpDbPath)) {
    try {
      fs.copyFileSync(finalDbPath, tmpDbPath);
      console.log('Successfully copied SQLite DB to /tmp for writing');
    } catch (err) {
      console.error('Failed to copy database to /tmp:', err);
    }
  }
  finalDbPath = tmpDbPath;
}

const db = new sqlite3.Database(finalDbPath);

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: 'sushi' | 'dimsum';
  imageUrl: string;
}

export interface GalleryItem {
  id: number;
  imageUrl: string;
  caption: string;
}

export interface Order {
  id: number;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  itemsJson: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

// Wrapper helper to run queries as Promises
export const query = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const run = (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const initializeDatabase = async () => {
  console.log('Initializing SQLite Database...');
  
  // Ensure the database file or its parent folder exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create tables
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      imageUrl TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imageUrl TEXT NOT NULL,
      caption TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientName TEXT NOT NULL,
      clientPhone TEXT NOT NULL,
      clientAddress TEXT NOT NULL,
      itemsJson TEXT NOT NULL,
      totalPrice REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      createdAt TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL
    )
  `);

  // Seed default Admin if not exists
  const admins = await query('SELECT * FROM admin WHERE username = ?', ['admin']);
  if (admins.length === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    await run('INSERT INTO admin (username, passwordHash) VALUES (?, ?)', ['admin', passwordHash]);
    console.log('Default admin seeded (username: admin, password: admin123)');
  }

  // Seed default Products if empty
  const productsCount = await query('SELECT COUNT(*) as count FROM products');
  const defaultProducts = [
    {
      name: "Chef Muami's Signature Sushi Platter",
      description: "Artisanal platter of fresh, hand-rolled sushi rolls, sashimi, and nigiri meticulously curated by Chef Muami.",
      price: 24.99,
      category: 'sushi',
      imageUrl: '/images/owner_sushi_platter.jpg'
    },
    {
      name: "Pan-Fried Gyoza Dumplings",
      description: "Gourmet pork and vegetable gyoza dumplings, pan-fried to a perfect golden crisp, served with our signature dipping sauce.",
      price: 12.50,
      category: 'dimsum',
      imageUrl: '/images/owner_dumplings.jpg'
    },
    {
      name: 'Premium Dragon Roll',
      description: 'Eel and cucumber inside, wrapped with sliced avocado on the outside, topped with sweet unagi sauce and sesame seeds.',
      price: 18.99,
      category: 'sushi',
      imageUrl: '/images/dragon_roll.png'
    },
    {
      name: 'Classic Salmon Nigiri Set',
      description: 'Six pieces of freshly sliced Atlantic salmon over hand-formed seasoned sushi rice, served with wasabi and pickled ginger.',
      price: 14.50,
      category: 'sushi',
      imageUrl: '/images/salmon_nigiri.png'
    },
    {
      name: 'Spicy Bluefin Tuna Roll',
      description: 'Minced spicy bluefin tuna, cucumber, and green onion, topped with spicy sriracha mayo and microgreens.',
      price: 16.00,
      category: 'sushi',
      imageUrl: '/images/spicy_tuna.png'
    },
    {
      name: 'Steamed Har Gow (Shrimp Dumplings)',
      description: 'Four delicate translucent pleated dumplings filled with plump seasoned shrimp, steamed to perfection.',
      price: 9.50,
      category: 'dimsum',
      imageUrl: '/images/har_gow.png'
    },
    {
      name: 'Premium Pork & Shrimp Shumai',
      description: 'Four open-faced steamed dumplings filled with minced pork, shrimp, and shiitake mushrooms, topped with orange crab roe.',
      price: 8.75,
      category: 'dimsum',
      imageUrl: '/images/shumai.png'
    },
    {
      name: 'Honey Glazed BBQ Pork Buns (Char Siu Bao)',
      description: 'Three fluffy, pillowy white steamed buns stuffed with savory, sweet barbecued pork.',
      price: 7.99,
      category: 'dimsum',
      imageUrl: '/images/char_siu_bao.png'
    }
  ];

  if (productsCount[0].count === 0) {
    console.log('Seeding default Sushi and Dim Sum products...');
    for (const prod of defaultProducts) {
      await run(
        'INSERT INTO products (name, description, price, category, imageUrl) VALUES (?, ?, ?, ?, ?)',
        [prod.name, prod.description, prod.price, prod.category, prod.imageUrl]
      );
    }
  } else {
    // If database already exists, make sure the new signature products are added
    console.log('Verifying if signature products are present...');
    for (const prod of defaultProducts) {
      const exists = await query('SELECT * FROM products WHERE imageUrl = ?', [prod.imageUrl]);
      if (exists.length === 0) {
        console.log(`Inserting signature product: ${prod.name}`);
        await run(
          'INSERT INTO products (name, description, price, category, imageUrl) VALUES (?, ?, ?, ?, ?)',
          [prod.name, prod.description, prod.price, prod.category, prod.imageUrl]
        );
      }
    }
  }

  // Seed default Gallery items if empty
  const galleryCount = await query('SELECT COUNT(*) as count FROM gallery');
  const defaultGallery = [
    {
      imageUrl: '/images/gallery_sushi_plating.png',
      caption: 'Master chef meticulously plating our signature premium sashimi platter.'
    },
    {
      imageUrl: '/images/gallery_dim_sum_steam.png',
      caption: 'Freshly steamed dim sum baskets served piping hot from the kitchen.'
    },
    {
      imageUrl: '/images/gallery_restaurant_interior.png',
      caption: 'Our modern, sleek dining hall designed for a premium dining atmosphere.'
    },
    {
      imageUrl: '/images/gallery_dim_sum_making.png',
      caption: 'Handcrafted dim sum prepared daily by our traditional chefs.'
    },
    // Chef Muami in Action photos
    {
      imageUrl: '/images/chef_fish.jpg',
      caption: 'Chef Muami inspecting fresh catches daily, selecting only the finest grade fish for our guests.'
    },
    {
      imageUrl: '/images/chef_fish_2.jpg',
      caption: 'Chef Muami Suleiman holding a freshly sourced giant grouper in our kitchen.'
    },
    {
      imageUrl: '/images/chef_team.jpg',
      caption: 'Chef Muami and his culinary team presenting our signature custom-crafted catering platters.'
    },
    {
      imageUrl: '/images/chef_kitchen_team.jpg',
      caption: 'Chef Muami Suleiman and his dedicated kitchen team preparing orders.'
    },
    {
      imageUrl: '/images/chef_pool_pose.jpg',
      caption: 'Culinary Director Chef Muami Suleiman posing outside the restaurant premises.'
    },
    {
      imageUrl: '/images/chef_angel_pose.jpg',
      caption: 'Chef Muami Suleiman standing tall as culinary director of Golden Dragon, merging traditional training with modern execution.'
    },
    {
      imageUrl: '/images/chef_skol_backdrop.jpg',
      caption: 'Chef Muami presenting signature appetizers at a premium corporate culinary event.'
    },
    {
      imageUrl: '/images/chef_angel_smile.jpg',
      caption: 'Culinary Director Chef Muami sharing his passion for authentic Pan-Asian flavors.'
    }
  ];

  if (galleryCount[0].count === 0) {
    console.log('Seeding default gallery items...');
    for (const item of defaultGallery) {
      await run('INSERT INTO gallery (imageUrl, caption) VALUES (?, ?)', [item.imageUrl, item.caption]);
    }
  } else {
    // If database already exists, make sure the new chef gallery photos are added
    console.log('Verifying if new chef gallery photos are present...');
    for (const item of defaultGallery) {
      const exists = await query('SELECT * FROM gallery WHERE imageUrl = ?', [item.imageUrl]);
      if (exists.length === 0) {
        console.log(`Inserting missing gallery item: ${item.imageUrl}`);
        await run('INSERT INTO gallery (imageUrl, caption) VALUES (?, ?)', [item.imageUrl, item.caption]);
      }
    }
  }

  console.log('Database initialization completed.');
};

export default db;
