export interface Article {
  id: number;
  title: string;
  extract: string;
  thumbnail: string | null;
  url: string;
  isLiked?: boolean;
}
