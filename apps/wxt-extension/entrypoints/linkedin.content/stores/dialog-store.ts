import { create } from "zustand";

interface DialogState<T> {
  isOpen: boolean;
  data?: T;
}

type UpdateOrCallback<T> = T | ((prev: T) => T);

interface DialogActions<T> {
  open: (data?: T) => void;
  set: (prev: UpdateOrCallback<DialogState<T>>) => void;
  close: () => void;
}

type DialogStore<T> = DialogState<T> & DialogActions<T>;

export function createDialogStore<T>() {
  return create<DialogStore<T>>((set) => ({
    isOpen: false,

    open: (data?: T) => set({ isOpen: true, data }),
    set: (setter: UpdateOrCallback<DialogState<T>>) => set(setter),
    close: () => set({ isOpen: false, data: undefined }),
  }));
}

export const useDailyQuotaLimitHitDialogStore = createDialogStore();
