import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { Article } from '../types';

// Define mock articles for testing
const mockArticles: Article[] = [
  {
    id: 1,
    title: 'Test Article 1',
    extract: 'This is the first test article content',
    thumbnail: 'https://example.com/image1.jpg',
    url: 'https://en.wikipedia.org/wiki/Test_Article_1',
  },
  {
    id: 2,
    title: 'Test Article 2',
    extract: 'This is the second test article content',
    thumbnail: null,
    url: 'https://en.wikipedia.org/wiki/Test_Article_2',
  },
];

// Mock the fetch API
globalThis.fetch = vi.fn() as unknown as typeof fetch;

function mockFetchResponse(
  data: Article[] | { error: string; message: string }
) {
  return {
    json: vi.fn().mockResolvedValue(data),
    ok: true,
  };
}

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    (globalThis.fetch as unknown as Mock).mockResolvedValue(
      mockFetchResponse(mockArticles)
    );
  });

  it('renders WikTok app header correctly', () => {
    render(<App />);
    expect(screen.getByText('WikTok')).toBeInTheDocument();
  });

  it('shows loading indicator initially', async () => {
    render(<App />);

    // Should initially show loading message
    expect(screen.getByText(/Loading Wikipedia articles/)).toBeInTheDocument();

    // Wait for the fetch to resolve and check if the first article is displayed
    await waitFor(() => {
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/random/batch?count=5');
  });

  it('handles API error', async () => {
    // Mock a failed API call
    (globalThis.fetch as unknown as Mock).mockRejectedValue(
      new Error('API Error')
    );

    render(<App />);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });
});
