import { useSwipeable } from 'react-swipeable';

interface ControlsProps {
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  isLoading: boolean;
}

const Controls = ({
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  isLoading,
}: ControlsProps) => {
  const handlers = useSwipeable({
    onSwipedUp: onNext,
    onSwipedDown: onPrevious,
    // Updated to use the correct property
    trackMouse: true,
  });

  const buttonStyle = {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    cursor: 'pointer',
    outline: 'none',
    backdropFilter: 'blur(5px)',
    margin: '10px',
    transition: 'background-color 0.2s',
    opacity: isLoading ? 0.5 : 1,
    pointerEvents: isLoading ? ('none' as const) : ('auto' as const),
  };

  return (
    <div
      {...handlers}
      style={{
        position: 'fixed',
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
      }}
    >
      <button
        onClick={onPrevious}
        disabled={!hasPrevious || isLoading}
        style={{
          ...buttonStyle,
          opacity: !hasPrevious || isLoading ? 0.3 : 1,
        }}
        aria-label="Previous article"
      >
        ↑
      </button>
      <button
        onClick={onNext}
        disabled={!hasNext || isLoading}
        style={{
          ...buttonStyle,
          opacity: !hasNext || isLoading ? 0.3 : 1,
        }}
        aria-label="Next article"
      >
        ↓
      </button>
    </div>
  );
};

export default Controls;
