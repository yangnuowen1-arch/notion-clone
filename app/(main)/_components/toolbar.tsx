'use client'

import { IconPicker } from '@/components/icon-picker'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import { Doc } from '@/convex/_generated/dataModel'
import { useMutation } from 'convex/react'
import { ImageIcon, Smile, X } from 'lucide-react'
import { ElementRef, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

interface ToolbarProps {
  initialData: Doc<'documents'>
  preview?: boolean
}
const Toolbar = ({ initialData, preview }: ToolbarProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialData.title)
  const update = useMutation(api.documents.update)
  const removeIcon = useMutation(api.documents.removeIcon)

  // 开启编辑模式并聚焦
  const enableInput = () => {
    if (preview) return

    setIsEditing(true)
    setTimeout(() => {
      setValue(initialData.title)
      inputRef.current?.focus()
    }, 0)
  }

  // 标题实时输入与更新，实时保存
  const onInput = (value: string) => {
    setValue(value)
    update({
      id: initialData._id,
      title: value || 'Untitled'
    })
  }

  //结束编辑
  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      disableInput()
    }
  }

  const disableInput = () => {
    setIsEditing(false)
  }


  const onIconSelect = (icon: string) => {
    update({
      id: initialData._id,
      icon
    })
  }

  const onRemoveIcon = () => {
    removeIcon({
      id: initialData._id
    })
  }
  
  return (
    <div className='pl-[54px] group relative'>
      {/* 已添加图标且处于编辑模式 - 显示图标和删除按钮 */}
      {!!initialData.icon && !preview && (
        <div className='flex items-center gap-x-2 group/icon pt-6'>
          <IconPicker onChange={onIconSelect}>
            <p className='text-6xl hover:opacity-75 transition'>
              {initialData.icon}
            </p>
          </IconPicker>
          <Button
            onClick={onRemoveIcon}
            className='rounded-full opacity-0 group-hover/icon:opacity-100 transition text-muted-foreground text-xs'
            variant='outline'
            size='icon'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      )}
      {/* 预览模式：仅显示图标 */}
      {!!initialData.icon && preview && (
        <p className='text-6xl pt-6'>{initialData.icon}</p>
      )}
      {/* 未添加图标且处于编辑模式 - 显示 "Add icon" 按钮 */}
      <div className='opacity-0 group-hover:opacity-100 flex items-center gap-x-1 py-4'>
        {!initialData.icon && !preview && (
          <IconPicker
            asChild
            onChange={onIconSelect}
          >
            <Button
              className='text-muted-foreground text-xs'
              variant='outline'
              size='sm'
            >
              <Smile className='h-4 w-4 mr-2' />
              Add icon
            </Button>
          </IconPicker>
        )}
        {/* 未添加封面且处于编辑模式 - 显示 "Add cover" 按钮 */}
        {!initialData.coverImage && !preview && (
          <Button
            onClick={() => {}}
            className='text-muted-foreground text-xs'
            variant='outline'
            size='sm'
          >
            <ImageIcon className='h-4 w-4 mr-2' />
            Add cover
          </Button>
        )}
      </div>
      {/* 标题编辑/展示逻辑 */}
      {isEditing && !preview ? (
        <TextareaAutosize
          ref={inputRef}
          onBlur={disableInput}
          onKeyDown={onKeyDown}
          value={value}
          onChange={(e) => onInput(e.target.value)}
          className='text-5xl bg-transparent font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF] resize-none'
        />
      ) : (
        <div
          onClick={enableInput}
          className='pb-[11.5px] text-5xl font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF]'
        >
          {initialData.title}
        </div>
      )}
    </div>
  )
}

export default Toolbar
