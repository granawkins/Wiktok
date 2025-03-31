/**
 * Data models for the application
 */

export interface Article {
  id: number;
  title: string;
  extract: string;
  thumbnail: string | null;
  url: string;
  isLiked?: boolean; // Added for frontend use
}

export interface Like {
  articleId: number;
  likedAt: string; // ISO date string
}
