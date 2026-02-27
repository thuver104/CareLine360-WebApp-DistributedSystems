import { useEffect, useRef, useState } from "react";

/**
 * Animated Vertical Bar Chart
 *
 * Props:
 *   data    – array of { month: string, count: number }
 *   color   – bar fill color (CSS color string)
 *   height  – chart area height in px (default 140)
 *   label   – y-axis label shown as caption
 */
export default function AnalyticsBarChart({
  data = [],
  color = "#0d9488",
  height = 140,
  label = "Appointments",
}) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const [hovered, setHovered] = useState(null);

  return (
    <div ref={ref} className="w-full">
      {/* Bar area */}
      <div
        className="flex items-end gap-1.5 px-1"
        style={{ height }}
        aria-label={label}
      >
        {data.map((item, i) => {
          const pct = maxCount > 0 ? item.count / maxCount : 0;
          const barH = animated
            ? Math.max(pct * (height - 28), item.count > 0 ? 4 : 0)
            : 0;
          const isHovered = hovered === i;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end gap-1 group"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Value label on hover */}
              <span
                className={`text-[10px] font-bold transition-opacity duration-200 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
                style={{ color }}
              >
                {item.count}
              </span>

              {/* Bar */}
              <div
                className="w-full rounded-t-lg cursor-pointer transition-all duration-700 ease-out"
                style={{
                  height: barH,
                  backgroundColor: isHovered ? color : color + "cc",
                  boxShadow: isHovered ? `0 -4px 16px ${color}55` : "none",
                  transitionDelay: `${i * 60}ms`,
                  minHeight: item.count > 0 && animated ? 4 : 0,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1.5 px-1 mt-1.5">
        {data.map((item, i) => (
          <div
            key={i}
            className={`flex-1 text-center text-[10px] font-medium transition-colors ${
              hovered === i
                ? "text-gray-800 dark:text-white"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {item.month}
          </div>
        ))}
      </div>

      {/* Y-axis label */}
      {label && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2">
          {label}
        </p>
      )}
    </div>
  );
}
