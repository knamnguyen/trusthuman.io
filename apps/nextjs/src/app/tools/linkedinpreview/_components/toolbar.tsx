"use client";

import React from 'react'
import { Button } from '@sassy/ui/button'
import { Separator } from '@sassy/ui/separator'
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Strikethrough,
    Underline,
    Undo,
    Redo,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'

type Props = {
    editor: Editor | null
}

export const Toolbar: React.FC<Props> = ({ editor }) => {
    if (!editor) {
        return null
    }

    return (
        <div className='flex flex-none flex-wrap items-center justify-start gap-2'>
            <Button
                onClick={() => editor.chain().focus().toggleBold().run()}
                variant={editor.isActive('bold') ? 'secondary' : 'outline'}
                size='icon'>
                <Bold className='size-5' />
            </Button>

            <Button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                variant={editor.isActive('italic') ? 'secondary' : 'outline'}
                size='icon'>
                <Italic className='size-5' />
            </Button>

            <Button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                variant={editor.isActive('strike') ? 'secondary' : 'outline'}
                size='icon'>
                <Strikethrough className='size-5' />
            </Button>

            <Button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                variant={editor.isActive('underline') ? 'secondary' : 'outline'}
                size='icon'>
                <Underline className='size-5' />
            </Button>

            <Separator orientation='vertical' className='h-full' />

            <Button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                variant={editor.isActive('bulletList') ? 'secondary' : 'outline'}
                size='icon'>
                <List className='size-5' />
            </Button>

            <Button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                variant={editor.isActive('orderedList') ? 'secondary' : 'outline'}
                size='icon'>
                <ListOrdered className='size-5' />
            </Button>

            <Separator orientation='vertical' className='h-full' />

            <Button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                variant='outline'
                size='icon'>
                <Undo className='size-5' />
            </Button>

            <Button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                variant='outline'
                size='icon'>
                <Redo className='size-5' />
            </Button>
        </div>
    )
}

