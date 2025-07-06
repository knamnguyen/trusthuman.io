import Image from "next/image";
import { Star } from "lucide-react";

import { Card } from "@sassy/ui/card";

const testimonials = [
  {
    name: "Sarah L.",
    title: "Solopreneur",
    quote:
      "This tool is a game-changer. I'm saving at least 10 hours a week and my LinkedIn engagement has never been better. It's like having a dedicated marketing intern!",
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&h=400&auto=format&fit=crop",
  },
  {
    name: "David C.",
    title: "Content Creator",
    quote:
      "As a creator, consistency is key. This AI helps me stay active and engage with my community even when I'm busy creating. My follower count has grown by 30% in two months.",
    image:
      "https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=400&h=400&auto=format&fit=crop",
  },
  {
    name: "Michael T.",
    title: "Job Applicant",
    quote:
      "I was struggling to get noticed by recruiters. By consistently engaging on relevant posts, I landed three interviews in a week. This was the edge I needed.",
    image:
      "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=400&h=400&auto=format&fit=crop",
  },
  {
    name: "Jessica P.",
    title: "Startup Founder",
    quote:
      "We have a lean team, so every minute counts. This automates our LinkedIn presence, warming up leads and building our brand authority while we focus on building the product.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=400&auto=format&fit=crop",
  },
  {
    name: "Alex J.",
    title: "Sales Professional",
    quote:
      "My social selling index has skyrocketed. I'm building relationships at scale and starting conversations that lead to real revenue. It's an essential part of my toolkit now.",
    image:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=400&h=400&auto=format&fit=crop",
  },
  {
    name: "Maria G.",
    title: "C-Suite Executive",
    quote:
      "Maintaining an executive presence on LinkedIn is demanding. This tool allows me to share insights and engage with industry leaders efficiently, reinforcing my position as a thought leader.",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&h=400&auto=format&fit=crop",
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-gray-50 py-24 sm:py-32">
      <div className="container mx-auto">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">
            Loved by Professionals Worldwide
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Don't just take our word for it. Here's what our users have to say.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="overflow-hidden bg-white shadow-lg"
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
                  <blockquote className="text-base font-medium text-gray-700">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="mt-4">
                    <p className="font-bold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">{testimonial.title}</p>
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
