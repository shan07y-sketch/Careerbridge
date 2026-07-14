import React from 'react';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  legend?: React.ReactNode;
  yAxisLabels?: string[];
  xAxisLabels?: string[];
  children: React.ReactNode;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  legend,
  yAxisLabels = ['500', '250', '0'],
  xAxisLabels,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-white p-6 rounded-3xl border border-primary/5 shadow-sm text-left ${className}`}>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-on-surface-variant">{subtitle}</p>}
        </div>
        {legend && <div className="flex gap-4 text-xs font-bold text-on-surface-variant">{legend}</div>}
      </div>

      <div className="h-64 flex flex-col relative ml-8">
        {/* Y-Axis Labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-bold text-on-surface-variant/40 -translate-x-full pr-4 pb-8">
          {yAxisLabels.map((lbl, idx) => (
            <span key={idx}>{lbl}</span>
          ))}
        </div>

        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
          <div className="border-t border-surface-container border-dashed w-full h-0"></div>
          <div className="border-t border-surface-container border-dashed w-full h-0"></div>
          <div className="border-t border-outline-variant/40 w-full h-0"></div>
        </div>

        {/* Chart Drawing */}
        <div className="flex-1 relative mb-6">
          {children}
        </div>

        {/* X-Axis Labels */}
        {xAxisLabels && (
          <div className="flex justify-between text-[10px] font-bold text-on-surface-variant/40 px-2 mt-2">
            {xAxisLabels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ChartContainer;
