import React from 'react';

interface CareerChartProps {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  className?: string;
}

export const CareerChart: React.FC<CareerChartProps> = ({
  data = [
    { label: 'W1', value: 780 },
    { label: 'W2', value: 800 },
    { label: 'W3', value: 810 },
    { label: 'W4', value: 830 },
    { label: 'W5', value: 850 },
  ],
  width = 500,
  height = 200,
  className = '',
}) => {
  const padding = 35;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const minVal = Math.min(...data.map(d => d.value)) - 20;
  const maxVal = Math.max(...data.map(d => d.value)) + 20;
  const valRange = maxVal - minVal;

  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.value - minVal) / valRange) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + ratio * chartHeight;
          const val = Math.round(maxVal - ratio * valRange);
          return (
            <g key={ratio} className="opacity-40">
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="rgba(2, 54, 41, 0.05)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                className="fill-on-surface-variant font-label-sm"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        <path d={areaPath} fill="rgba(161, 209, 190, 0.08)" />

        {/* Path Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#3a6757"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points & Dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#023629"
              stroke="#ffffff"
              strokeWidth="1.5"
              className="hover:r-6 transition-all cursor-pointer"
            />
            {/* Label texts */}
            <text
              x={p.x}
              y={height - padding + 18}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              className="fill-on-surface-variant/80 font-label-sm"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
export default CareerChart;
