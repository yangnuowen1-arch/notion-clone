//小型模块化旋转器组件
import { Loader } from "lucide-react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";


//配方
const spinnerVariants = cva(
  "text-muted-foreground animate-spin",
  {
    variants: {
      size: {
        default: "h-4 w-4",
        sm: "h-2 w-2",
        lg: "h-6 w-6",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      size: "default"
    }
  },
);

//菜单
// interface SpinnerProps extends VariantProps<typeof spinnerVariants> {}
//这个接口没有增加任何成员，它与父类型 VariantProps<typeof spinnerVariants> 等价
type SpinnerProps = VariantProps<typeof spinnerVariants>;


//厨师
export const Spinner = ({
  size
}:SpinnerProps) => {
  return (
    <Loader className={cn(spinnerVariants({ size }))} />
  )
}