import React from 'react';

interface AIChartProps {
  metrics: {
    communication: number;
    technical: number;
    problemSolving: number;
    confidence: number;
    behavioral: number;
  };
  size?: number;
  className?: string;
}

export const AIChart: React.FC<AIChartProps> = ({
  metrics,
  size = 300,
  className = '',
}) => {
  const center = size / 2;
  const radius = size * 0.35;
  const labels = ['Communication', 'Technical', 'Problem Solving', 'Confidence', 'Behavioral'];
  const values = [
    metrics.communication,
    metrics.technical,
    metrics.problemSolving,
    metrics.confidence,
    metrics.behavioral,
  ];

  // Calculate coordinates for a regular pentagon
  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 / 5) * index - Math.PI / 2;
    const r = radius * (value / 100);
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Outer polygon background guides
  const renderGuides = () => {
    return [0.25, 0.5, 0.75, 1].map((scale) => {
      const points = Array.from({ length: 5 })
        .map((_, i) => {
          const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
          const x = center + (radius * scale) * Math.cos(angle);
          const y = center + (radius * scale) * Math.sin(angle);
          return `${x},${y}`;
        })
        .join(' ');

      return (
        <polygon
          key={scale}
          points={points}
          fill="none"
          stroke="rgba(2, 54, 41, 0.08)"
          strokeWidth="1"
        />
      );
    });
  };

  // Coordinates of the values
  const valuePoints = values.map((val, i) => getCoordinates(val, i));
  const polygonPointsStr = valuePoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Guides */}
        {renderGuides()}
        
        {/* Web Axes lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const outerPoint = getCoordinates(100, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outerPoint.x}
              y2={outerPoint.y}
              stroke="rgba(2, 54, 41, 0.08)"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPointsStr}
          fill="rgba(2, 54, 41, 0.12)"
          stroke="#023629"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Value dot markers */}
        {valuePoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill="#3a6757"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        ))}

        {/* Labels text */}
        {labels.map((label, i) => {
          const outerPoint = getCoordinates(115, i);
          // Text anchoring adjustments
          let textAnchor: 'inherit' | 'middle' | 'start' | 'end' | undefined = 'middle';
          if (i === 1 || i === 2) textAnchor = 'start';
          if (i === 3 || i === 4) textAnchor = 'end';
          
          return (
            <text
              key={i}
              x={outerPoint.x}
              y={outerPoint.y + 4}
              fontSize="10"
              fontWeight="bold"
              className="fill-on-surface-variant uppercase tracking-wider font-label-sm"
              textAnchor={textAnchor}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
export default AIChart;
