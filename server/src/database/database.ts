import sqlite3 from 'sqlite3';
import { Article } from './models';
import path from 'path';

// Define types for database rows and parameters
type SqlParams = (string | number | null)[];

interface ArticleRow {
  id: number;
  title: string;
  extract: string;
  thumbnail: string | null;
  url: string;
  is_liked?: number;
}

interface LikeRow {
  article_id: number;
}

// Set up database path - store in the server root directory
const DB_PATH = path.join(__dirname, '..', '..', 'wiktok.db');

// Open SQLite database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    // Create tables when connected
    createTables();
  }
});

// Promise wrappers for database operations
function runAsync(
  sql: string,
  params: SqlParams = []
): Promise<sqlite3.RunResult> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getAsync<T = Record<string, unknown>>(
  sql: string,
  params: SqlParams = []
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
}

function allAsync<T = Record<string, unknown>>(
  sql: string,
  params: SqlParams = []
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

// Create necessary tables if they don't exist
async function createTables(): Promise<void> {
  try {
    // Create articles table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        extract TEXT NOT NULL,
        thumbnail TEXT,
        url TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Create likes table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS likes (
        article_id INTEGER PRIMARY KEY,
        liked_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables created or already exist');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// Save an article to the database if it doesn't exist
export async function saveArticle(article: Article): Promise<number> {
  try {
    // Check if article already exists
    const existingArticle = await getAsync<{ id: number }>(
      'SELECT id FROM articles WHERE id = ?',
      [article.id]
    );

    if (existingArticle) {
      return article.id;
    }

    // Insert new article
    await runAsync(
      `INSERT INTO articles (id, title, extract, thumbnail, url)
       VALUES (?, ?, ?, ?, ?)`,
      [
        article.id,
        article.title,
        article.extract,
        article.thumbnail,
        article.url,
      ]
    );

    return article.id;
  } catch (error) {
    console.error('Error saving article:', error);
    throw error;
  }
}

// Save multiple articles at once
export async function saveArticles(articles: Article[]): Promise<void> {
  for (const article of articles) {
    await saveArticle(article);
  }
}

// Get article by ID with like status
export async function getArticleById(id: number): Promise<Article | null> {
  try {
    const article = await getAsync<ArticleRow>(
      `SELECT a.*, 
        CASE WHEN l.article_id IS NOT NULL THEN 1 ELSE 0 END as is_liked
       FROM articles a
       LEFT JOIN likes l ON a.id = l.article_id
       WHERE a.id = ?`,
      [id]
    );

    if (!article) {
      return null;
    }

    return {
      id: article.id,
      title: article.title,
      extract: article.extract,
      thumbnail: article.thumbnail,
      url: article.url,
      isLiked: article.is_liked === 1,
    };
  } catch (error) {
    console.error('Error getting article by ID:', error);
    throw error;
  }
}

// Like an article
export async function likeArticle(articleId: number): Promise<void> {
  try {
    // First, ensure the article exists
    const article = await getArticleById(articleId);
    if (!article) {
      throw new Error(`Article with ID ${articleId} not found`);
    }

    // Check if already liked
    const existingLike = await getAsync<LikeRow>(
      'SELECT article_id FROM likes WHERE article_id = ?',
      [articleId]
    );

    if (!existingLike) {
      // Add to likes table
      await runAsync('INSERT INTO likes (article_id) VALUES (?)', [articleId]);
    }
  } catch (error) {
    console.error('Error liking article:', error);
    throw error;
  }
}

// Unlike an article
export async function unlikeArticle(articleId: number): Promise<void> {
  try {
    await runAsync('DELETE FROM likes WHERE article_id = ?', [articleId]);
  } catch (error) {
    console.error('Error unliking article:', error);
    throw error;
  }
}

// Get all liked articles
export async function getLikedArticles(): Promise<Article[]> {
  try {
    const articles = await allAsync<ArticleRow>(
      `SELECT a.*
       FROM articles a
       JOIN likes l ON a.id = l.article_id
       ORDER BY l.liked_at DESC`
    );

    return articles.map((article) => ({
      id: article.id,
      title: article.title,
      extract: article.extract,
      thumbnail: article.thumbnail,
      url: article.url,
      isLiked: true,
    }));
  } catch (error) {
    console.error('Error getting liked articles:', error);
    throw error;
  }
}

// Check if an article is liked
export async function isArticleLiked(articleId: number): Promise<boolean> {
  try {
    const like = await getAsync<LikeRow>(
      'SELECT article_id FROM likes WHERE article_id = ?',
      [articleId]
    );
    return !!like;
  } catch (error) {
    console.error('Error checking if article is liked:', error);
    throw error;
  }
}

// Update articles with their like status
export async function addLikeStatusToArticles(
  articles: Article[]
): Promise<Article[]> {
  try {
    // Get all liked article IDs
    const likedArticles = await allAsync<LikeRow>(
      'SELECT article_id FROM likes'
    );
    const likedIds = new Set(likedArticles.map((like) => like.article_id));

    // Add like status to each article
    return articles.map((article) => ({
      ...article,
      isLiked: likedIds.has(article.id),
    }));
  } catch (error) {
    console.error('Error adding like status to articles:', error);
    return articles; // Return original articles if there's an error
  }
}

// Close database when the application is shutting down
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

export default db;
