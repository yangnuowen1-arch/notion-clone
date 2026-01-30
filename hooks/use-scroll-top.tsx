import { useEffect, useState } from "react";

export const useScrollTop = (threshold = 10) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > threshold) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    // 1. 设置副作用：开始监听滚动
    window.addEventListener("scroll", handleScroll);
    
    // 2. 清理副作用：组件消失或更新前，取消监听
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return scrolled;
}