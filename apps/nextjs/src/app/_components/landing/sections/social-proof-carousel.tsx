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

import { MESSAGING } from "../landing-content";

export function SocialProofCarousel() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  // Create autoplay plugin instance
  const autoplay = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false }),
  );

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

  const handleMouseEnter = () => {
    autoplay.current.stop();
  };

  const handleMouseLeave = () => {
    autoplay.current.play();
  };

  return (
    <div className="w-full bg-card py-16">
      {/* Header Section */}
      <div className="flex items-center justify-center pb-8">
        <div className="px-4 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            Real Results from Real Professionals
          </h2>
          <p className="pt-2 text-lg text-muted-foreground md:text-xl">
            Build relationships that drive business outcomes
          </p>
        </div>
      </div>

      {/* Carousel Section */}
      <div className="flex items-center justify-center px-4">
        <div
          className="relative w-full max-w-5xl"
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
              {MESSAGING.socialProof.images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="p-2">
                    <Card className="overflow-hidden rounded-xl border-2 border-border bg-card shadow-[4px_4px_0px_#000]">
                      <CardContent
                        className={cn(
                          "flex flex-col-reverse items-center gap-4 p-4 md:gap-6 md:p-6",
                          index % 2 === 0
                            ? "md:flex-row"
                            : "md:flex-row-reverse",
                        )}
                      >
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg md:w-1/2">
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            priority={index === 0}
                            className="object-contain"
                          />
                        </div>
                        <div className="flex w-full items-center justify-center md:w-1/2">
                          <p className="text-center text-lg leading-tight font-bold text-foreground md:text-2xl lg:text-3xl">
                            {image.caption}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-12 hidden h-10 w-10 border-2 border-border bg-card text-foreground hover:bg-muted md:flex" />
            <CarouselNext className="-right-12 hidden h-10 w-10 border-2 border-border bg-card text-foreground hover:bg-muted md:flex" />
          </Carousel>
          <div className="text-muted-foreground py-4 text-center text-sm">
            {current} of {count}
          </div>
        </div>
      </div>
    </div>
  );
}
