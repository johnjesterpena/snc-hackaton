# SNC SmartResto — Tech Stack & MVP Development Blueprint

**Project:** SNC SmartResto: Digital Restaurant Operations Management System  
**Target client:** SNC 2018 Cafe & Resto, Alupaye, Pagbilao, Quezon  
**Hackathon theme:** Small Business Digitalization  
**Timeline:** 7 days | **Team:** 3–4 students  
**Status:** Updated with client discovery responses provided October 11, 2026. Responses are reported by the project team; confirm workflow details and QR ordering preference before implementation.

## 1. Project Goal

Build a responsive web-based minimum viable product (MVP) that digitizes restaurant menu management, dine-in orders, table status, billing, and basic sales analytics. Prioritize a reliable end-to-end demonstration over excessive features.

**Primary demo flow:** Admin creates menu items → front desk opens a table → staff records the order digitally → kitchen sees the queue and starts preparation timer → kitchen marks food ready → staff serves the order → cashier records payment → sales dashboard reflects the completed transaction.

**Stretch goal:** Customer QR-code ordering for individual tables. Implement only after the primary flow is stable.

## 2. Recommended Tech Stack

| Layer | Technology | Purpose / rationale |
|---|---|---|
| Primary coding assistant | **Google Antigravity OR GitHub Copilot in VS Code** | Choose **one** as the team's primary assistant; keep required prompt log. |
| Language | **TypeScript** | Consistent typing across UI, server, and data models. |
| Full-stack framework | **Next.js (App Router)** | Single repository for UI, server routes/actions, and deployment. |
| UI framework | **React** | Component-based interactive screens. |
| Styling | **Tailwind CSS** | Rapid, responsive styling. |
| UI components | **shadcn/ui** | Accessible reusable UI primitives; customize to restaurant branding. |
| Icons | **Lucide React** | Consistent interface icons. |
| Database | **Supabase Postgres** | Relational persistence for products, orders, payments, and tables. |
| Authentication | **Supabase Auth** | Staff login; protected role-based access. |
| Server validation | **Zod** | Validate incoming order, price, quantity, and status data. |
| Forms | **React Hook Form + Zod resolver** | Reliable menu, order, and admin forms. |
| Charts | **Recharts** | Daily revenue and best-selling product visualizations. |
| QR code (optional) | **qrcode** npm package | Generate table-linked QR codes. |
| Hosting | **Vercel** | Deploy Next.js web app with environment variables. |
| Source control | **Git + GitHub** | Team collaboration, branches, pull requests, and code review. |
| Testing | **Vitest + React Testing Library** | Unit and component tests for critical logic. |
| End-to-end testing | **Playwright** (time permitting) | Test the complete ordering-to-payment flow. |
| Design | **Figma** (optional) | Simple wireframes and demo screens. |

**Why this stack?** A single TypeScript/Next.js codebase reduces integration overhead during a one-week hackathon. Supabase supplies managed Postgres and authentication without requiring a separate custom backend service.

**Prerequisites:** Node.js LTS, npm, Git, GitHub account, selected AI coding assistant, Supabase project, and Vercel account. Check current free-tier quotas, account eligibility, internet access, and deployment restrictions before the event.

## 3. Architecture

```text
Browser (Admin / Cashier / Kitchen Staff)
          |
          v
Next.js UI (React + Tailwind + shadcn/ui)
          |
          v
Next.js Server Actions / Route Handlers
  - Auth and role checks
  - Zod input validation
  - Business rules
  - Transaction-safe payment/order operations
          |
          v
Supabase (PostgreSQL + Authentication)
          |
          v
Analytics queries -> Dashboard charts
```

**Security boundary:** Never trust browser-submitted totals, product prices, role claims, or payment states. The server must calculate totals from authoritative database prices and verify the user's permissions. Keep Supabase service-role credentials server-only; never embed them in browser code. Configure Row Level Security (RLS) appropriately for any direct client access.

## 4. MVP Scope and Priorities

### P0 — Must work in the live demo
1. Staff login/logout and basic roles: **admin**, **cashier**, **kitchen**.
2. Admin menu management: create/edit/disable menu items, prices, categories.
3. Table management: available, occupied; prevent conflicting active orders.
4. Order management: open order, add/remove items, quantities, notes, order status.
5. **Priority kitchen view:** pending → preparing → ready → served, with timestamps, elapsed preparation time, and overdue highlighting based on configurable estimated preparation minutes.
6. Billing: calculate subtotal and total, record cash payment, show printable receipt.
7. Basic dashboard: today's paid sales, completed orders, top-selling items.
8. Seed demo data, error states, and functional deployment.

