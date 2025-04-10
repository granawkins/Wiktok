import { useState } from 'react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  isActive: boolean;
}

const ArticleCard = ({ article, isActive }: ArticleCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
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
