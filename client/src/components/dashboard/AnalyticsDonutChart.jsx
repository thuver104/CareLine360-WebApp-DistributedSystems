import { useEffect, useRef, useState } from "react";

/**
 * Animated SVG Donut Chart
 *
 * Props:
 *   data   – array of { label, value, color }
 *   size   – number (SVG viewBox width/height, default 200)
 *   thickness – stroke thickness, default 36
 *   title  – optional centre title
 *   total  – optional number to show in centre (defaults to sum)
 */
export default function AnalyticsDonutChart({
  data = [],
  size = 200,
  thickness = 36,
  title = "Total",
  total,
}) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // IntersectionObserver triggers animation when card enters viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const filtered = data.filter((d) => d.value > 0);
  const sum = filtered.reduce((a, b) => a + b.value, 0);
  const displayTotal = total !== undefined ? total : sum;

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;

  // Build arc segments
  let cumulativeAngle = -90; // start at top
  const segments = filtered.map((item) => {
    const pct = sum > 0 ? item.value / sum : 0;
    const angle = pct * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    // Convert to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    // Dash trick for animation: dasharray = full circumference, dashoffset animates from full → partial
    const dashLength = pct * circumference;

    return {
      ...item,
      pct,
      dashLength,
      x1,
      y1,
      x2,
      y2,
      largeArc,
      startAngle,
      endAngle: startAngle + angle,
    };
  });

  const [hovered, setHovered] = useState(null);

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      {/* SVG Donut */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className="drop-shadow-sm"
        >
          {/* Track ring */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            className="text-gray-100 dark:text-white/5"
          />

          {filtered.length === 0 ? (
            /* Empty state ring */
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={thickness}
              strokeDasharray={`${circumference * 0.6} ${circumference * 0.4}`}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
              className="text-gray-200 dark:text-white/10"
            />
          ) : (
            segments.map((seg, i) => {
              const isHovered = hovered === i;
              const pctValue = (seg.pct * circumference).toFixed(2);
              // Use cumulative offset: first segment starts at 0 offset (accounting for -90deg rotation)
              const prevDash = segments
                .slice(0, i)
                .reduce((acc, s) => acc + s.dashLength, 0);
              const gap = circumference - seg.dashLength;

              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isHovered ? thickness + 4 : thickness}
                  strokeDasharray={`${animated ? pctValue : 0} ${circumference}`}
                  strokeDashoffset={-prevDash + circumference / 4}
                  strokeLinecap="butt"
                  className="cursor-pointer"
                  style={{
                    transition: animated
                      ? `stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 0.12}s, stroke-width 0.2s ease`
                      : "none",
                    transformOrigin: `${cx}px ${cy}px`,
                    filter: isHovered
                      ? `drop-shadow(0 0 6px ${seg.color}88)`
                      : "none",
                  }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })
          )}

          {/* Centre text */}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-900 dark:fill-white"
            style={{
              fontSize: size * 0.14,
              fontWeight: 700,
              fontFamily: "Outfit, sans-serif",
            }}
          >
            {hovered !== null ? filtered[hovered]?.value : displayTotal}
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-500 dark:fill-gray-400"
            style={{ fontSize: size * 0.075, fontFamily: "Outfit, sans-serif" }}
          >
            {hovered !== null ? filtered[hovered]?.label : title}
          </text>
        </svg>

        {/* Hover tooltip */}
        {hovered !== null && filtered[hovered] && (
          <div
            className="absolute top-1/2 left-full ml-2 -translate-y-1/2 z-10 pointer-events-none"
            style={{ minWidth: 100 }}
          >
            <div className="glass-card rounded-xl px-3 py-2 text-xs shadow-lg">
              <p className="font-semibold text-gray-800 dark:text-white">
                {filtered[hovered].label}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {filtered[hovered].value} (
                {(filtered[hovered].pct * 100).toFixed(0)}%)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {filtered.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${
              hovered !== null && hovered !== i ? "opacity-40" : "opacity-100"
            }`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {item.label}
            </span>
            <span className="text-xs font-bold" style={{ color: item.color }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
