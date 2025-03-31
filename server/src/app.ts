import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import {
  getRandomArticle,
  getRandomArticles,
  getTrendingArticles,
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

// Get a random Wikipedia article with quality filtering
app.get('/api/random', async (req: Request, res: Response) => {
  try {
    const requireThumbnail =
      req.query.requireThumbnail === 'true' ||
      req.query.requireImage === 'true';
    const minExtractLength = req.query.minExtractLength
      ? parseInt(req.query.minExtractLength as string)
      : 200;

    const article = await getRandomArticle(requireThumbnail, minExtractLength);
    res.json(article);
  } catch (error) {
    console.error('Error handling /api/random request:', error);
    res.status(500).json({
      error: 'Failed to fetch Wikipedia article',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get multiple random Wikipedia articles with quality filtering
app.get('/api/random/batch', async (req: Request, res: Response) => {
  try {
    const count = req.query.count ? parseInt(req.query.count as string) : 5;
    // Limit the count to prevent abuse
    const limitedCount = Math.min(count, 10);

    const requireThumbnail =
      req.query.requireThumbnail === 'true' ||
      req.query.requireImage === 'true';
    const minExtractLength = req.query.minExtractLength
      ? parseInt(req.query.minExtractLength as string)
      : 200;

    const articles = await getRandomArticles(
      limitedCount,
      requireThumbnail,
      minExtractLength
    );

    res.json(articles);
  } catch (error) {
    console.error('Error handling /api/random/batch request:', error);
    res.status(500).json({
      error: 'Failed to fetch Wikipedia articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get trending Wikipedia articles based on pageviews
app.get('/api/trending', async (req: Request, res: Response) => {
  try {
    const count = req.query.count ? parseInt(req.query.count as string) : 5;
    // Limit the count to prevent abuse
    const limitedCount = Math.min(count, 10);

    const articles = await getTrendingArticles(limitedCount);
    res.json(articles);
  } catch (error) {
    console.error('Error handling /api/trending request:', error);
    res.status(500).json({
      error: 'Failed to fetch trending Wikipedia articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get articles based on source (random or trending)
app.get('/api/articles', async (req: Request, res: Response) => {
  try {
    const source = (req.query.source as string) || 'random';
    const count = req.query.count ? parseInt(req.query.count as string) : 5;
    const limitedCount = Math.min(count, 10);

    let articles;

    if (source === 'trending') {
      articles = await getTrendingArticles(limitedCount);
    } else {
      // For random articles, apply quality filters
      const requireThumbnail =
        req.query.requireThumbnail === 'true' ||
        req.query.requireImage === 'true';
      const minExtractLength = req.query.minExtractLength
        ? parseInt(req.query.minExtractLength as string)
        : 200;

      articles = await getRandomArticles(
        limitedCount,
        requireThumbnail,
        minExtractLength
      );
    }

    res.json(articles);
  } catch (error) {
    console.error('Error handling /api/articles request:', error);
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
