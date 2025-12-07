import { DBOS } from "@dbos-inc/dbos-sdk";

import type { StartAutoCommentingParams } from "@sassy/validators";
import { db } from "@sassy/db";
import {
  autoCommentConfigurationDefaults,
  DEFAULT_STYLE_GUIDES,
} from "@sassy/feature-flags";

import type { ProxyLocation } from "../utils/browser-session";
import { BrowserSession } from "../utils/browser-session";
import { transformValuesIfMatch } from "../utils/commons";
import { AsyncMutex } from "../utils/mutex";

export const runAutoCommentWorkflow = DBOS.registerWorkflow();