### P1 — Add only if P0 is stable
- QR code per table opening a read-only digital menu or customer ordering flow.
- Simple date-filtered sales report and CSV export.
- Low-stock indicators **only if** actual inventory records are implemented.

### Out of scope for week one
- Payment gateway / real card charging; GCash integration without approval.
- Complex inventory costing, supplier purchasing, accounting/tax automation.
- Loyalty program, multi-branch support, AI demand forecasting.
- Offline synchronization, delivery integration, advanced reservations.

**Client discovery findings:** Front-desk orders are written on paper and carried inside for preparation; table tracking is manual; sales and receipts are paper-based; dish preparation duration is a major concern; admin should manage menu and financial records. The response 'yes' to the staff-vs-QR question is ambiguous, so confirm the preferred ordering mode. Cooking duration may reflect food preparation constraints rather than handoff delays; the system should measure and surface timing, not promise faster cooking.

## 5. User Roles and Permissions

| Action | Admin | Cashier | Kitchen |
|---|---:|---:|---:|
| View menu | Yes | Yes | Yes |
| Manage menu | Yes | No | No |
| Manage tables/orders | Yes | Yes | View assigned orders |
| Update kitchen status | Yes | Optional | Yes |
| Record payments | Yes | Yes | No |
| View sales analytics | Yes | Optional | No |
| Manage staff access | Yes | No | No |

Enforce these permissions on the server/database, not only by hiding buttons.

## 6. Suggested Database Schema

### `profiles`
- `id` UUID PRIMARY KEY, references auth user
- `display_name` TEXT NOT NULL
- `role` TEXT CHECK IN ('admin', 'cashier', 'kitchen')
- `created_at` TIMESTAMPTZ

### `categories`
- `id` UUID PRIMARY KEY
- `name` TEXT NOT NULL UNIQUE

### `menu_items`
- `id` UUID PRIMARY KEY
- `category_id` UUID REFERENCES categories
- `name` TEXT NOT NULL
- `description` TEXT
- `price` NUMERIC(10,2) NOT NULL CHECK (price >= 0)
- `is_available` BOOLEAN DEFAULT TRUE
- `created_at` TIMESTAMPTZ

### `dining_tables`
- `id` UUID PRIMARY KEY
- `table_number` TEXT NOT NULL UNIQUE
- `capacity` INTEGER
- `status` TEXT CHECK IN ('available','occupied')

### `orders`
- `id` UUID PRIMARY KEY
- `table_id` UUID REFERENCES dining_tables
- `created_by` UUID REFERENCES profiles
- `status` TEXT CHECK IN ('open','preparing','ready','served','completed','cancelled')
- `created_at` TIMESTAMPTZ
- `completed_at` TIMESTAMPTZ

### `order_items`
- `id` UUID PRIMARY KEY
- `order_id` UUID REFERENCES orders
- `menu_item_id` UUID REFERENCES menu_items
- `quantity` INTEGER NOT NULL CHECK (quantity > 0)
- `unit_price_snapshot` NUMERIC(10,2) NOT NULL
- `item_name_snapshot` TEXT NOT NULL
- `notes` TEXT

### `payments`
- `id` UUID PRIMARY KEY
- `order_id` UUID NOT NULL UNIQUE REFERENCES orders
- `amount` NUMERIC(10,2) NOT NULL CHECK (amount >= 0)
- `method` TEXT CHECK IN ('cash')
- `paid_at` TIMESTAMPTZ
- `recorded_by` UUID REFERENCES profiles

**Database safeguards:** Use a unique partial index so a table cannot have multiple active orders. Handle payment insertion, order completion, and table release atomically using a Postgres transaction/function. Do not allow payment to be recorded twice. Preserve item price/name snapshots so historical receipts remain accurate when menu prices change. Use a consistent restaurant-local timezone (Asia/Manila) for reporting while storing timestamps as timestamptz.

## 7. Screens and Routes

| Route | Screen | Main elements |
|---|---|---|
| `/login` | Login | Email/password, validation |
| `/dashboard` | Overview | KPI cards, daily sales, top items |
| `/menu` | Menu management | Category filters, item editor, availability |
| `/tables` | Table board | Available/occupied indicators |
| `/orders/new?table=...` | Order entry | Product list, cart, notes, calculated total |
| `/orders` | Active orders | Status and filters |
| `/kitchen` | Kitchen queue | Pending/preparing/ready cards |
| `/checkout/[orderId]` | Billing | Total, cash received, change, printable receipt |
| `/reports` | Sales history | Date filter and completed transactions |

