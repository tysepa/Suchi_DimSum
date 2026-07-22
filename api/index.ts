import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import router from './routes';
import { initializeDatabase } from './db';

// Load environment variables
dotenv.config();

const app = express();

// Setup Middleware
app.use(cors());
app.use(express.json());

// Serve static assets (images folder) for local dev fallback
app.use('/images', express.static(path.resolve(__dirname, '../public/images')));

// Database auto-initializer middleware
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
  next();
});

// Register API Routes
app.use('/api', router);

// Start listening if running outside Vercel (local node development)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  Golden Dragon Serverless Backend listening on port ${PORT}`);
      console.log(`  API Base URL: http://localhost:${PORT}/api        `);
      console.log(`====================================================`);
    });
  }).catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export default app;
