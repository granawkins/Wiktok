export interface Article {
  id: number;
  title: string;
  extract: string;
  thumbnail: string | null;
  url: string;
  source: 'random' | 'trending';
  views?: number; // Only available for trending articles
  rank?: number; // Only available for trending articles
}

export type ArticleSource = 'random' | 'trending';
