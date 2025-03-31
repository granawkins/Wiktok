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
 * Get random Wikipedia articles in a single batch request
 * This is much more efficient than multiple individual requests
 */
export const getRandomArticlesBatch = async (
  count: number = 5
): Promise<Article[]> => {
  try {
    console.time('batchFetch'); // For timing the request

    // Step 1: Get a batch of random article titles and IDs
    // Request more than needed to filter for ones with images
    const randomBatchSize = count * 2;
    const randomResponse = await axios.get<WikipediaResponse>(API_BASE_URL, {
      params: {
        action: 'query',
        format: 'json',
        list: 'random',
        rnnamespace: 0, // Only articles from main namespace
        rnlimit: randomBatchSize,
        origin: '*', // Required for CORS
      },
    });

    if (
      !randomResponse.data.query?.random ||
      randomResponse.data.query.random.length === 0
    ) {
      throw new Error('Failed to get random articles');
    }

    const randomArticles = randomResponse.data.query.random;

    // Step 2: Get content for all random articles in a single request
    // Using pipe-separated list of page IDs
    const pageIds = randomArticles.map((article) => article.id).join('|');

    const contentResponse = await axios.get<WikipediaResponse>(API_BASE_URL, {
      params: {
        action: 'query',
        format: 'json',
        prop: 'extracts|pageimages|info',
        pageids: pageIds,
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

    // Process all pages and convert to our Article format
    const articles: Article[] = [];

    for (const pageId in pages) {
      const page = pages[pageId];

      // Only include articles with thumbnails/images
      if (page.thumbnail?.source) {
        articles.push({
          id: page.pageid,
          title: page.title,
          extract: page.extract || 'No extract available',
          thumbnail: page.thumbnail.source,
          url:
            page.fullurl ||
            `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
        });
      }
    }

    console.timeEnd('batchFetch');
    console.log(
      `Fetched ${articles.length} articles with images out of ${randomBatchSize} random articles.`
    );

    // Return only the requested number of articles
    return articles.slice(0, count);
  } catch (error) {
    console.error('Error fetching Wikipedia articles in batch:', error);
    throw error;
  }
};

/**
 * Get a random Wikipedia article
 * Note: This is kept for backward compatibility, but getRandomArticlesBatch
 * should be used for better performance when possible
 */
export const getRandomArticle = async (): Promise<Article> => {
  // Get a batch of 1 article
  const articles = await getRandomArticlesBatch(1);

  if (articles.length === 0) {
    throw new Error('Failed to get a random article with an image');
  }

  return articles[0];
};

/**
 * Get a random Wikipedia article with an image
 * This is now just an alias for getRandomArticle since the batch function
 * already filters for images
 */
export const getRandomArticleWithImage = async (): Promise<Article> => {
  return getRandomArticle();
};

/**
 * Get multiple random Wikipedia articles, all with images
 * This now uses the more efficient batch approach
 */
export const getRandomArticles = async (
  count: number = 5
): Promise<Article[]> => {
  try {
    // First try getting exactly what we need with the optimized batch method
    let articles = await getRandomArticlesBatch(count);

    // If we didn't get enough articles, make additional requests as needed
    if (articles.length < count) {
      console.log(
        `Only got ${articles.length} articles on first batch, fetching more...`
      );

      // Fetch more to make up the difference
      const additionalArticles = await getRandomArticlesBatch(
        count - articles.length
      );
      articles = [...articles, ...additionalArticles];
    }

    // In the unlikely case we still don't have enough articles, log a warning
    if (articles.length < count) {
      console.warn(
        `Could only find ${articles.length} articles with images out of ${count} requested`
      );
    }

    return articles;
  } catch (error) {
    console.error('Error fetching multiple Wikipedia articles:', error);
    throw error;
  }
};
