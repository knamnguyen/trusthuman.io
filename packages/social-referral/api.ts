import { ApifyClient } from "apify-client";

// Initialize the ApifyClient with API token
const client = new ApifyClient({
  token: "<YOUR_API_TOKEN>",
});

// Prepare Actor input
const input = {
  urls: [
    "https://www.linkedin.com/posts/linkedin_no-is-a-complete-sentence-activity-7247998907798978560-J_hB?utm_source=share&utm_medium=member_desktop",
    "https://www.linkedin.com/company/amazon",
    "https://www.linkedin.com/search/results/content/?datePosted=%22past-24h%22&keywords=ai&origin=FACETED_SEARCH",
  ],
  limitPerSource: 10,
  deepScrape: true,
  rawData: false,
};

(async () => {
  // Run the Actor and wait for it to finish
  const run = await client.actor("Wpp1BZ6yGWjySadk3").call(input);

  // Fetch and print Actor results from the run's dataset (if any)
  console.log("Results from dataset");
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  items.forEach((item) => {
    console.dir(item);
  });
})();

import { ApifyClient } from "apify-client";

// Initialize the ApifyClient with API token
const client = new ApifyClient({
  token: "<YOUR_API_TOKEN>",
});

// Prepare Actor input
const input = {
  startUrls: [
    {
      url: "https://www.threads.net/@zuck/post/CuVdfsNtmvh",
    },
  ],
  proxyConfiguration: {
    useApifyProxy: true,
  },
};

(async () => {
  // Run the Actor and wait for it to finish
  const run = await client.actor("7xFgGDhba8W5ZvOke").call(input);

  // Fetch and print Actor results from the run's dataset (if any)
  console.log("Results from dataset");
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  items.forEach((item) => {
    console.dir(item);
  });
})();

import { ApifyClient } from "apify-client";

// Initialize the ApifyClient with API token
const client = new ApifyClient({
  token: "<YOUR_API_TOKEN>",
});

// Prepare Actor input
const input = {
  startUrls: [
    {
      url: "https://www.facebook.com/humansofnewyork/",
    },
  ],
  resultsLimit: 20,
  captionText: false,
};

(async () => {
  // Run the Actor and wait for it to finish
  const run = await client.actor("KoJrdxJCTtpon81KY").call(input);

  // Fetch and print Actor results from the run's dataset (if any)
  console.log("Results from dataset");
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  items.forEach((item) => {
    console.dir(item);
  });
})();

import { ApifyClient } from "apify-client";

// Initialize the ApifyClient with API token
const client = new ApifyClient({
  token: "<YOUR_API_TOKEN>",
});

// Prepare Actor input
const input = {
  tweetIDs: ["1846987139428634858"],
  twitterContent: 'from:elonmusk make -"live laugh love"',
  searchTerms: [
    "from:elonmusk since:2024-01-01_00:00:00_UTC until:2024-01-02_00:00:00_UTC",
    "from:NASA starsince:2024-01-01_00:00:00_UTC until:2024-01-02_00:00:00_UTC",
  ],
  maxItems: 200,
  queryType: "Latest",
  lang: "en",
  from: "elonmusk",
  to: "",
  "@": "",
  list: "",
  "filter:blue_verified": false,
  near: "",
  within: "",
  geocode: "",
  since: "2021-12-31_23:59:59_UTC",
  until: "2024-12-31_23:59:59_UTC",
  since_time: "",
  until_time: "",
  since_id: "",
  max_id: "",
  within_time: "",
  "filter:nativeretweets": false,
  "include:nativeretweets": false,
  "filter:replies": false,
  conversation_id: "",
  "filter:quote": false,
  quoted_tweet_id: "",
  quoted_user_id: "",
  card_name: "",
  "filter:has_engagement": false,
  min_retweets: 0,
  min_faves: 0,
  min_replies: 0,
  "-min_retweets": 0,
  "-min_faves": 0,
  "-min_replies": 0,
  "filter:media": false,
  "filter:twimg": false,
  "filter:images": false,
  "filter:videos": false,
  "filter:native_video": false,
  "filter:vine": false,
  "filter:consumer_video": false,
  "filter:pro_video": false,
  "filter:spaces": false,
  "filter:links": false,
  "filter:mentions": false,
  "filter:news": false,
  "filter:safe": false,
  "filter:hashtags": false,
  url: "",
};

(async () => {
  // Run the Actor and wait for it to finish
  const run = await client.actor("CJdippxWmn9uRfooo").call(input);

  // Fetch and print Actor results from the run's dataset (if any)
  console.log("Results from dataset");
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  items.forEach((item) => {
    console.dir(item);
  });
})();
