import React from 'react';

interface BarChartProps {
  data: number[];
  color?: string;
  height?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  color = 'bg-primary',
  height = 'h-10',
}) => {
  return (
    <div className={`mt-4 flex gap-1 ${height} items-end w-full`}>
      {data.map((val, idx) => {
        const isLast = idx === data.length - 1;
        const opacityClass = isLast ? '' : 'opacity-20';
        return (
          <div
            key={idx}
            className={`flex-grow ${color} rounded-sm transition-all ${opacityClass}`}
            style={{ height: `${val}%` }}
          />
        );
      })}
    </div>
  );
};
export default BarChart;
