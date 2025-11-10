export type Feature = "linkedin-browser-mode";

const teams = {
  developers: ["lamzihao98@gmail.com", "knamnguyen@gmail.com"],
};

type Team = keyof typeof teams;

interface FeatureFlag {
  emails: string[];
  teams: Team[];
}

const featureFlagConfig = {
  "linkedin-browser-mode": {
    emails: ["tutuhub.malaysia@gmail.com"],
    teams: ["developers"],
  },
} satisfies Record<Feature, FeatureFlag>;

export function isFeatureEnabled(feature: Feature, email: string) {
  const config = featureFlagConfig[feature];
  if (config.emails.includes(email)) {
    return true;
  }

  if (config.teams.some((team) => teams[team].includes(email))) {
    return true;
  }

  return false;
}

export {
  FEATURE_CONFIG,
  DEFAULT_STYLE_GUIDES_FREE,
  DEFAULT_STYLE_GUIDES_PREMIUM,
} from "./premium";
