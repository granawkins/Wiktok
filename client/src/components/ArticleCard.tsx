import { useState } from 'react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  isActive: boolean;
  onLikeToggle?: (articleId: number, isLiked: boolean) => Promise<void>;
}

const ArticleCard = ({ article, isActive, onLikeToggle }: ArticleCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(article.isLiked || false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleLikeToggle = async () => {
    if (!onLikeToggle || isLikeLoading) return;

    setIsLikeLoading(true);

    try {
      // Update the local state optimistically
      const newLikeState = !isLiked;
      setIsLiked(newLikeState);

      // Call the parent handler to update the backend
      await onLikeToggle(article.id, newLikeState);
    } catch (error) {
      // Revert on error
      console.error('Error toggling like:', error);
      setIsLiked(isLiked);
    } finally {
      setIsLikeLoading(false);
    }
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
      {/* Background image (no gradient overlay) */}
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
          <img
            src={article.thumbnail}
            alt={article.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain', // Fill entire container while maintaining aspect ratio
            }}
          />
        </div>
      )}

      {/* Like button (positioned in top-right corner) */}
      <button
        onClick={handleLikeToggle}
        disabled={isLikeLoading}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.5)',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: isLiked ? '#ff4057' : '#FFFFFF',
          cursor: isLikeLoading ? 'wait' : 'pointer',
          transition: 'transform 0.2s, color 0.2s',
          transform: isLiked ? 'scale(1.1)' : 'scale(1)',
          opacity: isActive ? 1 : 0,
        }}
        aria-label={isLiked ? 'Unlike article' : 'Like article'}
      >
        {isLikeLoading ? '...' : '❤'}
      </button>

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

        <div
          style={{
            marginTop: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
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

          {/* Mobile-friendly like button that appears in content area */}
          <button
            onClick={handleLikeToggle}
            disabled={isLikeLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: isLiked
                ? 'rgba(255, 64, 87, 0.2)'
                : 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: isLiked ? '#ff4057' : 'white',
              padding: '8px 15px',
              borderRadius: '20px',
              fontSize: '14px',
              cursor: isLikeLoading ? 'wait' : 'pointer',
            }}
          >
            <span style={{ fontSize: '16px' }}>❤</span>
            {isLiked ? 'Liked' : 'Like'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
