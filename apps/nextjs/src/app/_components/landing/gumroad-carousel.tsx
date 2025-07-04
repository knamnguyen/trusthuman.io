"use client";

import * as React from "react";
import Image from "next/image";

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
    "Connections",
    "Influential",
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
  const parts = text.split(/(\\s+)/);

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

  const images = [
    "boost profile appearances 180k.png",
    "attract connections from influential network, recruiters, investors, founders.png",
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

  return (
    <div className="w-full bg-zinc-50 py-20">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Join Thousands of Power Users
          </h2>
          <h2 className="pt-2 text-xl font-bold tracking-tight sm:text-2xl">
            For a cup of coffee, you save a full work day per week
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">
            See what people are achieving with our app.
          </p>
        </div>
        <Carousel
          setApi={setApi}
          opts={{
            align: "center",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card className="overflow-hidden rounded-xl border-2 border-black bg-white shadow-[8px_8px_0px_#000]">
                    <CardContent
                      className={cn(
                        "flex h-[28rem] items-center gap-x-8 p-6",
                        index % 2 === 0 ? "flex-row" : "flex-row-reverse",
                      )}
                    >
                      <div className="relative h-full w-3/5 overflow-hidden rounded-lg bg-pink-100">
                        <Image
                          src={`/pictures/${image}`}
                          alt={formatTitle(image)}
                          fill
                          className="object-contain p-4"
                        />
                      </div>
                      <div className="flex w-2/5 items-center justify-center">
                        <p className="text-center text-3xl leading-tight font-bold">
                          <HighlightWords text={formatTitle(image)} />
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-12 border-2 border-black bg-white text-black hover:bg-gray-200" />
          <CarouselNext className="-right-12 border-2 border-black bg-white text-black hover:bg-gray-200" />
        </Carousel>
        <div className="text-muted-foreground py-4 text-center text-sm">
          {current} of {count}
        </div>
      </div>
    </div>
  );
}