### UI design guidance
- Mobile-friendly staff order entry; desktop-friendly admin dashboard.
- Restaurant-themed neutral/coffee palette with clear contrast.
- Prominent order status colors with text labels (not color alone).
- Large tap targets and readable prices in **PHP (₱)**.
- Empty/loading/error states for every core screen.

## 8. Core Business Rules

1. Only available menu items can be added to a new order.
2. Validate all item IDs and quantities on the server.
3. Calculate totals server-side from persisted item price snapshots.
4. Do not allow completed/cancelled orders to be edited.
5. A table can have at most one active order.
6. Payment amount must equal the server-calculated order total for a cash settlement; cash tendered and change may be separately recorded if implemented.
7. Only paid orders count toward revenue analytics.
8. Cancelled/unpaid orders do not contribute to paid sales.
9. Status transitions must be validated; unauthorized users cannot skip protected steps.
10. All monetary arithmetic must use exact decimal values or integer centavos, not unsafe floating-point calculations.

## 9. One-Week Execution Plan

| Day | Focus | Acceptance milestone |
|---|---|---|
| **1** | Client problem validation, requirements, wireframes, GitHub setup, AI prompt log | Approved scope and running skeleton |
| **2** | Supabase schema, auth, role protection, demo seed | Staff can sign in with correct access |
| **3** | Menu CRUD and table board | Admin can manage menu; tables show status |
| **4** | Order creation and kitchen workflow | Order appears and status updates |
| **5** | Cash checkout and sales dashboard | Paid order appears in analytics |
| **6** | Integration tests, security review, bug fixes, deployment | Stable deployed end-to-end flow |
| **7** | Demo rehearsal, pitch deck, technical defense | Team can demonstrate and explain code |

**Scope freeze:** After Day 5, prioritize fixing and polishing core features rather than introducing risky new modules.

## 10. Team Responsibilities

**Four-person team**
- Member 1 — Team lead, requirements, integration, GitHub, pitch.
- Member 2 — Frontend, responsive UI, dashboard.
- Member 3 — Database, authentication, server-side business logic.
- Member 4 — Testing, QA, deployment, documentation, demo data.

**Three-person team:** Combine lead/pitch with testing/docs; share integration responsibilities.

Each team member must understand the end-to-end system, not only their assigned files.

## 11. GitHub Workflow

- Repository: `snc-smartresto`
- Default branch: `main` (protected where feasible).
- Feature branches: `feature/auth`, `feature/menu`, `feature/orders`, `feature/dashboard`.
- Use descriptive commits and short pull requests; have another member review before merge.
- Commit `.env.example`, **never** `.env.local`, API secrets, service-role keys, or real customer data.
- Keep `README.md`, `docs/PROMPT_LOG.md`, and architecture notes updated.

### Suggested repository structure

```text
snc-smartresto/
├── app/
│   ├── (auth)/login/
│   ├── (staff)/dashboard/
│   ├── (staff)/menu/
│   ├── (staff)/tables/
│   ├── (staff)/orders/
│   ├── (staff)/kitchen/
│   ├── (staff)/checkout/
│   ├── (staff)/reports/
│   └── api/
├── components/
├── lib/
│   ├── supabase/
│   ├── validations/
│   └── business/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
├── public/
├── docs/
│   ├── PROMPT_LOG.md
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── TEST_PLAN.md
│   └── PITCH.md
├── .env.example
├── package.json
└── README.md
```

## 12. Mandatory AI Prompt Log

Create `docs/PROMPT_LOG.md`. Record key prompts, date, assistant used, output, human review, modifications, and verification results.

| Date | Tool | Prompt / intent | AI output | Human modifications | Verification |
|---|---|---|---|---|---|
| Day 1 | Antigravity or Copilot | Scaffold Next.js app and proposed routes | Initial files | Reviewed route structure | App starts |
| Day 2 | ... | Create schema and role policies | SQL migrations | Tightened access controls | Permission tests |
| Day 4 | ... | Implement order calculations | Server functions | Fixed rounding and validation | Unit tests |

**Sample implementation prompt:**
> Build the order-creation module for our Next.js TypeScript restaurant MVP. Follow the existing project conventions. Use Supabase Postgres. Validate with Zod. Prices and totals must be verified server-side, and completed orders must be immutable. Add tests for invalid quantities, missing menu items, and stale prices. Before editing, explain which files you will change and why. Do not overwrite unrelated code.

