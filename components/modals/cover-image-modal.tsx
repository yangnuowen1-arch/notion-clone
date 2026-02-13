'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

import { useCoverImage } from '@/hooks/use-cover-image'
import { SingleImageDropzoneUsage } from '@/components/single-image-dropzone'
import { useState } from 'react'
import { api } from '@/convex/_generated/api'
import { useMutation } from 'convex/react'
import { useParams } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'

export const CoverImageModal = () => {
  const coverImage = useCoverImage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const update = useMutation(api.documents.update)
  const params = useParams()


  const onClose = () => {
    coverImage.onClose()
    setIsSubmitting(false)
  }
  const onChange = async (url?: string) => {
    if (url) {
      setIsSubmitting(true)

      await update({
        id: params.documentId as Id<'documents'>,
        coverImage: url
      })

      onClose()
    }
  }

  return (
    <Dialog
      open={coverImage.isOpen}
      onOpenChange={coverImage.onClose}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='text-center text-lg font-semibold'>
            Cover Image
          </DialogTitle>
        </DialogHeader>
        <SingleImageDropzoneUsage
          onChange={onChange}
          replaceTargetUrl={coverImage.url}
        />
      </DialogContent>
    </Dialog>
  )
}
