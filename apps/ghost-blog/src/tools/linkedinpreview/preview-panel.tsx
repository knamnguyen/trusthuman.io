import React from 'react'
import { cn } from '@sassy/ui/utils'
import { ScreenSizeProvider, useScreenSize } from './preview/preview-size-context'
import { PreviewHeader } from './preview/preview-header'
import { UserInfo } from './preview/user-info'
import { ContentSection } from './preview/content-section'
import { Reactions } from './preview/reactions'
import { ActionButtons } from './preview/action-buttons'

interface PreviewPanelProps {
    content: any
    image: string | null
}

const PreviewPanelContent: React.FC<PreviewPanelProps> = ({ content, image }) => {
    const { screenSize } = useScreenSize()

    const containerWidth = {
        mobile: 'w-[320px]',
        tablet: 'w-[480px]',
        desktop: 'w-[555px]',
    }

    return (
        <div className='flex h-full flex-col'>
            <PreviewHeader />
            <div className='flex flex-1 flex-col items-center gap-5 overflow-y-auto bg-gray-50 py-5'>
                <div className={cn('mx-auto transition-all duration-300', containerWidth[screenSize])}>
                    <div className='font-system overflow-hidden rounded-lg bg-white shadow ring-1 ring-inset ring-gray-200'>
                        <div className='py-5 pl-4 pr-6'>
                            <UserInfo />
                            <ContentSection content={content} />
                        </div>
                        {image && (
                            <div className='relative w-full'>
                                <img
                                    src={image}
                                    alt='Post'
                                    className='w-full object-cover'
                                    style={{ maxHeight: '600px', objectFit: 'contain' }}
                                />
                            </div>
                        )}
                        <div className='py-3 pl-4 pr-6'>
                            <Reactions />
                            <hr className='mt-3 border-gray-200' />
                            <ActionButtons />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ content, image }) => {
    return (
        <ScreenSizeProvider>
            <PreviewPanelContent content={content} image={image} />
        </ScreenSizeProvider>
    )
}

