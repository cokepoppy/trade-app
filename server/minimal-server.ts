import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'trade-app-server',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'TypeScript Server is running!' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 TypeScript Server is running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
});