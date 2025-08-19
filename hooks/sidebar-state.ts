import { create } from 'zustand'

type SidebarState = {
  isCollapse: boolean
  setIsCollapse: (value: boolean) => void
}

const useSidebarState = create<SidebarState>((set) => ({
  isCollapse: false,
  setIsCollapse: (value) => set({ isCollapse: value }),
}))

export { useSidebarState }
