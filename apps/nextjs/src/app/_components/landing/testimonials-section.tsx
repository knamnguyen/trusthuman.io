import Image from "next/image";
import { Star } from "lucide-react";

import { Card } from "@sassy/ui/card";

const testimonials = [
  {
    name: "Lisa Thompson",
    title: "Operations Manager",
    quote:
      "EngageKit has my LinkedIn buzzing while I'm buried in spreadsheets. I save at least 10 hours a week and my network keeps growing without lifting a finger.",
    image: "/testimonials/american middle aged women business professional.jpg",
  },
  {
    name: "Jamal Brooks",
    title: "Computer Science Student",
    quote:
      "Recruiters started DM-ing me after EngageKit kept me active in tech conversations. Landed two internship offers already!",
    image:
      "/testimonials/black student in america building a personal brand for recruiting.jpg",
  },
  {
    name: "Li Mei",
    title: "High School Senior",
    quote:
      "I needed to stand out for university apps. EngageKit helped me share insights and connect with alumni—my acceptance emails are rolling in.",
    image:
      "/testimonials/chinese student applying to university from high school girl.jpg",
  },
  {
    name: "Sofía García",
    title: "Graphic Designer",
    quote:
      "As a freelancer, visibility is everything. EngageKit keeps me in the design chatter and I've booked three new clients this month.",
    image: "/testimonials/creative professional european 27 years old.jpg",
  },
  {
    name: "Thomas Müller",
    title: "Sales Director",
    quote:
      "My pipeline was dry until EngageKit warmed up leads for me. Calls feel warmer and quotas look smaller now.",
    image: "/testimonials/german business man middle age in office setting.jpg",
  },
  {
    name: "Chloe Wong",
    title: "Marketing Manager",
    quote:
      "EngageKit comments in my tone so well that my boss thought I hired an assistant. Our brand reach jumped 3x in a week.",
    image:
      "/testimonials/hong kong girl professional 30 years old marketing.jpg",
  },
  {
    name: "Marek Novak",
    title: "Animation Storyteller",
    quote:
      "Keeping up on LinkedIn used to drain me. EngageKit keeps conversations alive while I focus on storyboards.",
    image:
      "/testimonials/storyteller animation 40 somthing man from europe.jpg",
  },
  {
    name: "Aisha Khan",
    title: "Law Student",
    quote:
      "Between classes and moot court I had zero time. EngageKit helped me build a professional presence and connect with mentors worldwide.",
    image: "/testimonials/young muslim girl from south asia studying law.jpg",
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
