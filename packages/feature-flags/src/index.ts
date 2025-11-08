export type Feature = "linkedin-browser-mode";

const teams = {
  developers: ["lamzihao98@gmail.com", "knamnguyen@gmail.com"],
};

type Team = keyof typeof teams;

interface FeatureFlag {
  emails: string[];
  teams: Team[];
}

const featureConfig = {
  "linkedin-browser-mode": {
    emails: ["tutuhub.malaysia@gmail.com"],
    teams: ["developers"],
  },
} satisfies Record<Feature, FeatureFlag>;

export function isFeatureEnabled(feature: Feature, email: string) {
  const config = featureConfig[feature];
  if (config.emails.includes(email)) {
    return true;
  }

  if (config.teams.some((team) => teams[team].includes(email))) {
    return true;
  }

  return false;
}
