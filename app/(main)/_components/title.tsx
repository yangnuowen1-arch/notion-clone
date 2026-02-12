"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { update } from "@/convex/documents"
import { useMutation } from "convex/react"
import { useRef, useState } from "react"

// 定义数据接口
interface TitleProps {
  initialData: Doc<"documents">
}

export const Title = ({ initialData }: TitleProps) => {
  // 1. 定义状态
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialData.title || "无标题");
  const [isEditing, setIsEditing] = useState(false);
  const update = useMutation(api.documents.update)

  // 2. 开启编辑模式
  const enableInput = () => {
    setTitle(initialData.title);
    setIsEditing(true);
    // 确保 DOM 更新后聚焦并全选文本
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(0, inputRef.current.value.length);
    }, 0);
  };

  // 3. 关闭编辑模式（保存逻辑）
  const disableInput = () => {
    setIsEditing(false);
  };

  // 4. 输入框变化处理
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
    update({
      id: initialData._id,
      title: event.target.value || "Untitled"
    })
  };

  // 5. 键盘事件（回车保存）
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      disableInput();
    }
  };


  return (
    <div className="flex items-center gap-x-1">
      {!!initialData.icon && <p>{initialData.icon}</p>}

      {isEditing ? (
        <Input
          ref={inputRef}
          onClick={enableInput}
          onBlur={disableInput}
          onChange={onChange}
          onKeyDown={onKeyDown}
          value={title}
          className="h-7 px-2 focus-visible:ring-transparent"
        />
      ) : (
        <Button
          onClick={enableInput}
          variant="ghost"
          size="sm"
          className="font-normal h-auto p-1"
        >
          <span className="truncate">
            {initialData?.title}
          </span>
        </Button>
      )}
    </div>
  );
};

Title.Skeleton = function TitleSkeletion() {
  return (
    <Skeleton className="h-9 w-20 rounded-md"/>
  )
}