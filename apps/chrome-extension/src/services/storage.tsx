import { createContext, ReactNode, useContext, useEffect, useRef } from "react";
import { getStandaloneTRPCClient } from "@src/trpc/react";
import { Store, useStore } from "@tanstack/react-store";

import type { StorageState } from "@sassy/validators";

type StorageStateKey = keyof StorageState;

const defaultState: StorageState = {
  hasEverSignedIn: false,
  currentCommentCount: 0,
  styleGuide: "",
  selectedStyleKey: "PROFESSIONAL",
  customStyleGuides: [],
  scrollDuration: 5,
  commentDelay: 5,
  maxPosts: 5,
  duplicateWindow: 24,
  timeFilterEnabled: false,
  minPostAge: 1,
  isRunning: false,
  status: "",
  commentCount: 0,
  totalAllTimeComments: 0,
  totalTodayComments: 0,
  postsSkippedDuplicate: 0,
  recentAuthorsDetected: 0,
  postsSkippedAlreadyCommented: 0,
  duplicatePostsDetected: 0,
  postsSkippedTimeFilter: 0,
  commentProfileName: "",
  profileRecord: {},
  commentAsCompanyEnabled: false,
  languageAwareEnabled: false,
  skipCompanyPagesEnabled: false,
  skipPromotedPostsEnabled: false,
  skipFriendsActivitiesEnabled: false,
  blacklistEnabled: false,
  blacklistAuthors: [],
  targetListEnabled: false,
  selectedTargetList: "",
  targetListOptions: [],
  finishListModeEnabled: false,
  authorsFound: [],
  authorsMissing: [],
  authorsPending: [],
  authorsCommented: [],
  manualApproveEnabled: false,
  authenticityBoostEnabled: false,
};

class StoragePersister {
  private listeners: Set<(changes: Partial<StorageState>) => any>;
  private readonly trpc;
  constructor() {
    this.listeners = new Set();
    this.trpc = getStandaloneTRPCClient();
  }

  async save(state: StorageState) {
    await this.trpc.browser.saveBrowserState.mutate(state);
  }

  // can use this to publish changes
  publish(changes: Partial<StorageState>) {
    for (const listener of this.listeners) {
      listener(changes);
    }
  }

  subscribe(changes: (change: Partial<StorageState>) => any) {
    this.listeners.add(changes);
    return () => this.remove(changes);
  }

  remove(cb: (changes: Partial<StorageState>) => any) {
    this.listeners.delete(cb);
  }

  retrieveAll() {
    return this.trpc.browser.getBrowserState.query();
  }
}

function throttle<T extends (...args: any) => any>(cb: T, intervalMs = 5000) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      cb(args);
      timeout = null;
    }, intervalMs);
  };
}

export class AppStorage {
  public store: Store<StorageState>;

  constructor(private readonly persister: StoragePersister) {
    this.store = new Store(defaultState);

    // persister change listens to remote changes from other clients and sets chrome.storage.local state
    this.persister.subscribe((changes) => chrome.storage.local.set(changes));

    // the chrome storage change listener updates the local tanstacks store state for react state to change
    chrome.storage.local.onChanged.addListener((changes) => {
      // TODO: add engagekit namespace here so it doesnt listen to other storage changes
      const updatedState: Partial<StorageState> = {};
      for (const key in changes) {
        const change = changes[key]!;
        updatedState[key as StorageStateKey] = change.newValue;
      }
      this.store.setState((prev) => ({ ...prev, ...updatedState }));
    });
  }

  async hydrate() {
    while (true) {
      try {
        const state = await this.persister.retrieveAll();
        await chrome.storage.local.set({ ...defaultState, ...state });
        await new Promise((resolve) => setTimeout(resolve, 5000));
        break;
      } catch (err) {
        console.error("error hydrating from persister", err);
      }
    }
  }

  async getAll() {
    const state = await chrome.storage.local.get(null);
    return state as Partial<StorageState>;
  }

  async get<Key extends StorageStateKey>(
    keys: Key[],
  ): Promise<{
    [K in Key]: StorageState[K] | undefined;
  }> {
    const state = await chrome.storage.local.get(keys);

    return state as {
      [K in Key]: StorageState[K] | undefined;
    };
  }

  throttledPersist = throttle(async (state: StorageState) => {
    await this.persister.save(state);
  });

  async set(
    updateOrCallback:
      | Partial<StorageState>
      | ((prev: StorageState) => Partial<StorageState>),
  ): Promise<void> {
    const updates =
      typeof updateOrCallback === "function"
        ? updateOrCallback(this.store.state)
        : updateOrCallback;

    const fullState = { ...this.store.state, ...updates };

    // just set with chrome.storage.local, cause the listener will update the tanstack/store
    await chrome.storage.local.set(updates);

    // its important for persister to detect changes came from other clients and not self,
    // so that there is no self recursive changes
    void this.throttledPersist(fullState);
  }
}

export const storagePersister = new StoragePersister();
export const appStorage = new AppStorage(storagePersister);

const AppStorageContext = createContext<AppStorage | null>(null);

export function AppStorageContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const storageRef = useRef(appStorage);

  useEffect(() => {
    // void storageRef.current.hydrate();
  }, []);

  return (
    <AppStorageContext.Provider value={storageRef.current}>
      {children}
    </AppStorageContext.Provider>
  );
}

export function useStorage() {
  const storage = useContext(AppStorageContext);
  if (!storage) {
    throw new Error(
      "useAppStorage must be used within an AppStorageContextProvider",
    );
  }
  return storage;
}

export function useStorageState(): StorageState;
export function useStorageState<TSelected>(
  selector: (state: StorageState) => TSelected,
): TSelected;
export function useStorageState<TSelected>(
  selector?: (state: StorageState) => TSelected,
) {
  const storage = useStorage();
  return useStore(storage.store, selector);
}
