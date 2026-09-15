import React, { useEffect, useRef, useState } from "react";

const ImageZoom = ({ src, zoom = 2, width = 400, height = 400, alt = "" }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [viewportWidth, setViewportWidth] = useState(0);
  const containerRef = useRef(null);

  // Track viewport width reactively so the zoom panel updates on resize
  // (avoids reading `window` during render, which is SSR-unsafe).
  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleMouseMove = (e) => {
    const { left, top } = containerRef.current.getBoundingClientRect();
    const x = e.pageX - left - window.scrollX;
    const y = e.pageY - top - window.scrollY;
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  // The zoom panel floats to the right of the image. Only enable it on lg+
  // screens (>=1024px) where the layout is side-by-side and there is room —
  // on smaller screens it would overlap the product info / overflow.
  const zoomEnabled = viewportWidth >= 1024;
  const zoomWindowWidth = viewportWidth >= 1200 ? 500 : 350;
  const zoomWindowHeight = viewportWidth >= 1200 ? 400 : 300;

  const bgX = ((mousePos.x / width) * 100);
  const bgY = ((mousePos.y / height) * 100);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width, height, display: "inline-block" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          border: "1px solid #eee",
        }}
      />
      {isHovering && zoomEnabled && (
        <div
          style={{
            position: "absolute",
            left: width + 20,
            top: 0,
            width: zoomWindowWidth,
            height: zoomWindowHeight,
            border: "1px solid #eee",
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${zoom * 100}% ${zoom * 100}%`,
            backgroundPosition: `${bgX}% ${bgY}%`,
            pointerEvents: "none",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            backgroundColor: "#fff"
          }}
        />
      )}
    </div>
  );
};

export default ImageZoom; 