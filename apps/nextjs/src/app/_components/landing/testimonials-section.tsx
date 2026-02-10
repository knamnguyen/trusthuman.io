import Image from "next/image";
import { Star } from "lucide-react";

import { Card } from "@sassy/ui/card";

import { MESSAGING } from "./landing-content";

export function TestimonialsSection() {
  return (
    <section className="bg-card py-24 sm:py-32">
      <div className="container mx-auto">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">
            Loved by Professionals Worldwide
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Don't just take our word for it. Here's what our users have to say.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            check the faq section for more info about reviews
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          {MESSAGING.testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="overflow-hidden bg-card border-2 border-border shadow-[4px_4px_0px_#000]"
            >
              <div className="flex h-full">
                <div className="relative w-1/3">
                  <Image
                    src={testimonial.image}
                    alt={`Photo of ${testimonial.name}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex w-2/3 flex-col justify-center p-6">
                  <div className="mb-2 flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <blockquote className="text-base font-medium text-foreground">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="mt-4">
                    <p className="font-bold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
