import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import {
  getRandomArticle,
  getRandomArticles,
} from './services/wikipediaService';

export const app = express();
export const PORT = process.env.PORT || 5000;
export const CLIENT_DIST_PATH = path.join(__dirname, '../../client/dist');

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON bodies
app.use(express.static(CLIENT_DIST_PATH)); // Serve static files from client/dist

// API routes
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the WikTok API!' });
});

// Get a random Wikipedia article
app.get('/api/random', async (req: Request, res: Response) => {
  try {
    const article = await getRandomArticle();
    res.json(article);
  } catch (error) {
    console.error('Error handling /api/random request:', error);
    res.status(500).json({
      error: 'Failed to fetch Wikipedia article',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get multiple random Wikipedia articles
app.get('/api/random/batch', async (req: Request, res: Response) => {
  try {
    const count = req.query.count ? parseInt(req.query.count as string) : 5;
    // Limit the count to prevent abuse
    const limitedCount = Math.min(count, 10);

    const articles = await getRandomArticles(limitedCount);
    res.json(articles);
  } catch (error) {
    console.error('Error handling /api/random/batch request:', error);
    res.status(500).json({
      error: 'Failed to fetch Wikipedia articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Serve React app for any other routes
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(CLIENT_DIST_PATH, 'index.html'));
});
