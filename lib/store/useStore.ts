import { create } from 'zustand'
import type { AppState } from '@/lib/types'

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  currentName: null,
  setCurrentName: (name) => set({ currentName: name }),

  todayLog: null,
  setTodayLog: (log) => set({ todayLog: log }),

  todayParsed: [],
  setTodayParsed: (entries) => set({ todayParsed: entries }),

  todayMentalState: null,
  setTodayMentalState: (state) => set({ todayMentalState: state }),
}))
