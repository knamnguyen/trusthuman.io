import { Store } from "@tanstack/react-store";

interface StorageState {
  scrollDuration: number;
  commentDelay: number;
  customStyleGuides: { name: string; prompt: string }[];
  commentCount: number;
  status: string;
  maxPosts: number;
  duplicateWindow: number;
  styleGuide: string;
  apiKey?: string;
  commentAsCompanyEnabled: boolean;
  timeFilterEnabled: boolean;
  minPostAge: number;
  finishListModeEnabled: boolean;
  targetListEnabled: boolean;
  totalTodayComments: number;
  selectedTargetList: string;
  commentProfileName: string;
  languageAwareEnabled: boolean;
  skipCompanyPagesEnabled: boolean;
  skipPromotedPostsEnabled: boolean;
  skipFriendsActivitiesEnabled: boolean;
  blacklistEnabled: boolean;
  targetListOptions: string[];
  blacklistAuthors: string;
  manualApproveEnabled: boolean;
  authenticityBoostEnabled: boolean;
  profileRecord: Record<
    string,
    {
      profileUrn?: string;
      lists?: string[];
    }
  >;
  hasEverSignedIn: boolean;
  totalAllTimeComments: number;
  isRunning: boolean;
  authorsFound: string[];
  authorsMissing: string[];
  authorsPending: string[];
  authorsCommented: string[];
  currentCommentCount: number;
  postsSkippedDuplicate: number;
  recentAuthorsDetected: number;
  postsSkippedAlreadyCommented: number;
  duplicatePostsDetected: number;
  postsSkippedTimeFilter: number;
  selectedStyleKey: string;
}

type StorageStateKey = keyof StorageState;

interface StoragePersister<
  State extends Record<string, any> = Record<string, any>,
> {
  save(state: Partial<State>): Promise<void>;
  retrieve<K extends keyof State>(
    keys: K[],
  ): Promise<{ [key in K]?: State[key] }>;
  onStateChange(changes: (change: Partial<State>) => any): void;
  retrieveAll(): Promise<Partial<State>>;
}

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
  blacklistAuthors: "",
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

export class AppStorage {
  public hydrated: Promise<void>;
  public store: Store<StorageState>;

  constructor(private readonly persister: StoragePersister<StorageState>) {
    this.store = new Store(defaultState);
    this.hydrated = this.hydrate();

    // persister change listens to remote changes from other clients and sets chrome.storage.local state
    this.persister.onStateChange((changes) =>
      chrome.storage.local.set(changes),
    );

    // the chrome storage change listener updates the local tanstacks store state for react state to change
    chrome.storage.local.onChanged.addListener((changes) => {
      const updatedState: Partial<StorageState> = {};
      for (const key in changes) {
        const change = changes[key]!;
        updatedState[key as StorageStateKey] = change.newValue;
      }
      this.store.setState((prev) => ({ ...prev, ...updatedState }));
    });
  }

  async hydrate() {
    const state = await this.persister.retrieveAll();
    await this.set({ ...defaultState, ...state });
    this.store.setState((prev) => ({ ...prev, ...state }));
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

  async set(
    updateOrCallback:
      | Partial<StorageState>
      | ((prev: StorageState) => Partial<StorageState>),
  ): Promise<void> {
    const updates =
      typeof updateOrCallback === "function"
        ? updateOrCallback(this.store.state)
        : updateOrCallback;

    // just set with chrome.storage.local, cause the listener will update the tanstack/store
    await chrome.storage.local.set(updates);

    // its important for persister to detect changes came from other clients and not self,
    // so that there is no self recursive changes
    await this.persister.save(updates);
  }
}

export class AppStorageStore extends Store<StorageState> {
  public synced: Promise<void>;

  constructor(private readonly storage: AppStorage) {
    super(defaultState, {
      onUpdate: () => {},
    });
    this.synced = this.sync();
  }

  private async sync() {
    await this.storage.hydrated;
    const state = await this.storage.getAll();
    this.setState((prev) => ({ ...prev, ...state }));
  }
}
