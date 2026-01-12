import type {
  OnTargetsChange,
  ProfileUtilities,
  SaveButtonProfileInfo,
} from "./types";
import { extractProfileInfoFromSaveButton } from "./utils-v2/extract-profile-info-from-save-button";
import { watchForAuthorProfiles } from "./utils-v2/watch-for-author-profiles";

export class ProfileUtilitiesV2 implements ProfileUtilities {
  watchForAuthorProfiles(onChange: OnTargetsChange): () => void {
    return watchForAuthorProfiles(onChange);
  }

  extractProfileInfoFromSaveButton(
    anchorElement: Element,
    container: Element
  ): SaveButtonProfileInfo {
    return extractProfileInfoFromSaveButton(anchorElement, container);
  }
}
