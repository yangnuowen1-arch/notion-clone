import { create } from "zustand";

type SearchStore = {
  isOpen: boolean          // 当前搜索弹窗是否打开（true = 显示，false = 隐藏）
  onOpen: () => void       // 打开搜索弹窗
  onClose: () => void      // 关闭搜索弹窗
  toggle: () => void       // 切换状态（开→关，关→开）
};

export const useSearch = create<SearchStore>((set, get) => ({
  isOpen: false,            // 默认关闭
  onOpen: () => set({ isOpen: true }),       // 打开
  onClose: () => set({ isOpen: false }),     // 关闭
  toggle: () => set({ isOpen: !get().isOpen }), // 切换
}));