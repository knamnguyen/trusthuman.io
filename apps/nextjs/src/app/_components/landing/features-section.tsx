import { BarChart, Clock, Star, Users } from "lucide-react";

const features = [
  {
    icon: <Clock className="h-8 w-8 text-pink-500" />,
    title: "Save 30 Hours/Month",
    description: "Automate 3000+ comments",
  },
  {
    icon: <Users className="h-8 w-8 text-pink-500" />,
    title: "Gain 300-1000+ Followers",
    description: "With increased engagement",
  },
  {
    icon: <BarChart className="h-8 w-8 text-pink-500" />,
    title: "300% More Post Reach",
    description: "On every single post",
  },
  {
    icon: <Star className="h-8 w-8 text-pink-500" />,
    title: "Go from 1k to 400k+",
    description: "In profile appearances",
  },
];

export function FeaturesSection() {
  return (
    <div className="bg-white py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex h-[20vh] items-center justify-center">
          <div className="pb-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Boss, let your AI intern engage LinkedIn for you
            </h1>
            <p className="pt-2 text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              this is the fastest way to grow on LinkedIn
            </p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-8 text-center md:grid-cols-4">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center">
              {feature.icon}
              <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
