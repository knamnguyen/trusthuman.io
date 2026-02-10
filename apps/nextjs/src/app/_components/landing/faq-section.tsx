import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@sassy/ui/accordion";

import { MESSAGING } from "./landing-content";

export function FaqSection() {
  return (
    <section className="bg-card py-20">
      <div className="container mx-auto max-w-4xl px-4">
        <h2 className="mb-12 text-center text-4xl font-bold">
          {MESSAGING.faq.headline}
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {MESSAGING.faq.questions.map((faq, index) => (
            <AccordionItem value={`item-${index + 1}`} key={index}>
              <AccordionTrigger className="text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
