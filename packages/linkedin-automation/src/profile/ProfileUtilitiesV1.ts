import type {
  OnTargetsChange,
  ProfileUtilities,
  SaveButtonProfileInfo,
} from "./types";
import { extractProfileInfoFromSaveButton } from "./utils-v1/extract-profile-info-from-save-button";
import { watchForAuthorProfiles } from "./utils-v1/watch-for-author-profiles";

export class ProfileUtilitiesV1 implements ProfileUtilities {
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
