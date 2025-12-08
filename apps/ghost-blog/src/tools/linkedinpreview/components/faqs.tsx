import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@sassy/ui/accordion'

const FAQList = [
    {
        question: 'What is LinkedIn Preview Tool?',
        answer: 'LinkedIn Preview Tool is a free online tool that allows you to write, format, and preview your LinkedIn posts before publishing them. This ensures your posts look professional and engaging on all devices.',
    },
    {
        question: 'How does the LinkedIn Preview Tool improve my LinkedIn posts?',
        answer: 'By using LinkedIn Preview Tool, you can apply advanced formatting options like bold, italics, and lists, and see exactly how your post will look on different devices. This helps you make necessary adjustments to ensure maximum readability and impact.',
    },
    {
        question: 'Is LinkedIn Preview Tool free to use?',
        answer: 'Yes, LinkedIn Preview Tool is completely free to use. We provide full functionality without any fees, making it accessible for individuals and businesses alike.',
    },
    {
        question: 'Do I need to install any software to use LinkedIn Preview Tool?',
        answer: "No, LinkedIn Preview Tool is a web-based tool, so there's no need to install any software. Just visit our website from any browser, and start creating your posts right away.",
    },
    {
        question: 'Can I see how my LinkedIn post will look on mobile devices?',
        answer: 'Absolutely! LinkedIn Preview Tool allows you to preview your LinkedIn post as it will appear on mobile, tablet, and desktop devices, helping you optimize your content for all viewing platforms.',
    },
    {
        question: 'How can formatting help my LinkedIn posts perform better?',
        answer: 'Well-formatted posts are more appealing and easier to read, which can lead to higher engagement rates. Using formatting tools like those provided by LinkedIn Preview Tool can help highlight important information and organize your content effectively.',
    },
    {
        question: 'Why should I preview my LinkedIn post before publishing?',
        answer: 'Previewing your post helps catch errors, adjust formatting, and ensure the content looks good on all devices. This step can greatly enhance the professionalism of your posts and increase viewer engagement.',
    },
    {
        question: 'How do I use LinkedIn Preview Tool to format my LinkedIn posts?',
        answer: 'Simply type or paste your content into the editor on LinkedIn Preview Tool, use the formatting tools to style your text, and use the preview function to check the appearance on different devices before publishing.',
    },
    {
        question: 'What are the main features of LinkedIn Preview Tool?',
        answer: 'LinkedIn Preview Tool offers features like real-time multi-device previews, rich text formatting options such as bold, italic, underline, bullet points, and numbered lists, all aimed at enhancing the quality and effectiveness of your LinkedIn posts.',
    },
    {
        question: 'How can I ensure my LinkedIn posts are engaging?',
        answer: 'To create engaging posts, focus on clear, impactful content. Use formatting tools to make important text stand out, structure your content with lists, and always preview your posts to ensure they look perfect across all platforms.',
    },
]

export function FAQs() {
    return (
        <section id='faqs' className='container max-w-6xl py-16 md:py-24'>
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: FAQList.map((faq) => ({
                            '@type': 'Question',
                            name: faq.question,
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: faq.answer,
                            },
                        })),
                    }),
                }}
            />
            <div className='space-y-6'>
                <div className='space-y-4'>
                    <h2 className='text-2xl font-bold sm:text-4xl md:text-5xl'>Frequently Asked Questions</h2>
                    <p className='text-balance text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'>
                        Find answers to common questions about LinkedIn Preview Tool and how it can help you create better
                        LinkedIn posts.
                    </p>
                </div>

                <Accordion type='multiple'>
                    {FAQList.map((faq) => (
                        <AccordionItem key={faq.question} value={faq.question}>
                            <AccordionTrigger className='gap-4 text-start'>{faq.question}</AccordionTrigger>
                            <AccordionContent className=''>{faq.answer}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    )
}
