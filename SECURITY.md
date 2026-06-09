# Security Policy (SECURITY.md)

This document describes the security model, compliance guidelines, and reporting procedures for **Pivot & Pulse**.

## Vulnerability Disclosure Policy

If you discover a potential security vulnerability in this project, please **do not** open a public GitHub issue. Instead, report it responsibly:

1. Send an email to the operational team or maintainer: `philgear@gmail.com`.
2. Include a detailed description of the vulnerability, steps to reproduce it, and any potential exploits or proof of concepts.
3. Allow the team reasonable time to verify, fix, and deploy a patch before public disclosure.

---

## HIPAA Compliance Guidelines

Pivot & Pulse is designed to help care teams brainstorm health goals, perspectives, and care plans. However, to guarantee client-side data sovereignty and meet HIPAA requirements:

1. **Strict Client-Side Persistence:** All saved insights, selected strategies, and synthesized care plans are stored **exclusively** in the user's browser via `LocalStorage`. No remote databases or external storage are used.
2. **De-Identification Requirement:**
   - Developers and users **must never** input Protected Health Information (PHI) or Personally Identifiable Information (PII) into the generator or custom perspective fields.
   - Example of acceptable input: *"78 y/o male with CHF, needs support with medication compliance."*
   - Example of unacceptable input: *"John Smith, born Jan 1st 1948, living at 123 Main St, needs support."*
3. **Stateless Express Proxy Logging:**
   - The Express proxy server is configured to run statelessly.
   - The `morgan` logging library is configured to only log anonymized request routes and HTTP statuses. It **does not** log request body contents or query parameters containing sensitive health descriptions.
4. **Data Portability & Destruction:** Users have full control over their data. Clicking **Reset** or **Clear Cache** in the UI instantly wipes all locally stored insights and session history from the client.

---

## Secret Management

1. **Server-Side API Boundaries:** All calls to the Gemini API are proxied through the Express backend. The frontend is never given direct access to raw API keys.
2. **Environment Variables:** Secret keys (e.g., `GEMINI_API_KEY`) are managed via environment variables.
3. **Google Cloud Secret Manager:** When deployed to Google Cloud Run, secrets are injected securely from GCP Secret Manager and mounted as environment variables at runtime. No secrets are ever hardcoded in the codebase or checked into git.
4. **Security Scanning:** Automated tools like CodeQL scan the codebase on pushes to detect accidentally committed secrets or static security vulnerabilities.
