import { useState, useEffect, useCallback, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Article } from './types';
import ArticleCard from './components/ArticleCard';
import Controls from './components/Controls';
import LoadingIndicator from './components/LoadingIndicator';

function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Load initial batch of articles
  useEffect(() => {
    fetchArticles();
  }, []);

  // Fetch articles from API
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/random/batch?count=5');

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      // Add new articles to the end of the list
      setArticles((current) => [...current, ...data]);

      // If this is initial load, set isInitialLoad to false
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  // Load more articles when we're 2 articles away from the end
  useEffect(() => {
    if (
      currentIndex >= articles.length - 2 &&
      !loading &&
      articles.length > 0
    ) {
      fetchArticles();
    }
  }, [currentIndex, articles.length, loading]);

  // Handle navigation
  const goToNext = useCallback(() => {
    if (currentIndex < articles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, articles.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedUp: goToNext,
    onSwipedDown: goToPrevious,
    trackMouse: true,
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        goToPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNext, goToPrevious]);

  // Handle mouse wheel scrolling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent default scrolling behavior
      e.preventDefault();

      // Clear any existing timeout
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }

      // Debounce scroll events to prevent rapid navigation
      scrollTimeoutRef.current = window.setTimeout(() => {
        // deltaY > 0 means scrolling down
        if (e.deltaY > 0) {
          goToNext();
        }
        // deltaY < 0 means scrolling up
        else if (e.deltaY < 0) {
          goToPrevious();
        }

        scrollTimeoutRef.current = null;
      }, 100); // 100ms debounce time
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      // Clear any existing timeout on component unmount
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [goToNext, goToPrevious]);

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          padding: '20px',
          textAlign: 'center',
          background: '#111',
        }}
      >
        <h2 style={{ color: '#f44336', marginBottom: '20px' }}>Error</h2>
        <p style={{ color: 'white', marginBottom: '20px' }}>{error}</p>
        <button
          onClick={fetchArticles}
          style={{
            background: '#f44336',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      {...handlers}
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#000',
        position: 'relative',
      }}
    >
      {isInitialLoad && loading ? (
        <LoadingIndicator />
      ) : (
        <>
          <div
            style={{
              position: 'relative',
              height: '100%',
              width: '100%',
            }}
          >
            {articles.map((article, index) => (
              <div
                key={`${article.id}-${index}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  transition: 'opacity 0.3s ease-in-out',
                  opacity: currentIndex === index ? 1 : 0,
                  pointerEvents: currentIndex === index ? 'auto' : 'none',
                  backgroundColor: '#000',
                }}
              >
                <ArticleCard
                  article={article}
                  isActive={currentIndex === index}
                />
              </div>
            ))}
          </div>

          <Controls
            onNext={goToNext}
            onPrevious={goToPrevious}
            hasNext={currentIndex < articles.length - 1}
            hasPrevious={currentIndex > 0}
            isLoading={loading}
          />

          {/* Loading indicator for subsequent loads */}
          {!isInitialLoad && loading && (
            <div
              style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '10px 20px',
                borderRadius: '20px',
                color: 'white',
                zIndex: 100,
              }}
            >
              Loading more articles...
            </div>
          )}
        </>
      )}

      {/* App header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          padding: '15px 20px',
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <h1 style={{ color: 'white', margin: 0, fontSize: '24px' }}>WikTok</h1>
      </header>
    </div>
  );
}

export default App;
