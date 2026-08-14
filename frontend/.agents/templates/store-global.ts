import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { StorageService } from '@/services/storage/storage.service';
import { STORAGE_KEYS } from '@/constants/storage.constants';

interface DomainState {
  value: string;
  items: string[];
}

interface DomainActions {
  setValue: (value: string) => void;
  addItem: (item: string) => void;
  removeItem: (item: string) => void;
  reset: () => void;
}

type DomainStore = DomainState & DomainActions;

const STORE_VERSION = 1;

const initialState: DomainState = {
  value: '',
  items: [],
};

export const useDomainStore = create<DomainStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setValue: (value) => set({ value }),

      addItem: (item) =>
        set((s) => ({
          items: s.items.includes(item) ? s.items : [...s.items, item],
        })),

      removeItem: (item) =>
        set((s) => ({
          items: s.items.filter((i) => i !== item),
        })),

      reset: () => set({ ...initialState }),
    }),
    {
      name: STORAGE_KEYS.DOMAIN,
      storage: StorageService.createPersistStorage<DomainStore>(),
      partialize: (state) => ({
        value: state.value,
        items: state.items,
      }),
      version: STORE_VERSION,
      migrate: (_persisted, _version) => initialState,
    },
  ),
);

export const useDomainState = () =>
  useDomainStore(useShallow((s) => ({ value: s.value, items: s.items })));

export const useDomainActions = () =>
  useDomainStore(
    useShallow((s) => ({
      setValue: s.setValue,
      addItem: s.addItem,
      removeItem: s.removeItem,
    })),
  );
