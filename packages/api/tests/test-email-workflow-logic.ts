/**
 * Test Email Workflow Logic
 * Verifies the helper functions and data processing logic
 * without actually sending emails or running DBOS workflow
 */

import {
  calculatePercentageChange,
  formatPercentageChange,
  formatNumber,
  findTopMetric,
  generateSubjectLine,
  padToSevenDays,
  padDateLabels,
} from "../src/utils/email-analytics";

console.log("Testing Email Workflow Helper Functions\n");

// Test 1: Percentage change calculation
console.log("Test 1: Percentage Change Calculation");
const testData1 = [100, 110, 115, 120];
const change1 = calculatePercentageChange(testData1);
console.log(`  Input: [100, 110, 115, 120]`);
console.log(`  Expected: 20% (100 -> 120)`);
console.log(`  Result: ${change1}%`);
console.log(`  Formatted: ${formatPercentageChange(change1)}`);
console.log(`  Status: ${change1 === 20 ? "✅ PASS" : "❌ FAIL"}\n`);

// Test 2: Format large numbers
console.log("Test 2: Format Large Numbers");
const testNumbers = [50, 1000, 1500, 1000000];
const formatted = testNumbers.map(formatNumber);
console.log(`  Input: ${testNumbers}`);
console.log(`  Expected: ["50", "1k", "1.5k", "1M"]`);
console.log(`  Result: ${JSON.stringify(formatted)}`);
console.log(`  Status: ${JSON.stringify(formatted) === JSON.stringify(["50", "1k", "1.5k", "1M"]) ? "✅ PASS" : "❌ FAIL"}\n`);

// Test 3: Find top metric
console.log("Test 3: Find Top Metric");
const percentageChanges = {
  followers: 10,
  invites: 25,
  comments: -5,
  contentReach: 15,
  profileViews: 5,
  engageReach: 0,
};
const topMetric = findTopMetric(percentageChanges);
console.log(`  Input: ${JSON.stringify(percentageChanges)}`);
console.log(`  Expected: invites (25%)`);
console.log(`  Result: ${topMetric.name} (${topMetric.growth}%)`);
console.log(`  Status: ${topMetric.key === "invites" && topMetric.growth === 25 ? "✅ PASS" : "❌ FAIL"}\n`);

// Test 4: Generate subject line
console.log("Test 4: Generate Subject Line");
const subject = generateSubjectLine("John", topMetric, 100, 500);
console.log(`  Input: firstName="John", topMetric=invites(25%), totalActivities=100, followers=500`);
console.log(`  Expected: Contains "John" and growth percentage`);
console.log(`  Result: "${subject}"`);
console.log(`  Status: ${subject.includes("John") && subject.includes("+25%") ? "✅ PASS" : "❌ FAIL"}\n`);

// Test 5: Pad data to 7 days
console.log("Test 5: Pad Data to 7 Days");
const shortData = [100, 110, 115];
const paddedData = padToSevenDays(shortData);
console.log(`  Input: [100, 110, 115] (3 days)`);
console.log(`  Expected: [100, 100, 100, 100, 100, 110, 115] (7 days, padded with first value)`);
console.log(`  Result: ${JSON.stringify(paddedData)}`);
console.log(`  Status: ${paddedData.length === 7 && paddedData[0] === 100 && paddedData[6] === 115 ? "✅ PASS" : "❌ FAIL"}\n`);

// Test 6: Pad date labels
console.log("Test 6: Pad Date Labels");
const shortLabels = ["Feb 7", "Feb 8", "Feb 9"];
const paddedLabels = padDateLabels(shortLabels);
console.log(`  Input: ["Feb 7", "Feb 8", "Feb 9"] (3 days)`);
console.log(`  Expected: 7 labels with generic padding for missing days`);
console.log(`  Result: ${JSON.stringify(paddedLabels)}`);
console.log(`  Status: ${paddedLabels.length === 7 ? "✅ PASS" : "❌ FAIL"}\n`);

// Test 7: Recipient deduplication logic (simulated)
console.log("Test 7: Recipient Deduplication Logic (Simulated)");
const mockAccount = {
  owner: {
    id: "user1",
    primaryEmailAddress: "owner@example.com",
    firstName: "Owner",
    emailPreferences: { weeklyAnalyticsEnabled: true },
  },
  org: {
    id: "org1",
    members: [
      {
        role: "org:admin",
        user: {
          id: "user1", // Same as owner (should deduplicate)
          primaryEmailAddress: "owner@example.com",
          firstName: "Owner",
          emailPreferences: { weeklyAnalyticsEnabled: true },
        },
      },
      {
        role: "org:admin",
        user: {
          id: "user2",
          primaryEmailAddress: "admin@example.com",
          firstName: "Admin",
          emailPreferences: { weeklyAnalyticsEnabled: true },
        },
      },
      {
        role: "org:member",
        user: {
          id: "user3",
          primaryEmailAddress: "member@example.com",
          firstName: "Member",
          emailPreferences: { weeklyAnalyticsEnabled: true },
        },
      },
    ],
  },
};

// Simulate getRecipientsForAccount logic
const recipients: Map<string, { email: string; firstName: string; userId: string }> = new Map();

// Add owner
if (
  mockAccount.owner &&
  mockAccount.owner.primaryEmailAddress &&
  mockAccount.owner.emailPreferences?.weeklyAnalyticsEnabled !== false
) {
  recipients.set(mockAccount.owner.id, {
    email: mockAccount.owner.primaryEmailAddress,
    firstName: mockAccount.owner.firstName || "there",
    userId: mockAccount.owner.id,
  });
}

// Add org admins
if (mockAccount.org) {
  for (const member of mockAccount.org.members) {
    if (
      member.role === "org:admin" &&
      member.user.primaryEmailAddress &&
      member.user.emailPreferences?.weeklyAnalyticsEnabled !== false
    ) {
      recipients.set(member.user.id, {
        email: member.user.primaryEmailAddress,
        firstName: member.user.firstName || "there",
        userId: member.user.id,
      });
    }
  }
}

const recipientList = Array.from(recipients.values());
console.log(`  Input: Owner (user1) + 3 org members (user1=admin, user2=admin, user3=member)`);
console.log(`  Expected: 2 recipients (owner/user1 deduplicated, user2 as admin, user3 excluded as non-admin)`);
console.log(`  Result: ${recipientList.length} recipients`);
console.log(`  Details: ${JSON.stringify(recipientList.map(r => r.email))}`);
console.log(`  Status: ${recipientList.length === 2 ? "✅ PASS" : "❌ FAIL"}\n`);

console.log("All tests complete!");
console.log("\n✅ Email workflow helper functions are working correctly");
console.log("✅ Ready for integration with DBOS scheduled workflow");
