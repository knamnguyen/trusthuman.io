# Chrome Web Store Permission Justifications

## Extension Purpose

EngageKit is a specialized LinkedIn automation tool that helps users generate and post AI-powered comments on LinkedIn posts to increase their professional engagement and network growth.

## Permission Justifications

### activeTab

**Purpose**: Essential for the extension's core functionality when users interact with the popup interface.

**Usage**: This permission allows the popup to detect when a user is on LinkedIn and enables the extension to verify the current page context. It provides the minimum access needed for the popup to function while the user actively engages with the extension interface.

**Code Reference**: Used in popup components to determine page context and enable/disable features based on the current tab.

### tabs

**Purpose**: Critical for LinkedIn automation workflow and authentication flow management.

**Usage**:

- **LinkedIn Automation**: Creates and manages a dedicated LinkedIn tab for the commenting automation process. The extension opens `https://www.linkedin.com/feed/` in a pinned tab to prevent browser throttling during automation.
- **Authentication**: Opens authentication tabs to `engagekit.io` domain for secure user sign-in/sign-out flows.
- **Tab Management**: Monitors tab lifecycle to properly stop automation if the LinkedIn tab is closed manually.

**Code Reference**:

- `chrome.tabs.create()` for LinkedIn feed tab creation and authentication flows
- `chrome.tabs.query()` for tab management
- `chrome.tabs.onRemoved.addListener()` for automation cleanup when tabs are closed

### storage

**Purpose**: Stores user preferences, session data, and automation state locally for seamless user experience.

**Usage**:

- User configuration settings (comment style, timing preferences, post limits)
- Authentication session persistence
- Daily comment counters and usage statistics
- Automation state management (current progress, paused state)

**Code Reference**: Used throughout popup and background scripts for persisting user preferences and maintaining state between browser sessions.

### cookies

**Purpose**: Essential for maintaining synchronized authentication state between the extension and the main EngageKit website.

**Usage**:

- Enables single sign-on experience between `engagekit.io` website and Chrome extension
- Maintains session synchronization for seamless user experience
- Prevents users from needing to authenticate separately in extension vs website

**Code Reference**: Used by authentication service to sync login state with the main application.

### alarms

**Purpose**: Maintains reliable background authentication monitoring and session management.

**Usage**:

- Periodically checks authentication token validity to prevent unexpected logout
- Schedules background session refreshes to maintain continuous service
- Ensures user remains authenticated during long automation sessions

**Code Reference**: Background script uses chrome.alarms for periodic authentication status verification.

## Host Permissions

### https://_.linkedin.com/_

**Purpose**: Core functionality domain - where the extension performs its primary commenting automation.

**Usage**: Content scripts inject into LinkedIn pages to:

- Detect posts in the user's LinkedIn feed
- Extract post content for AI analysis
- Generate and submit comments through LinkedIn's interface
- Monitor automation progress and handle errors

### Authentication & Service Domains

**Domains**:

- `https://aistudio.google.com/*` - AI service integration
- `https://*.clerk.accounts.dev/*` - Authentication service
- `https://*.clerk.dev/*` - Authentication service
- `https://engagekit.io/*` - Main application domain
- `https://accounts.engagekit.io/*` - Account management
- `https://clerk.engagekit.io/*` - Authentication subdomain

**Purpose**: These domains support the extension's authentication flow and AI comment generation services. They enable secure communication with backend services without requiring users to manually configure API endpoints.

## Security & Privacy Notes

- All permissions are used exclusively for their stated purposes
- No data is collected beyond what's necessary for the core LinkedIn commenting functionality
- User authentication data is handled securely through established authentication service (Clerk)
- Extension operates only when explicitly activated by the user
- All automation includes user-configurable delays and limits to respect LinkedIn's platform

## Single Purpose Compliance

This extension has a single, focused purpose: **LinkedIn comment automation using AI**. All permissions directly support this core functionality:

- **activeTab/tabs**: Manage LinkedIn automation interface
- **storage**: Persist user preferences and session data
- **cookies**: Maintain authentication state
- **alarms**: Ensure reliable service operation
- **host_permissions**: Access LinkedIn for automation and backend services for AI/auth

The extension does not provide multiple unrelated functionalities and maintains a narrow, easy-to-understand purpose focused solely on LinkedIn engagement automation.
