export type ApproveRowMapping = {
  urn: string;
  postContainer: HTMLElement;
  editorField: HTMLElement;
  rowEl: HTMLDivElement;
  inputEl: HTMLDivElement;
  scrollBtn: HTMLButtonElement;
  removeBtn: HTMLButtonElement;
};

export type ApproveContext = {
  panel: HTMLDivElement;
  list: HTMLDivElement;
  mapByUrn: Map<string, ApproveRowMapping>;
  isUpdatingFromRow: boolean;
  isUpdatingFromEditor: boolean;
  defaultText: string;
  activeUrns: Set<string>;
};

export type ManualApproveCommonParams = {
  maxPosts: number;
  timeFilterEnabled: boolean;
  minPostAge: number;
  skipCompanyPages: boolean;
  skipPromotedPosts: boolean;
  skipFriendsActivities: boolean;
  blacklistEnabled: boolean;
  blacklistList: string[];
  styleGuide: string;
};
