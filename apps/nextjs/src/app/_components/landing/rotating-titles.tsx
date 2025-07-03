"use client";

import * as React from "react";

export function RotatingTitles({ titles }: { titles: string[] }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % titles.length);
    }, 2000); // Change title every 2 seconds

    return () => clearInterval(interval);
  }, [titles.length]);

  return (
    <div className="h-[5.5rem] overflow-hidden">
      <div
        className="transition-transform duration-700 ease-in-out"
        style={{ transform: `translateY(-${currentIndex * 5.5}rem)` }}
      >
        {titles.map((title) => (
          <div
            key={title}
            className="flex h-[5.5rem] items-center justify-center"
          >
            <span className="rounded-lg bg-pink-200 px-4 py-2 text-pink-900">
              {title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
