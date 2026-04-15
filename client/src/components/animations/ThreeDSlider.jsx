import React, { useState, useEffect, useCallback, useRef } from "react";

// --- Sub-Component: SliderItem ---
const SliderItem = React.forwardRef(({ item, onClick }, ref) => {
  return (
    <div
      ref={ref}
      className="absolute top-1/2 left-1/2 cursor-pointer select-none rounded-xl 
                shadow-2xl bg-black pointer-events-auto
                overflow-hidden will-change-transform"
      style={{
        "--width": "clamp(150px, 30vw, 300px)",
        "--height": "clamp(200px, 40vw, 400px)",
        width: "var(--width)",
        height: "var(--height)",
        marginTop: "calc(var(--height) / -2)",
        marginLeft: "calc(var(--width) / -2)",
        transformOrigin: "0% 100%",
        transition: "none",
        display: "block",
      }}
      onClick={onClick}
    >
      <div
        className="slider-item-content absolute inset-0 z-10 will-change-opacity"
        style={{ opacity: 1, transition: "opacity 0.3s ease-out" }}
      >
        {/* Overlay gradient */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 50%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        {/* Title */}
        <div
          className="absolute z-10 bottom-5 left-5"
          style={{
            color: "#fff",
            fontSize: "clamp(20px, 3vw, 30px)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
          }}
        >
          {item.title}
        </div>

        {/* Number */}
        <div
          className="absolute z-10 top-2.5 left-5"
          style={{
            color: "#fff",
            fontSize: "clamp(20px, 10vw, 80px)",
          }}
        >
          {item.num}
        </div>

        {/* Image */}
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
});

SliderItem.displayName = "SliderItem";

// --- Main Component: ThreeDSlider ---
const ThreeDSlider = ({
  items,
  speedWheel = 0.05,
  speedDrag = -0.15,
  containerStyle = {},
  onItemClick,
}) => {
  const progressRef = useRef(50);
  const targetProgressRef = useRef(50);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const itemRefs = useRef([]);
  const cacheRef = useRef({});

  const numItems = items.length;

  // --- Animation Loop ---
  const update = useCallback(() => {
    if (!itemRefs.current.length) return;

    progressRef.current +=
      (targetProgressRef.current - progressRef.current) * 0.1;

    const progress = progressRef.current;
    const clamped = Math.max(0, Math.min(progress, 100));
    const activeFloat = (clamped / 100) * (numItems - 1);

    itemRefs.current.forEach((el, index) => {
      if (!el) return;

      const denominator = numItems > 1 ? numItems - 1 : 1;
      const ratio = (index - activeFloat) / denominator;

      const tx = ratio * 800;
      const ty = ratio * 200;
      const rot = ratio * 120;

      const dist = Math.abs(index - activeFloat);
      const z = numItems - dist;
      const opacity = (z / numItems) * 3 - 2;

      const newTransform = `translate3d(${tx}%, ${ty}%, 0) rotate(${rot}deg)`;
      const newZIndex = Math.round(z * 10).toString();
      const newOpacity = Math.max(0, Math.min(1, opacity)).toString();

      if (!cacheRef.current[index]) {
        cacheRef.current[index] = {
          transform: "",
          zIndex: "",
          opacity: "",
        };
      }

      const cache = cacheRef.current[index];

      if (cache.transform !== newTransform) {
        el.style.transform = newTransform;
        cache.transform = newTransform;
      }
      if (cache.zIndex !== newZIndex) {
        el.style.zIndex = newZIndex;
        cache.zIndex = newZIndex;
      }

      const inner = el.querySelector(".slider-item-content");
      if (inner && cache.opacity !== newOpacity) {
        inner.style.opacity = newOpacity;
        cache.opacity = newOpacity;
      }
    });
  }, [numItems]);

  // Start loop
  useEffect(() => {
    let active = true;

    const loop = () => {
      if (active) {
        update();
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [update]);

  // --- Interaction Handlers ---
  const handleWheel = useCallback(
    (e) => {
      const wheelProgress = e.deltaY * speedWheel;
      const current = targetProgressRef.current;
      const next = current + wheelProgress;

      if ((next < 0 && e.deltaY < 0) || (next > 100 && e.deltaY > 0)) {
        return;
      }

      e.preventDefault();
      targetProgressRef.current = Math.max(0, Math.min(100, next));
    },
    [speedWheel]
  );

  const getClientX = (e) => {
    if ("touches" in e) return e.touches[0].clientX;
    return e.clientX;
  };

  const handleMouseDown = useCallback((e) => {
    isDownRef.current = true;
    const x = getClientX(e);
    if (x !== undefined) startXRef.current = x;
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDownRef.current) return;

      const x = getClientX(e);
      if (x === undefined) return;

      const diff = (x - startXRef.current) * speedDrag;
      const current = targetProgressRef.current;
      const next = Math.max(0, Math.min(100, current + diff));

      targetProgressRef.current = next;
      startXRef.current = x;
    },
    [speedDrag]
  );

  const handleMouseUp = useCallback(() => {
    isDownRef.current = false;
  }, []);

  const handleClick = useCallback(
    (item, index) => {
      const denominator = numItems > 1 ? numItems - 1 : 1;
      targetProgressRef.current = (index / denominator) * 100;

      if (onItemClick) onItemClick(item, index);
    },
    [numItems, onItemClick]
  );

  // --- Listeners ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wheelOpts = { passive: false };
    container.addEventListener("wheel", handleWheel, wheelOpts);
    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("touchstart", handleMouseDown, {
      passive: true,
    });

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove, { passive: true });
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("touchstart", handleMouseDown);

      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ background: "transparent", ...containerStyle }}
    >
      <div className="relative z-10 h-[80vh] overflow-hidden pointer-events-none w-full"
        style={{ transform: "scale(0.75)" }}
      >
        {items.map((item, index) => (
          <SliderItem
            key={`slider-item-${index}`}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            item={item}
            index={index}
            onClick={() => handleClick(item, index)}
          />
        ))}
      </div>
      {/* Static layout text */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-0 left-[90px] w-[10px] h-full"
          style={{ border: "1px solid rgba(26,26,26,0.07)", borderTop: "none", borderBottom: "none" }}
        />
        <div
          className="absolute bottom-0 left-[30px]"
          style={{
            color: "rgba(26,26,26,0.25)",
            transform: "rotate(-90deg)",
            transformOrigin: "0% 10%",
            fontSize: "9px",
            textTransform: "uppercase",
            lineHeight: "1.625",
            letterSpacing: "0.15em",
          }}
        >
          CareLine 360
        </div>
      </div>
    </div>
  );
};

export default ThreeDSlider;
