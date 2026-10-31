import type { AnalyticsRange, RevenueTrend } from "./types";
import { formatDateLabel } from "./utils";

interface RevenueChartProps {
  data: RevenueTrend[];
  range: AnalyticsRange;
}

export default function RevenueChart({ data, range }: RevenueChartProps) {
  if (!data.length) {
    return (
      <div className="flex min-h-56 items-center justify-center text-xs text-slate-400">
        No revenue data available for this period.
      </div>
    );
  }

  const width = 700;
  const height = 230;
  const paddingX = 30;
  const paddingY = 25;

  const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? width / 2
        : paddingX + (index / (data.length - 1)) * chartWidth;

    const y = height - paddingY - (item.revenue / maxRevenue) * chartHeight;

    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  const areaPath = `${linePath} L ${lastPoint.x} ${
    height - paddingY
  } L ${firstPoint.x} ${height - paddingY} Z`;

  const labelIndexes =
    data.length <= 7
      ? data.map((_, index) => index)
      : [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <div className="w-full">
      <div className="overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label="Revenue trend chart"
        >
          {[0, 1, 2, 3].map((line) => {
            const y = paddingY + (line / 3) * chartHeight;

            return (
              <line
                key={line}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeDasharray="4 5"
              />
            );
          })}

          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#revenueGradient)" />

          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => (
            <circle
              key={data[index]._id}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#3b82f6"
              stroke="currentColor"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      <div className="mt-2 flex justify-between px-3">
        {labelIndexes.map((index) => (
          <span key={data[index]._id} className="text-[10px] text-slate-400">
            {formatDateLabel(data[index]._id, range)}
          </span>
        ))}
      </div>
    </div>
  );
}