Use the chosen primary coding assistant for the core implementation, not merely documentation.

## 13. Testing and Acceptance Checklist

- [ ] Admin can sign in and manage menu items.
- [ ] Cashier cannot access admin-only menu editing.
- [ ] Kitchen staff cannot record payments or access revenue.
- [ ] Cashier can open a table and create an order.
- [ ] Order totals remain correct after quantity changes.
- [ ] Kitchen queue shows new orders and updates status.
- [ ] Completed payment closes the order and releases the table.
- [ ] Double checkout cannot create duplicate payments.
- [ ] Dashboard counts only completed, paid transactions.
- [ ] Unavailable items cannot be ordered.
- [ ] Invalid inputs and network/database failures show safe error messages.
- [ ] Refreshing the page does not lose persisted data.
- [ ] Mobile and desktop layouts remain usable.
- [ ] No secrets appear in GitHub or browser bundles.
- [ ] A deployed demo works from a separate device/browser.

**Minimum automated tests:** pricing/quantity calculations, order status transition validation, role checks, payment idempotency, and sales aggregation. Add an end-to-end happy-path test if time allows.

## 14. Deployment Checklist

1. Create Supabase project and apply migrations.
2. Configure authentication and RLS/server authorization.
3. Seed **fictional** products, tables, and test accounts.
4. Create Vercel project from the GitHub repository.
5. Set environment variables in Vercel (never commit secrets).
6. Run production build and test deployed login/order/payment flow.
7. Prepare a fallback local demo and screenshots/video if internet access fails.
8. Do not enter actual customer information without permission.

## 15. Pitch and Live Demo (5–7 Minutes)

1. **Problem (45 sec):** Explain a *validated* manual restaurant workflow pain point.
2. **Solution (45 sec):** Introduce SNC SmartResto and intended users.
3. **Architecture (45 sec):** Explain Next.js, Supabase, auth, and data flow.
4. **Live demo (2–3 min):** Login → menu → table → order → kitchen → payment → dashboard.
5. **AI-assisted development (45 sec):** Show a real prompt-log entry and what humans corrected.
6. **Testing and limitations (45 sec):** Show test results, constraints, and future improvements.
7. **Questions:** Every member should be ready to explain implementation decisions.

## 16. Required Submission Package

- [ ] GitHub repository with meaningful commit history.
- [ ] Working deployed URL or reproducible local run instructions.
- [ ] MVP source code and database migrations.
- [ ] `README.md` (setup, prerequisites, environment variables, usage).
- [ ] `docs/PROMPT_LOG.md` (**mandatory**).
- [ ] Requirements and architecture notes.
- [ ] Test plan and evidence/results.
- [ ] Pitch deck and live demo script.
- [ ] Screenshots or backup demo recording.
- [ ] Team roles/contributions summary.

## 17. Client Discovery Findings and Remaining Questions

### Reported findings

1. **Order handling:** Front desk writes customer orders on paper, then brings them inside for preparation.
2. **Table availability:** Monitored manually.
3. **Sales and receipts:** Recorded on paper.
4. **Primary pain point:** Duration of dish preparation.
5. **Permissions:** Admin should control menu editing, payment records, and sales reports.
6. **Ordering preference:** Answer given was “yes” to a choice between staff-facing and QR ordering; this does **not** establish which option is preferred.

### Required refinements

- **Kitchen timing:** Store `ordered_at`, `preparation_started_at`, `ready_at`, and optionally `served_at` for each order. Display elapsed time, and flag orders exceeding an estimated duration. Calculate actual prep duration as `ready_at - preparation_started_at` and order-to-ready time separately.
- **Preparation estimates:** Add optional `estimated_prep_minutes` to `menu_items`. For orders with multiple dishes, begin with one order-level timer; per-item kitchen timers are a stretch goal.
- **Kitchen status:** Provide a dedicated kitchen queue with large, readable order cards and timestamps.
- **Role clarification:** Admin exclusively edits menu and views financial reports. Confirm whether cashier staff may *record* payments (without editing past payments), since a functional checkout still needs a payment operator.
- **Customer ordering:** Start with front-desk staff entry; QR ordering remains optional until the client selects a preference.
- **Success metrics:** Compare paper-to-kitchen handoff time, order preparation durations, missing/incorrect orders, and time to compile daily sales. Record baseline measurements before claiming improvement.
- **Operational validation:** Ask whether preparation delays arise from staffing, cooking complexity, ingredient shortages, or order handoff. A digital system can improve visibility and coordination but cannot automatically reduce cooking time.

