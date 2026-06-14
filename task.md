# Task Checklist: GearArts.dev Site Integration

- [x] Update Data Models & Mock Data (`src/models/skills-data.ts`)
  - [x] Add `tags` and `category` fields to `ArtWork` interface.
  - [x] Rewrite `PROFILE` to include user's Bio, Artist Statement, and social links (LinkedIn, 500px, GitHub).
  - [x] Populate `ARTWORKS` array with 8 high-fidelity curated artworks (4 GenAI, 4 Digital Photography) with appropriate tags.

- [x] Create Gallery Query Map Component (`src/components/ui/gallery-query-map.component.ts`)
  - [x] Set up D3 force simulation with Artwork and Tag nodes.
  - [x] Render tag nodes as readable text badges.
  - [x] Render artwork nodes as circles (showing thumbnail tooltips on hover).
  - [x] Implement node clicking to filter tags and display lightboxes.

- [x] Create new visual assets for the galleries
  - [x] Generate GenAI gallery images.
  - [x] Generate Photography gallery images.

- [x] Modify `src/app.component.ts`
  - [x] Update `currentView` signal and navigation routing to support `'galleries'`, `'bio'`, and `'contact'`.
  - [x] Add state signals for active gallery tags, active gallery category tab, and contact form submissions.

- [x] Modify `src/app.component.html`
  - [x] Add Galleries, Bio, and Contact page button triggers in the header.
  - [x] Implement Galleries View casing (collapsible Query Map, category tabs, curated card grid, image lightbox modal).
  - [x] Implement Bio & Artist Statement View casing (elegant high-contrast panels).
  - [x] Implement Contact Form View casing (Name/Email/Message fields with tactile validation states).
  - [x] Append global Footer containing copyright, LinkedIn, 500px, and GitHub.

- [x] Verify
  - [x] Run typescript checks and lint.
  - [x] Run production build compilation (`npm run build`).
  - [x] Manually verify responsiveness, routing paths, and simulation ticks.
