import axios from 'axios';

// Interface for Wikipedia API response
interface WikipediaResponse {
  query?: {
    pages?: Record<string, WikipediaPage>;
    random?: { id: number; title: string }[];
  };
}

// Interface for Wikimedia Pageviews API response
interface PageviewsResponse {
  items?: {
    articles: {
      article: string;
      views: number;
      rank: number;
    }[];
  }[];
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
  source: 'random' | 'trending'; // Indicates where the article came from
  views?: number; // Number of views (for trending articles)
  rank?: number; // Popularity rank (for trending articles)
}

// Base URLs for APIs
const API_BASE_URL = 'https://en.wikipedia.org/w/api.php';
const WIKIMEDIA_PAGEVIEWS_API_URL =
  'https://wikimedia.org/api/rest_v1/metrics/pageviews/top';

// Minimum extract length for quality filtering (in characters)
const MIN_EXTRACT_LENGTH = 200;

/**
 * Get a random Wikipedia article with quality filters
 */
export const getRandomArticle = async (
  requireThumbnail: boolean = false,
  minExtractLength: number = MIN_EXTRACT_LENGTH
): Promise<Article> => {
  try {
    let attemptCount = 0;
    const maxAttempts = 5; // Limit how many times we try to get a quality article

    while (attemptCount < maxAttempts) {
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
          prop: 'extracts|pageimages|info|categories',
          pageids: randomArticle.id,
          explaintext: 1,
          exintro: 1, // Only get the intro section
          piprop: 'thumbnail',
          pithumbsize: 400,
          inprop: 'url',
          cllimit: 5, // Get up to 5 categories
          origin: '*', // Required for CORS
        },
      });

      const pages = contentResponse.data.query?.pages;
      if (!pages) {
        throw new Error('Failed to get article content');
      }

      const pageId = Object.keys(pages)[0];
      const page = pages[pageId];

      // Apply quality filters
      const extract = page.extract || '';
      const hasThumbnail = !!page.thumbnail?.source;

      // Skip if it doesn't meet our quality criteria
      if (
        (requireThumbnail && !hasThumbnail) ||
        extract.length < minExtractLength ||
        page.title.includes('List of') || // Skip list articles
        page.title.includes('disambiguation')
      ) {
        // Skip disambiguation pages
        attemptCount++;
        continue;
      }

      // Format the response in our simplified Article format
      return {
        id: page.pageid,
        title: page.title,
        extract: extract || 'No extract available',
        thumbnail: page.thumbnail?.source || null,
        url:
          page.fullurl ||
          `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
        source: 'random',
      };
    }

    // If we've tried several times but couldn't find a quality article, return what we have
    throw new Error(
      'Could not find a random article that meets quality criteria'
    );
  } catch (error) {
    console.error('Error fetching quality random Wikipedia article:', error);
    throw error;
  }
};

/**
 * Get a random Wikipedia article with an image
 */
export const getRandomArticleWithImage = async (): Promise<Article> => {
  // This is just a wrapper around getRandomArticle with requireThumbnail=true
  return getRandomArticle(true);
};

/**
 * Get multiple random Wikipedia articles with quality filters
 */
export const getRandomArticles = async (
  count: number = 5,
  requireThumbnail: boolean = false,
  minExtractLength: number = MIN_EXTRACT_LENGTH
): Promise<Article[]> => {
  try {
    const articles: Article[] = [];
    const promises: Promise<Article>[] = [];

    // Create promises for parallel fetching
    for (let i = 0; i < count; i++) {
      promises.push(getRandomArticle(requireThumbnail, minExtractLength));
    }

    // Wait for all promises to resolve
    const results = await Promise.allSettled(promises);

    // Process the results
    for (const result of results) {
      if (result.status === 'fulfilled') {
        articles.push(result.value);
      } else {
        console.error('Failed to fetch an article:', result.reason);
      }
    }

    // If we didn't get enough articles, try to fetch more with relaxed criteria
    if (articles.length < count) {
      const remaining = count - articles.length;
      const additionalArticles = await getRandomArticles(remaining, false, 0);
      articles.push(...additionalArticles);
    }

    return articles;
  } catch (error) {
    console.error('Error fetching multiple Wikipedia articles:', error);
    throw error;
  }
};

/**
 * Get trending Wikipedia articles based on pageviews
 */
export const getTrendingArticles = async (
  count: number = 5
): Promise<Article[]> => {
  try {
    // Get current date for API call (using yesterday to ensure data availability)
    const date = new Date();
    date.setDate(date.getDate() - 1); // Use yesterday's data as it's more likely to be complete

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Fetch most viewed pages from the Wikimedia Pageviews API
    const pageviewsUrl = `${WIKIMEDIA_PAGEVIEWS_API_URL}/en.wikipedia/all-access/${year}/${month}/${day}`;
    const pageviewsResponse = await axios.get<PageviewsResponse>(pageviewsUrl);

    // Ensure we have data
    if (!pageviewsResponse.data.items?.[0]?.articles) {
      throw new Error('No trending articles found');
    }

    // Extract the top articles (excluding Main_Page and Special pages)
    const topArticles = pageviewsResponse.data.items[0].articles
      .filter(
        (item) =>
          !item.article.startsWith('Special:') &&
          !item.article.startsWith('Main_Page') &&
          !item.article.includes('File:')
      )
      .slice(0, count * 2); // Get extra articles in case some don't have proper content

    // Now fetch the content for each trending article
    const articlesWithContent: Article[] = [];

    // Create a batch of page titles to fetch
    const titles = topArticles.map((article) => article.article).join('|');

    // Fetch content for these articles
    const contentResponse = await axios.get<WikipediaResponse>(API_BASE_URL, {
      params: {
        action: 'query',
        format: 'json',
        prop: 'extracts|pageimages|info',
        titles: titles,
        explaintext: 1,
        exintro: 1,
        piprop: 'thumbnail',
        pithumbsize: 400,
        inprop: 'url',
        origin: '*',
      },
    });

    if (!contentResponse.data.query?.pages) {
      throw new Error('Failed to get trending article content');
    }

    // Process each page in the response
    const pages = contentResponse.data.query.pages;

    for (const pageId in pages) {
      const page = pages[pageId];

      // Find matching article from pageviews data
      const pageviewData = topArticles.find(
        (article) => article.article === page.title.replace(/ /g, '_')
      );

      if (pageviewData) {
        // Skip articles with very short extracts
        if (page.extract && page.extract.length < MIN_EXTRACT_LENGTH) {
          continue;
        }

        articlesWithContent.push({
          id: page.pageid,
          title: page.title,
          extract: page.extract || 'No extract available',
          thumbnail: page.thumbnail?.source || null,
          url:
            page.fullurl ||
            `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
          source: 'trending',
          views: pageviewData.views,
          rank: pageviewData.rank,
        });

        // Stop once we have enough articles
        if (articlesWithContent.length >= count) {
          break;
        }
      }
    }

    return articlesWithContent;
  } catch (error) {
    console.error('Error fetching trending Wikipedia articles:', error);
    throw error;
  }
};
