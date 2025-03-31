import { ArticleSource } from '../types';

interface SourceToggleProps {
  currentSource: ArticleSource;
  onToggle: () => void;
  disabled: boolean;
}

const SourceToggle = ({
  currentSource,
  onToggle,
  disabled,
}: SourceToggleProps) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 100,
      }}
    >
      <button
        onClick={onToggle}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(5px)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '20px',
          padding: '8px 16px',
          fontSize: '14px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
        }}
        title="Toggle between random and trending articles (press 'T')"
      >
        {currentSource === 'trending' ? (
          <>
            <span role="img" aria-label="fire">
              🔥
            </span>
            <span>Trending</span>
          </>
        ) : (
          <>
            <span role="img" aria-label="sparkles">
              ✨
            </span>
            <span>Discover</span>
          </>
        )}
      </button>
    </div>
  );
};

export default SourceToggle;
