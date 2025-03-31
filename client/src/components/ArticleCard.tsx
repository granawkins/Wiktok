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

  // Badge colors based on article source
  const badgeColors = {
    trending: {
      background: 'rgba(255, 64, 129, 0.8)',
      text: 'white',
    },
    random: {
      background: 'rgba(33, 150, 243, 0.8)',
      text: 'white',
    },
  };

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
      {/* Gradient overlay to make text more readable */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)',
          zIndex: 1,
        }}
      />

      {/* Background image */}
      {article.thumbnail && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
          }}
        >
          <img
            src={article.thumbnail}
            alt={article.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* Source badge (trending/random) */}
      <div
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          zIndex: 3,
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          background: badgeColors[article.source].background,
          color: badgeColors[article.source].text,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {article.source === 'trending' ? (
          <>
            <span>🔥 Trending</span>
            {article.rank && (
              <span style={{ fontSize: '10px' }}>#{article.rank}</span>
            )}
          </>
        ) : (
          <>✨ Discover</>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '20px',
          overflow: 'auto',
          maxHeight: '70%',
        }}
      >
        <h2 style={{ marginBottom: '10px', fontSize: '24px' }}>
          {article.title}
        </h2>

        {/* Views counter for trending articles */}
        {article.views && article.source === 'trending' && (
          <div
            style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span>👁️</span>
            <span>{article.views.toLocaleString()} views yesterday</span>
          </div>
        )}

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
