"use client";

import { useEffect, useState } from "react";

/** Thin saffron bar across the top that fills as you read down the page. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1" aria-hidden="true">
      <div className="h-full origin-left bg-saffron" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
