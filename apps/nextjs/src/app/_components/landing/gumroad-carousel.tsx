"use client";

import * as React from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";

import type { CarouselApi } from "@sassy/ui/carousel";
import { Card, CardContent } from "@sassy/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@sassy/ui/carousel";
import { cn } from "@sassy/ui/utils";

const HighlightWords = ({ text }: { text: string }) => {
  const keywords = [
    "Boost",
    "Profile",
    "Appearances",
    "180k",
    "150k",
    "Attract",
    "Network",
    "Recruiters",
    "Investors",
    "Founders",
    "Jasmine",
    "LinkedIn",
    "Guru",
    "Reply",
    "Organically",
    "Follower",
    "Graph",
  ];
  const highlightStyles = [
    { bg: "bg-pink-200", text: "text-pink-900" },
    { bg: "bg-purple-200", text: "text-purple-900" },
  ];
  let styleIndex = 0;

  // Split by spaces to handle words individually
  const parts = text.split(/(\s+)/);

  return (
    <>
      {parts.map((part, index) => {
        const keywordFound = keywords.find(
          (k) => k.toLowerCase() === part.toLowerCase(),
        );
        if (keywordFound) {
          const style = highlightStyles[styleIndex % highlightStyles.length];
          styleIndex++;
          if (style) {
            return (
              <span
                key={index}
                className={cn("rounded px-1", style.bg, style.text)}
              >
                {part}
              </span>
            );
          }
        }
        return part;
      })}
    </>
  );
};

export function GumroadCarousel() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  // Create autoplay plugin instance
  const autoplay = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false }),
  );

  const images = [
    "boost profile appearances 180k.png",
    "attract network of recruiters, investors, founders.png",
    "boost profile appearances 150k.png",
    "get people like Jasmine the LinkedIn guru to reply to you.png",
    "many people reply organically to comments.png",
    "follower graph before and after using.png",
  ];

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const formatTitle = (filename: string) => {
    return filename
      .replace(".png", "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleMouseEnter = () => {
    autoplay.current.stop();
  };

  const handleMouseLeave = () => {
    autoplay.current.play();
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-50">
      {/* Header Section - 20% of viewport height */}
      <div className="flex h-[20vh] items-center justify-center">
        <div className="px-4 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            Join Thousands of Power Users
          </h2>
          <h2 className="pt-2 text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            For a cup of coffee, you save a full work day per week
          </h2>
        </div>
      </div>

      {/* Carousel Section - 80% of viewport height */}
      <div className="flex h-[80vh] items-center justify-center px-4">
        <div
          className="w-full max-w-none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Carousel
            setApi={setApi}
            opts={{
              align: "center",
              loop: true,
            }}
            plugins={[autoplay.current]}
            className="w-full"
          >
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="p-2">
                    <Card className="overflow-hidden rounded-xl border-2 border-black bg-white shadow-[8px_8px_0px_#000]">
                      <CardContent
                        className={cn(
                          "flex h-[70vh] flex-col-reverse items-center gap-4 p-8 md:gap-8",
                          index % 2 === 0
                            ? "md:flex-row"
                            : "md:flex-row-reverse",
                        )}
                      >
                        <div className="relative h-4/5 w-full overflow-hidden rounded-lg md:h-full md:w-1/2">
                          <Image
                            src={`/pictures/${image}`}
                            alt={formatTitle(image)}
                            fill
                            priority={index === 0}
                            className="object-contain p-0"
                          />
                        </div>
                        <div className="flex h-1/5 w-full items-center justify-center px-4 md:h-full md:w-1/2">
                          <p className="text-center text-3xl leading-tight font-bold md:text-4xl lg:text-6xl">
                            <HighlightWords text={formatTitle(image)} />
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-16 h-12 w-12 border-2 border-black bg-white text-black hover:bg-gray-200" />
            <CarouselNext className="-right-16 h-12 w-12 border-2 border-black bg-white text-black hover:bg-gray-200" />
          </Carousel>
          <div className="text-muted-foreground py-6 text-center text-lg">
            {current} of {count}
          </div>
        </div>
      </div>
    </div>
  );
}
