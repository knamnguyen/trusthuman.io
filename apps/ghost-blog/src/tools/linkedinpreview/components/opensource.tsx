import { ExternalLinks } from '../config/urls'
import { Icons } from '../lib/icons'
import { Button } from '@sassy/ui/button'

export function OpenSource() {
    return (
        <section id='opensource' className='w-full bg-muted py-12 md:py-16 lg:py-24'>
            <div className='container flex flex-col items-center space-y-6 px-4 text-center md:px-6'>
                <Icons.github className='size-10' />
                <h2 className='text-2xl font-bold sm:text-4xl md:text-5xl'>Proudly Open Source</h2>
                <p className='mx-auto max-w-[600px] text-balance text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'>
                    Our product is open source and we encourage contributions from our community. You can support us by
                    starring the repository and contributing to the codebase.
                </p>
                <div className='flex items-center justify-center space-x-4'>
                    <Button asChild>
                        <a href={ExternalLinks.GitHub} target='_blank' rel='noopener noreferrer'>
                            Support us on GitHub
                        </a>
                    </Button>
                </div>
            </div>
        </section>
    )
}
