import axios from 'axios';

// Interface for Wikipedia API response
interface WikipediaResponse {
  query?: {
    pages?: Record<string, WikipediaPage>;
    random?: { id: number; title: string }[];
  };
}

// Interface for Wikipedia page data
export interface WikipediaPage {
  pageid: number;
  ns: number;
  title: string;
  extract?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  pageimage?: string;
  fullurl?: string;
}

// Interface for our simplified article data
export interface Article {
  id: number;
  title: string;
  extract: string;
  thumbnail: string | null;
  url: string;
}

// Base URL for Wikipedia API
const API_BASE_URL = 'https://en.wikipedia.org/w/api.php';

/**
 * Get a random Wikipedia article
 */
export const getRandomArticle = async (): Promise<Article> => {
  try {
    // First get a random article title
    const randomResponse = await axios.get<WikipediaResponse>(API_BASE_URL, {
      params: {
        action: 'query',
        format: 'json',
        list: 'random',
        rnnamespace: 0, // Only get articles from the main namespace
        rnlimit: 1,
        origin: '*', // Required for CORS
      },
    });

    if (!randomResponse.data.query?.random?.[0]) {
      throw new Error('Failed to get random article');
    }

    const randomArticle = randomResponse.data.query.random[0];
    
    // Then get the content of that article
    const contentResponse = await axios.get<WikipediaResponse>(API_BASE_URL, {
      params: {
        action: 'query',
        format: 'json',
        prop: 'extracts|pageimages|info',
        pageids: randomArticle.id,
        explaintext: 1,
        exintro: 1, // Only get the intro section
        piprop: 'thumbnail',
        pithumbsize: 400,
        inprop: 'url',
        origin: '*', // Required for CORS
      },
    });

    const pages = contentResponse.data.query?.pages;
    if (!pages) {
      throw new Error('Failed to get article content');
    }

    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    // Format the response in our simplified Article format
    return {
      id: page.pageid,
      title: page.title,
      extract: page.extract || 'No extract available',
      thumbnail: page.thumbnail?.source || null,
      url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    };
  } catch (error) {
    console.error('Error fetching Wikipedia article:', error);
    throw error;
  }
};

/**
 * Get multiple random Wikipedia articles
 */
export const getRandomArticles = async (count: number = 5): Promise<Article[]> => {
  try {
    const articles: Article[] = [];
    
    // For simplicity, we'll make sequential requests
    // In a production app, these could be parallelized for better performance
    for (let i = 0; i < count; i++) {
      const article = await getRandomArticle();
      articles.push(article);
    }
    
    return articles;
  } catch (error) {
    console.error('Error fetching multiple Wikipedia articles:', error);
    throw error;
  }
};
