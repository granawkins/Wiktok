export interface Article {
  id: number;
  title: string;
  extract: string;
  thumbnail: string | null;
  url: string;
  source: 'random' | 'trending'; // Indicates where the article came from
  views?: number; // Number of views (for trending articles)
  rank?: number; // Popularity rank (for trending articles)
}

export type ArticleSource = 'random' | 'trending';
