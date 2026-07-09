# Universal Agency AI Coding Instructions

## 1. Non-Technical User Guardrails & Plan Mode Mandatory Enforcement
- **CRITICAL:** The active operator of this repository workspace session is a **NON-TECHNICAL USER/CLIENT**. 
- **DO NOT** use complex programming jargon, raw system error codes, or deep architectural terminology when communicating in chat. Keep all interactions focused on user-visible layout outcomes, design aesthetics, and simple functional steps.
- **AMBIGUITY THRESHOLD (PLAN MODE FORCE):** If a user request is incomplete, vague, or short (e.g., "fix the home page banner", "change the footer text", "make a slider"), **YOU MUST IMMEDIATELY HALT AND DROP INTO PLAN MODE**. 
- **DO NOT** touch any code or initialize a branch yet. Instead, formulate a structured list of clear, non-technical, multi-turn clarifying questions (e.g., "What color should the text be?", "Should it scroll automatically?"). 
- Proceed to code **ONLY** after the client confirms the missing parameters.

## 2. Model Context Protocol (MCP) Tool Integration
- **GITHUB CLOUD AGENT MCP (deployments & preview URLs):** This repository is configured with the **`cloudflare-api`** MCP server in GitHub Copilot settings. You **MUST** use it to fetch real Cloudflare Pages deployment status and preview URLs. **Never guess or construct preview URLs manually.**
- **CURSOR MCP (local development):** When working in Cursor, custom MCP servers under **`.cursor/`** expose framework specs (Nuxt, Content, etc.). Use those for code changes in the IDE.
- **EXECUTION RULE:** For layout or content work, prefer MCP tools over stale training data. For staging preview links after a push, always use the GitHub repo **`cloudflare-api`** MCP server.

## 3. Mandatory Configuration & Schema Synchronization
- The content ecosystem relies on a dual-layered architectural blueprint. You must guarantee that code layouts and structural text keys match perfectly.
- **ALWAYS** check for and synchronize properties between the **Sveltia CMS schema (`/public/admin/config.yml`)** and the **Nuxt Content database configuration (`nuxt.config.ts` or custom JSON models)**.
- If you add or alter a data attribute field widget string (e.g., adding a new field to Sveltia's text editor configurations), you must simultaneously append that matching data property parsing rule inside your Nuxt configuration files. They can never drift out of sync.

## 4. Isolated Git-Ops & Branching Policy
- **Absolute Rule:** Never write, commit, or push adjustments straight onto the `main` branch.
- Always check out an isolated tracking feature branch prefixed with `agent/` (e.g., `agent/banner-fix`).

## 5. Staging Preview Verification & Forced Control Loop
Before declaring any issue resolved, finalizing code alterations, or attempting to merge a branch into production, you MUST execute this checkpoint sequence:

1. **Push & Build:** Push your feature branch (`agent/...`) to origin so Cloudflare Pages starts a preview build.

2. **Fetch Preview URL via MCP (mandatory):**
   - Use the **`cloudflare-api`** MCP server configured on this GitHub repository.
   - Query Cloudflare Pages deployments for project **`gitbase-demo`** in the **preview** environment.
   - Filter by the current branch name (normalize `/` and `_` to `-` when matching).
   - Poll until the latest deployment for that branch reports **success**, or tell the client the build is still running.
   - Use the **`url`** field returned by the Cloudflare API. **Do not construct URLs manually.**

3. **Present Staging Link to Client:** Output this block with the **real URL from MCP**:

   > 🛑 **Review Required:** I have created a preview sandbox of your requested changes. You can safely look at and click around the live interactive design right here: **[INSERT MCP-RETURNED PREVIEW URL]**
   >
   > Please test it out! Reply with **"APPROVE AND MERGE"** if it looks exactly how you want it, or let me know what needs to be changed!

4. **Halt for Manual Confirmation:** Do NOT open a Pull Request, merge, or exit until the client replies **"APPROVE AND MERGE"**.

5. **Merge Execution:** After **"APPROVE AND MERGE"**, open a PR and merge into `main`.