---

## 18. From Blueprint to Working MVP

Build in dependency order and keep each milestone demonstrable. Do not start QR ordering or visual polish that blocks the staff-operated flow.

| Sequence | Deliverable | Complete when |
|---|---|---|
| 1 | Repository and environment setup | A team member can install dependencies, configure local Supabase credentials, and run the app. |
| 2 | Database and access controls | Migrations and fictional seed data apply cleanly; role access is enforced by database policies and server actions. |
| 3 | Login and staff shell | Staff can sign in, see only permitted navigation, and sign out. |
| 4 | Menu and table operations | Admin can maintain menu availability and prices; cashier can see table occupancy. |
| 5 | Order entry | Cashier can open an available table, submit validated items, and see the persisted order and price snapshots. |
| 6 | Kitchen queue | Kitchen staff can advance valid order states; the queue shows order age and preparation timing. |
| 7 | Checkout and receipt | A served order can be paid once; the server verifies the total and releases the table atomically. |
| 8 | Dashboard and reports | Paid orders only appear in sales totals, with reporting dates interpreted in Asia/Manila. |
| 9 | Hardening and demo | Core role, pricing, status, and payment tests pass; the deployed demo works from another device. |

For each deliverable, finish the smallest complete slice: database operation, permission check, input validation, user interface, loading/error states, and a verification step. Keep one working end-to-end path available throughout development.

## 19. Current Repository Handoff

The repository is already initialized with a Next.js App Router project, Supabase client helpers, shared types and validation/business modules, server actions, UI components, an initial SQL migration, and fictional seed data. At this point, the `app/` directory contains the root shell rather than the feature routes listed in Section 7.

Recommended next actions:

1. Review the initial migration and seed data as a team before applying them to a shared Supabase project.
2. Confirm that the Supabase project URL and public key are available locally; keep service-role credentials server-only and out of browser bundles.
3. Build the login and protected staff shell, then add feature routes in the sequence from Section 18.
4. Wire each screen to the existing server actions and shared business modules instead of duplicating business rules in client components.
5. Keep migration changes in new, ordered SQL migration files after the initial migration has been shared or applied; do not silently rewrite an already-applied migration.
6. Replace the starter README content with project-specific setup, demo-account, and role instructions before handing the repository to judges or teammates.

The SQL seed contains fictional demo accounts and a shared demo password for local/demo use only. Replace or disable these accounts before any public or production deployment; never reuse the demo password for real staff.

## 20. Local Development and Verification

1. Install the locked dependencies with `npm ci`.
2. Create `.env.local` from `.env.example` and fill in the Supabase project values. Do not commit `.env.local`.
3. Apply the SQL migration and seed only to a development/demo Supabase project.
4. Start the application with `npm run dev` and verify login, role-specific access, and the order-to-payment flow as features are completed.
5. Before sharing a change, run `npm run lint` and `npm run build`; fix errors before merging.

Vitest and React Testing Library are present in the development dependencies, but the current package scripts do not yet expose a test command. Add a Vitest configuration, test files for the critical business rules, and a `test` script before relying on automated tests in the team workflow or CI.

For every pull request, report what was changed, which checks were run, and any known limitation. Test both allowed and denied role paths; a successful screen render alone does not demonstrate that a protected operation is secure.

## 21. Decisions to Confirm Before Finalizing

- Which ordering mode does the client prefer for the MVP: staff-entered orders only, or staff entry plus customer QR ordering?
- May cashier staff record payments while only admins can review or manage financial records?
- Should an order be considered ready when all dishes are ready, or should kitchen staff track each item separately?
- What preparation-time estimate should trigger an overdue warning, and who will maintain the estimate?
- Which business date should the daily report use when a shift crosses midnight? The proposed default is the Asia/Manila calendar date.
- What baseline will the team collect for order handoff and preparation time, and what evidence is acceptable for evaluating the MVP?

Document the client's answers in the requirements notes and update permissions, status rules, and acceptance checks before implementing any decision that changes the workflow.

---

**Definition of done:** A deployed, tested application demonstrates a full staff-operated order-to-payment workflow, a kitchen queue with preparation timing, accurate reporting, secure role checks, and a documented AI-assisted development process. Optional QR ordering is not required for completion.
