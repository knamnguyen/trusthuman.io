import { Button } from "@sassy/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@sassy/ui/card";

import { Icons } from "../lib/icons";

const Reasons = [
  {
    title: "Make Your Posts Easy to Read",
    description:
      "Good formatting helps organize your ideas clearly. It makes your posts simpler to follow and keeps your readers interested.",
    icon: <Icons.checkCircle className="text-primary" />,
  },
  {
    title: "Make a Great First Impression",
    description:
      "People notice neat and tidy posts. Previewing lets you see how your post will look on different screens, ensuring it always looks its best.",
    icon: <Icons.thumsUp className="text-primary" />,
  },
  {
    title: "Get More Likes and Comments",
    description:
      "Write posts that people want to interact with. Well formatted and attractive posts are more likely to be liked, commented on, and shared.",
    icon: <Icons.commentHeart className="text-primary" />,
  },
];

export function Reason() {
  return (
    <section id="reason" className="container max-w-6xl py-16 md:py-24">
      <div className="grid gap-8 lg:grid-cols-[1fr,1fr] lg:place-items-center">
        <div className="flex flex-col items-center justify-center space-y-8">
          <h2 className="text-2xl font-bold sm:text-4xl md:text-5xl">
            Why{" "}
            <span className="from-primary/60 to-primary bg-gradient-to-b bg-clip-text text-transparent">
              Format{" "}
            </span>
            and{" "}
            <span className="from-primary/60 to-primary bg-gradient-to-b bg-clip-text text-transparent">
              Preview{" "}
            </span>
            Your LinkedIn Posts?
          </h2>

          <p className="text-muted-foreground max-w-[800px] text-balance md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            The appearance of posts on LinkedIn can significantly influence your
            professional reputation and how much engagement your content
            receives. Rich text formatting enables you to design posts that not
            only stand out but also truly resonate with your audience. Also,
            with real-time preview you are sure your linkedin post content and
            opening line look exactly what you expect before going live, across
            any device.
          </p>
          <Button asChild>
            <a href="#myIframe">Focus Tool</a>
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {Reasons.map(({ icon, title, description }) => (
            <Card key={title}>
              <CardHeader className="flex items-start justify-start gap-4 space-y-1 md:flex-row">
                <div className="bg-primary/20 mt-1 rounded-xl p-2">{icon}</div>
                <div>
                  <CardTitle className="text-xl font-bold tracking-wide">
                    {title}
                  </CardTitle>
                  <CardDescription className="text-md mt-2">
                    {description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
