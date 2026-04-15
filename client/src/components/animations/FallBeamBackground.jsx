import { useEffect, useRef } from "react";

/**
 * FallBeamBackground — A lightweight falling beam background component.
 * Creates vertical beam lines with CSS animations for a cinematic effect.
 *
 * @param {string} className - Optional class for the container
 * @param {number} lineCount - Number of beams to render (default: 20)
 * @param {string} beamColorClass - Color key: 'cyan-400', 'green-400', 'teal-400', etc.
 */
const FallBeamBackground = ({
  className = "",
  lineCount = 20,
  beamColorClass = "teal-400",
}) => {
  const containerRef = useRef(null);

  // Dynamic CSS styles for the beam effect
  const dynamicStyles = `
    .fall-beam-line {
      position: absolute;
      width: 1px;
      height: 100%;
      z-index: 10;
    }

    .fall-beam-line::after {
      content: "";
      position: absolute;
      left: 0;
      width: 100%;
      height: 80px;
      background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0),
        var(--beam-glow-color)
      );
      animation: fall var(--ani-duration) var(--ani-delay) linear infinite;
    }

    @keyframes fall {
      0% { top: -100px; }
      100% { top: 100%; }
    }
  `;

  // Map color keys to RGBA values
  const getColorValue = (colorClass) => {
    switch (colorClass) {
      case "teal-400":
        return "rgba(45, 212, 191, 0.6)";
      case "teal-500":
        return "rgba(20, 184, 166, 0.6)";
      case "cyan-400":
        return "rgba(34, 211, 238, 0.6)";
      case "green-400":
        return "rgba(74, 222, 128, 0.6)";
      case "blue-400":
        return "rgba(96, 165, 250, 0.6)";
      case "indigo-400":
        return "rgba(129, 140, 248, 0.6)";
      default:
        return "rgba(45, 212, 191, 0.6)"; // default teal
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Clear previous lines on re-render
    container
      .querySelectorAll(".fall-beam-line")
      .forEach((line) => line.remove());

    const glowColor = getColorValue(beamColorClass);

    for (let i = 1; i <= lineCount; i++) {
      const line = document.createElement("div");
      line.classList.add("fall-beam-line");

      // Evenly spaced with slight random jitter
      const leftPosition = `${i * (100 / lineCount) + Math.random() * 5 - 5}%`;

      // Random animation duration (8–18s) and negative delay for staggered start
      const duration = 8 + Math.random() * 10 + "s";
      const delay = -Math.random() * 10 + "s";

      line.style.setProperty("left", leftPosition);
      line.style.setProperty("--ani-duration", duration);
      line.style.setProperty("--ani-delay", delay);
      line.style.setProperty("--beam-glow-color", glowColor);

      container.appendChild(line);
    }

    // Cleanup on unmount
    return () => {
      container
        .querySelectorAll(".fall-beam-line")
        .forEach((line) => line.remove());
    };
  }, [lineCount, beamColorClass]);

  return (
    <>
      <style>{dynamicStyles}</style>
      <div
        ref={containerRef}
        className={`absolute inset-0 z-0 overflow-hidden bg-transparent ${className}`}
      />
    </>
  );
};

export default FallBeamBackground;
