import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import router from './routes';
import { initializeDatabase } from './db';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Middleware
app.use(cors());
app.use(express.json());

// Serve static assets (images folder)
app.use(express.static(path.resolve(__dirname, '../public')));

// Serve frontend build static files
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Register Routes
app.use('/api', router);

// Serve frontend index.html for any other non-API routes (SPA fallback)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  }
});


// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start Server after initializing database
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  SUSHI & DIM SUM BACKEND RUNNING ON PORT ${PORT} `);
      console.log(`  API Base URL: http://localhost:${PORT}/api        `);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to initialize database and start server:', error);
    process.exit(1);
  }
};

startServer();
