import { useState, useEffect, useRef } from 'react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  isActive: boolean;
}

const ArticleCard = ({ article, isActive }: ArticleCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset image load state when article changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [article.id]);

  // Start loading image when component becomes active or visible
  useEffect(() => {
    if (isActive && article.thumbnail && imageRef.current) {
      // If image is already in cache, it might be loaded immediately
      if (imageRef.current.complete) {
        setImageLoaded(true);
      }
    }
  }, [isActive, article.thumbnail]);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleImageLoad = () => {
    console.log(`Image loaded for article: ${article.title}`);
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.error(`Failed to load image for article: ${article.title}`);
    setImageError(true);
  };

  const extractPreview =
    article.extract.length > 300 && !expanded
      ? `${article.extract.substring(0, 300)}...`
      : article.extract;

  return (
    <div
      className={`article-card ${isActive ? 'active' : ''}`}
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        color: 'white',
        opacity: isActive ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      {/* Background image with lazy loading and placeholder */}
      {article.thumbnail && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            backgroundColor: '#000', // Dark background for areas not covered by image
            overflow: 'hidden', // Ensure content stays within bounds
          }}
        >
          {/* Placeholder with shimmer effect while image loads */}
          {!imageLoaded && !imageError && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background:
                  'linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 50%, #1e1e1e 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                opacity: 0.7,
              }}
            />
          )}
          <style>
            {`
              @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
              }
            `}
          </style>

          {/* Actual image */}
          <img
            ref={imageRef}
            src={article.thumbnail}
            alt={article.title}
            loading={isActive ? 'eager' : 'lazy'} // Use eager loading for active card
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain', // Fill entire container while maintaining aspect ratio
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
          />
        </div>
      )}

      {/* Content with its own background for readability */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '20px',
          overflow: 'auto',
          maxHeight: expanded ? '80%' : '70%',
          background:
            'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.5) 100%)',
          borderRadius: '10px 10px 0 0',
          transition: 'max-height 0.3s ease-in-out, padding 0.3s ease-in-out',
        }}
      >
        <h2 style={{ marginBottom: '10px', fontSize: '24px' }}>
          {article.title}
        </h2>
        <p style={{ fontSize: '16px', lineHeight: '1.5' }}>{extractPreview}</p>

        {article.extract.length > 300 && (
          <button
            onClick={toggleExpanded}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#4dabf7',
              padding: '8px 0',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        <div style={{ marginTop: '15px' }}>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              color: 'white',
              textDecoration: 'none',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 15px',
              borderRadius: '20px',
              fontSize: '14px',
            }}
          >
            Read on Wikipedia
          </a>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
