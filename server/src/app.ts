import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import {
  getRandomArticle,
  getRandomArticles,
} from './services/wikipediaService';
import {
  saveArticle,
  saveArticles,
  likeArticle,
  unlikeArticle,
  getLikedArticles,
  getArticleById,
  addLikeStatusToArticles,
} from './database/database';

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
    const requireImage = req.query.requireImage === 'true';

    let article;
    if (requireImage) {
      // Import the getRandomArticleWithImage function from wikipediaService
      const { getRandomArticleWithImage } = await import(
        './services/wikipediaService.js'
      );
      article = await getRandomArticleWithImage();
    } else {
      article = await getRandomArticle();
    }

    // Save article to the database
    await saveArticle(article);

    // Check if article is liked
    const articleWithLikeStatus = await getArticleById(article.id);

    res.json(articleWithLikeStatus || article);
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

    // Save articles to the database
    await saveArticles(articles);

    // Add like status to articles
    const articlesWithLikeStatus = await addLikeStatusToArticles(articles);

    res.json(articlesWithLikeStatus);
  } catch (error) {
    console.error('Error handling /api/random/batch request:', error);
    res.status(500).json({
      error: 'Failed to fetch Wikipedia articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all liked articles - must be defined before the parameterized routes
app.get('/api/articles/liked', async (req: Request, res: Response) => {
  try {
    const likedArticles = await getLikedArticles();
    res.status(200).json(likedArticles);
  } catch (error) {
    console.error('Error getting liked articles:', error);
    res.status(500).json({
      error: 'Failed to get liked articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Like an article
app.post('/api/articles/:id/like', async (req: Request, res: Response) => {
  try {
    const articleId = parseInt(req.params.id);

    if (isNaN(articleId)) {
      res.status(400).json({ error: 'Invalid article ID' });
      return;
    }

    await likeArticle(articleId);

    const updatedArticle = await getArticleById(articleId);

    if (!updatedArticle) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.status(200).json(updatedArticle);
  } catch (error) {
    console.error('Error liking article:', error);
    res.status(500).json({
      error: 'Failed to like article',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Unlike an article
app.delete('/api/articles/:id/like', async (req: Request, res: Response) => {
  try {
    const articleId = parseInt(req.params.id);

    if (isNaN(articleId)) {
      res.status(400).json({ error: 'Invalid article ID' });
      return;
    }

    await unlikeArticle(articleId);

    const updatedArticle = await getArticleById(articleId);

    if (!updatedArticle) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.status(200).json(updatedArticle);
  } catch (error) {
    console.error('Error unliking article:', error);
    res.status(500).json({
      error: 'Failed to unlike article',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Serve React app for any other routes
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(CLIENT_DIST_PATH, 'index.html'));
});
