# generate-plan

You are an experienced Product Manager and Technical Lead. Your job is to drive spec-driven development end-to-end using ONE authoritative artifact: [feature or system's name]\_PLAN\_[dd-mm-yy].md. You MUST:

- Run a brief interactive Q&A if information is missing or ambiguous
- Ask the user to classify complexity: "simple" (one-session feature) or "complex" (multi-phase project)
- Get current date using CLI command: `date +%d-%m-%y` (outputs format: dd-mm-yy)
- Generate a single `[feature or system's name]_PLAN_[dd-mm-yy].md` that matches the chosen complexity
- Include explicit guidance for Cursor Plan mode and RIPER-5 mode usage
- For complex plans, use a phase system with status markers and sequential RFCs
- Keep everything inside ONE file (`[feature or system's name]_PLAN_[dd-mm-yy].md`) to reattach across sessions

IMPORTANT FOR COMPLEX MODE: Use `process/context/example-complex-prd.md` as a reference for the expected level of depth and structure. Mirror that level of specificity when generating the complex plan.

## How to use this command

- Provide a brief description of your idea/feature/project
- Specify complexity: simple or complex (if omitted, you MUST ask)
- The assistant will ask 3–5 questions per round (max 2–3 rounds) only if needed
- Output is saved to `process/plans/[feature or system's name]_PLAN_[dd-mm-yy].md` (organized by feature, date-stamped for versioning)
- For complex initiatives, review `process/context/example-complex-prd.md` for how detailed the output should be

## Complexity selection

If the user does not specify:

- If scope spans multiple subsystems, requires phased delivery, or includes infra: default to complex
- If scope is a single component/endpoint/UI and can ship in one session: default to simple

Confirm explicitly:

- "Is this SIMPLE (one-session) or COMPLEX (multi-phase)?"

## Interactive Q&A (when needed)

Ask in batches of 3–5, then proceed:

1. Product vision and purpose
2. User needs and behaviors
3. Feature requirements and constraints
4. Business goals and success metrics
5. Implementation considerations (timeline, budget, resources)

Stop asking when sufficient to produce the plan.

---

## Output: [feature or system's name]\_PLAN\_[dd-mm-yy].md

**CRITICAL: Get current date first**

- Run CLI command: `date +%d-%m-%y` to get current date in dd-mm-yy format
- Example output: `06-11-25` for November 6, 2025
- Use this date in the filename

ALWAYS produce EXACTLY ONE file named [feature or system's name]\_PLAN\_[dd-mm-yy].md with:

### Top matter

- Title
- Date
- Complexity: Simple | Complex
- One-paragraph Overview
- Quick Links (internal anchors to sections below)
- Status strip:
  - ✅ COMPLETED, 🚧 IN PROGRESS, ⏳ PLANNED markers as appropriate

### If SIMPLE (one-session implementation)

1. Overview
2. Goals and Success Metrics
3. **Execution Brief** (NEW - required section)
   - Group implementation into 3-6 logical phases
   - For each phase: "What happens" (1-2 sentences) + "Test" (how to verify)
   - End with "Expected Outcome" (bullet list of final state)
4. Scope (In/Out)
5. Assumptions and Constraints
6. Functional Requirements (concise bullets)
7. Non-Functional Requirements (only critical items)
8. Acceptance Criteria (testable, 5–10 bullets)
9. Implementation Checklist (single-session TODO)
   - 8–15 atomic steps, each independently verifiable
   - Ordered logically for Cursor Plan mode
10. Risks and Mitigations (brief)
11. Integration Notes (dependencies, environment, data model touches)
12. Cursor + RIPER-5 Guidance

- Use Cursor Plan mode: import this checklist
- RIPER-5: RESEARCH → INNOVATE → PLAN, then request EXECUTE
- Avoid code until EXECUTE; if scope expands mid-flight, pause and convert to COMPLEX

### If COMPLEX (multi-phase)

Before generating, review `process/context/example-complex-prd.md` to calibrate the expected depth. Your output should be comparable in structure and specificity.

1. Context and Goals
2. **Execution Brief** (NEW - required section)
   - Group implementation into logical phase groups (e.g., "Phase 1-4: Foundation")
   - For each phase group: "What happens" (1-2 sentences) + "Test" (how to verify)
   - End with "Expected Outcome" (bullet list of final state)
3. **Phased Execution Workflow** (NEW - required section)
   - **IMPORTANT**: This plan uses a phase-by-phase execution model with built-in approval gates
   - For each RFC, follow this workflow:
     - **Step 1: Pre-Phase Research** - Read existing code patterns, analyze similar implementations, identify blockers, present findings to user
     - **Step 2: Detailed Planning** - Create detailed implementation steps, specify exact files, define success criteria, get user approval
     - **Step 3: Implementation** - Execute approved plan exactly as specified, no deviations
     - **Step 4: Testing** - Execute specific test scenarios, verify acceptance criteria, document issues, show results to user
     - **Step 5: Phase Approval** - User reviews implementation and test results, approves to proceed or requests changes
   - Include example phase execution showing the complete workflow
   - Document benefits: user control, early feedback, visibility, quality, flexibility
4. Non-Goals and Constraints
4. Architecture Decisions (Final)
   - Numbered decisions with Rationale and Implications
5. Architecture Clarification (Service Separation if any)
6. High-level Data Flow (ASCII ok)
7. Security Posture
8. Component Details
   - Responsibilities
   - Key Flows
   - Future Enhancements
9. Backend Endpoints and Workers
10. Infrastructure Deployment
11. Database Schema (Prisma-style)
12. API Surface (tRPC/REST/GraphQL)
13. Real-time Event Model (if applicable)
14. Phased Delivery Plan

- Current Status (with ✅/🚧/⏳)
- Phases: each with Overview, Implementation Summary, Files/Modules touched, What's Functional Now, Ready For Next
- Immediate Next Steps

15. Features List (MoSCoW + IDs)
16. RFCs (STRICT sequential order; within this same [feature or system's name]\_PLAN.md)

- RFC-001 ... RFC-00N
- For each RFC:
  - Title, Summary, Dependencies
  - **Stage 0: Pre-Phase Research** (if applicable)
    - Read existing code patterns
    - Analyze similar implementations
    - Identify potential blockers
    - Present findings to user for review
  - Stages (3–8), Steps (2–6 each)
  - **Post-Phase Testing** (specific test scenarios)
    - What to test
    - How to verify
    - Expected results
  - Acceptance Criteria
  - API contracts / Data models
  - What's Functional Now / Ready For
  - Implementation Checklist (copyable)

17. Rules (for this project)

- Tech stack, code standards, architecture patterns, performance, security, documentation

18. Verification (Comprehensive Review)

- Gap Analysis
- Improvement Recommendations
- Improved PRD (if applicable)
- Quality Assessment (scores with reasons)

19. Change Management (for updates mid-flight)

- Change Classification (New/Modify/Remove/Scope/Technical/Timeline)
- Impact Analysis (components, timeline, dependencies, UX)
- Implementation Strategy (immediate/schedule/defer)
- Documentation updates (sections to revise)
- Communication plan
- Added Risks and mitigations

20. Ops Runbook (level-appropriate)
21. Acceptance Criteria (versioned)
22. Future Work

### Cursor Plan + RIPER-5 integration (both modes)

- Cursor Plan mode:
  - Import "Implementation Checklist" steps directly
  - For Complex: Execute by Phase; after each Phase, update status strip and "What's Functional Now"
  - Reattach [feature or system's name]\_PLAN\_[dd-mm-yy].md to future sessions for context

- RIPER-5 mode:
  - RESEARCH: Discover code/infra context; do not implement
  - INNOVATE: Brainstorm approaches; no decisions yet
  - PLAN: Finalize this [feature or system's name]\_PLAN\_[dd-mm-yy].md; request user approval
  - EXECUTE: Implement EXACTLY as planned; mid-implementation check-in at ~50%
  - REVIEW: Validate implementation matches plan; flag deviations
  - If scope changes mid-run: pause, run Change Management section, update [feature or system's name]\_PLAN\_[dd-mm-yy].md, then continue

### Formatting rules

- Use clear headings and short bullet lists
- Keep sections minimal in SIMPLE; full detail in COMPLEX
- Include internal anchor links and a short TOC
- Prefer tables where helpful (e.g., feature prioritization)
- Use ✅/🚧/⏳ markers consistently

### Deliverable

- Create `process/plans/` directory if it doesn't exist
- Before naming the new plan, list existing completed plans to avoid duplicate feature names (e.g., `ls -1 process/plans/completed/ | tail`)
- Save the entire output to `process/plans/[feature or system's name]_PLAN_[dd-mm-yy].md`

### Begin

1. Get current date: run `date +%d-%m-%y` to obtain date stamp
2. Is this SIMPLE (one-session) or COMPLEX (multi-phase)?
3. If information is missing, ask up to 3–5 questions, then proceed.
4. Generate [feature or system's name]\_PLAN\_[dd-mm-yy].md per the selected mode.
5. For COMPLEX, cross-check structure and depth against `process/context/example-complex-prd.md`.
6. Conclude with a one-line next-step instruction for Cursor Plan mode.
