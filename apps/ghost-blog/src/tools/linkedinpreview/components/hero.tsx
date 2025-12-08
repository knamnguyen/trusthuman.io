import { ExternalLinks } from '../config/urls'
import { Icons } from '../lib/icons'
import { Badge } from '@sassy/ui/badge'
import { Button } from '@sassy/ui/button'

const ASSET_BASE = 'https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview'

export function Hero() {
    return (
        <>
            <section id='hero' className='container relative max-w-7xl pt-16 md:pt-28 lg:pt-36'>
                <div className='flex flex-col items-center gap-8 text-center'>
                    {/* Tagline */}
                    <div className='flex items-center gap-6'>
                        <Badge>Completely Free</Badge>
                        <a
                            className='inline-flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors'
                            href={ExternalLinks.GitHub}
                            target='_blank'
                            rel='noopener noreferrer'>
                            <Icons.github className='size-4' />
                            <span>View Source</span>
                        </a>
                    </div>

                    {/* Headline */}
                    <div className='flex flex-col gap-4'>
                        <h1 className='text-balance font-bold text-4xl tracking-wide md:text-6xl lg:text-7xl'>
                            Format and Preview your{' '}
                            <span className='bg-gradient-to-b from-primary/60 to-primary bg-clip-text text-transparent'>
                                LinkedIn
                            </span>{' '}
                            Posts
                        </h1>
                        <p className='mx-auto max-w-2xl text-balance text-muted-foreground md:text-xl'>
                            A free tool to Write, Format, and Preview your LinkedIn posts. Improve your LinkedIn
                            presence and engagement.
                        </p>
                    </div>

                    {/* Rating */}
                    <div className='flex items-center space-x-1'>
                        <span className='pr-2 text-sm font-semibold text-muted-foreground'>4.9/5</span>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Icons.star key={i} className='mb-0.5 size-5 fill-yellow-500 text-yellow-500' />
                        ))}
                        <span className='pl-2 text-sm font-semibold text-muted-foreground'>from 3342 Reviews</span>
                    </div>

                    {/* CTA */}
                    <div className='space-x-4'>
                        <Button>Get Started</Button>
                        <Button variant='secondary'>Learn more</Button>
                    </div>
                </div>
                <Background />
            </section>
        </>
    )
}

function Background() {
    return (
        <>
            <img
                alt='Decorative background pattern for LinkedIn Post Preview tool'
                className='absolute inset-0 -z-10 size-full animate-pulse object-cover opacity-30'
                src={`${ASSET_BASE}/bg-pattern-filled.png`}
            />
            <div className='absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-background/85 via-20% to-background to-80%' />
        </>
    )
}
