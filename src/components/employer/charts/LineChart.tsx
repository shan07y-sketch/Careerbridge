import React from 'react';

export interface ChartLine {
  id: string;
  points: string;
  color: string;
  dashed?: boolean;
  strokeWidth?: number;
  dots: Array<{ cx: number; cy: number; r: number }>;
}

interface LineChartProps {
  lines: ChartLine[];
  viewBox?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ lines, viewBox = "0 0 400 100" }) => {
  return (
    <svg className="w-full h-full" preserveAspectRatio="none" viewBox={viewBox}>
      {lines.map((line) => (
        <React.Fragment key={line.id}>
          <path
            d={line.points}
            fill="none"
            stroke={line.color}
            strokeDasharray={line.dashed ? "4" : undefined}
            strokeLinecap="round"
            strokeWidth={line.strokeWidth || 2}
          />
          {line.dots.map((dot, idx) => (
            <circle
              key={idx}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill={line.color}
            />
          ))}
        </React.Fragment>
      ))}
    </svg>
  );
};
export default LineChart;
