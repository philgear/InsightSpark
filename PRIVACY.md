# Privacy Policy for Pivot & Pulse

*Last Updated: June 10, 2026*

Your privacy is our core priority. **Pivot & Pulse** (the "Application") is engineered to give you complete control and ownership over your data. Because of this, our systems are built around client-side data sovereignty.

---

## 1. What We Collect (And What We Don't)

*   **No User Accounts:** The Application does not require registration, sign-up, or accounts. We do not collect your name, email address, or identity.
*   **No Centralized Database:** We do not host or operate a database. Your saved bookmarks, custom insights, and care plans are stored **exclusively in your browser's local storage (`localStorage`)**. This data never leaves your device unless you choose to copy it to your clipboard.
*   **API Keys:** Your Google Gemini API Key is stored only on your own device inside browser memory (`localStorage`). Our backend acts as a stateless proxy to forward your request securely to Google's API, and it does not store, log, or reuse your key.
*   **No Analytics or Tracking Cookies:** We do not use tracking cookies, analytics pixels, or third-party tracking scripts.

---

## 2. Data Processing and Safety Guardrails

To ensure compliance with health privacy best practices (including HIPAA standards in Care Mode), the Application implements the following local and server-side safety layers:

*   **PII Sanitization:** The Application includes a local detection engine that scans inputs for structured patterns matching Personally Identifiable Information (PII) like email addresses, phone numbers, SSNs, and IP addresses. If detected, processing is immediately blocked before the query leaves your device.
*   **Stateless Transmission:** When you request structured insights or a care plan synthesis, the text is sent to the Gemini model. This transmission is encrypted in transit (HTTPS). No input text or output results are saved on our servers.

---

## 3. Third-Party Services (Google Gemini API)

Because generation features rely on the **Google Gemini API**, the inputs you send to generate insights are processed by Google. 
*   According to Google's terms for developer API keys (such as those obtained via Google AI Studio), data submitted through the API is generally not used to train Google models, but we advise checking [Google AI Studio's Privacy Policy](https://ai.google.dev/support/privacy) for their latest policies.
*   We strongly recommend never entering identifiable medical, personal, or financial records.

---

## 4. Your Control Over Your Data

Since all data lives on your device, you are in absolute control:
*   To delete your stored API Key, click the key icon (🔑) in the header.
*   To delete all saved insights and care plans, clear your browser's local storage/cache for the Application's domain.

---

## 5. Contact and Open Source Sovereignty

As an open, localized thinking companion, you can audit, run, or host the code yourself to ensure maximum privacy isolation.
