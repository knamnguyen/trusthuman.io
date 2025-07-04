import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@sassy/ui/accordion";

const faqs = [
  {
    question: "Will this hurt my account or get it shadow-banned?",
    answer:
      "No, we employ human simulation algorithm with full client-side interaction that makes it impossible for linkedin to detect automation. LinkedIn can only detect automation if you use an api or different server virtual machine (laptop) to comment.",
  },
  {
    question: "Is this spammy and making LinkedIn worse?",
    answer:
      "No, especially when you add really good style guide that helps EngageKit intern creates quality, human-like comments. This not only benefits you but also the authors of the posts receiving these comments, because they get more reach. It's a win-win.",
  },
  {
    question: "Is this free to use?",
    answer:
      "Yes, you can use EngageKit to make 15 free comments daily. You can consider upgrading to make 100 comments per day and maximize your engagement and reach",
  },
  {
    question: "What results can I expect from using the upgraded plan?",
    answer:
      "you can expect an average of 15 new followers per day, 300% boost of your post reach if you run the extension after making a new post, and 100k profile appearances across linkedin after a week",
  },
  {
    question: "How long and how consistent should I use the extension?",
    answer:
      "We recomment using the extension everyday and make 100 comments to compound the engagement effects over time. You will see immediate results after 1-4 weeks of using EngageKit",
  },
  {
    question: "How can I contact support?",
    answer:
      "Any support request please send via email at knamnguyen.work@gmail.com. Priority support is avaialble for paid users via dm on the creator's Whatsapp exclusiveprivate group chat.",
  },
];

export function FaqSection() {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto max-w-4xl px-4">
        <h2 className="mb-12 text-center text-4xl font-bold">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index + 1}`} key={index}>
              <AccordionTrigger className="text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-gray-700">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
