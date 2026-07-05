# Security Policy (SECURITY.md)

This document describes the security architecture, compliance model, and reporting guidelines for **Pivot & Pulse** (InsightSpark).

---

## 🔒 Responsible AI & Privacy Shield (PII Scanner)

To prevent transmission of Protected Health Information (PHI) or Personally Identifiable Information (PII) to remote LLMs under HIPAA compliance, the application implements a multi-tier **Privacy Shield**:

1. **Client-Side Scanner**: 
   Before sending a text prompt to the backend, the client scans user inputs against local regular expressions for:
   * **Email Addresses**: `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g`
   * **Phone Numbers**: `/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g`
   * **Social Security Numbers (SSN)**: `/\b\d{3}-\d{2}-\d{4}\b/g`
   * **IP Addresses**: `/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g`
   If PII is detected, the frontend blocks submission and displays a clear warning card instructing the user to de-identify the query.
2. **Server-Side Validation**:
   Inputs are validated using `express-validator` to ensure all properties conform to expected schema types and strings are sanitized to mitigate injection vulnerabilities.

---

## 🌐 Network Security & HTTP Headers

The Express proxy server implements security-hardened headers using **Helmet.js** to secure transport layer interactions and mitigate client-side attacks:

1. **Content Security Policy (CSP)**:
   Restricts where scripts, stylesheets, fonts, and frame connections can originate. 
   * Authorized script sources: `'self'`, `'unsafe-inline'`, `'unsafe-eval'`, and Google Sign-in clients.
   * Authorized connection sources: `'self'` and Google Accounts.
2. **Frame / Clickjacking Protection**:
   `frameguard` is disabled in favor of strict, scoped `frameAncestors` directives. The app is forbidden from being loaded in an iframe on unauthorized external sites, but is explicitly permitted to embed inside approved domains:
   * `'self'`
   * `https://pocketgull.app` (including subdomains)
   * `https://philgear.dev` (including subdomains like `spark.philgear.dev`)
3. **CORS Configuration**:
   Cross-Origin Resource Sharing is enabled explicitly to prevent unauthorized browser-level API requests from arbitrary websites.

---

## 🚦 API Rate Limiting

To prevent DoS (Denial of Service) attacks, billing exploitation, and prompt-stuffing abuse, the backend implements granular rate limits via `express-rate-limit`:

* **Global Connection Rate Limit**: 100 requests per 15-minute window per IP.
* **API Endpoints Scoped Limit (`/api/`)**: Stricter limit of 20 requests per 15-minute window per IP. Excess calls return a `429 Too Many Requests` status block.

---

## 🔑 Secret & API Key Management

1. **Proxy Boundaries**: All connections to the Gemini LLM are authenticated backend-to-backend on the proxy server. The client is never exposed to master API keys.
2. **User Keys**: When users provide their own keys in the app overlay, the key is stored strictly client-side inside the user's browser `LocalStorage` and injected dynamically into headers (`x-gemini-api-key`) for proxy transmission.
3. **GCP Secret Manager**: Server-side deployment variables are securely injected at build/execution time from GCP Secret Manager.
4. **Offline Demo Sandboxing**: Selecting "Try a Demo" injects `demo-key-active` to mock data locally, executing zero fetch requests and preventing data leakage.

---

## 🐞 Vulnerability Disclosure Policy

If you discover a potential security vulnerability, please **do not** open a public issue. Report it responsibly:

1. Email the operational maintainer directly at: `phil@geararts.dev`.
2. Include a description of the vulnerability, reproduction steps, and potential exploit vectors.
3. Allow the team reasonable time to verify, fix, and deploy a patch before public disclosure.
