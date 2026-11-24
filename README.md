# Scale Magnet — Business Finance PWA

A mobile-first Progressive Web App (PWA) built with **Plain HTML + CSS + Vanilla JavaScript (no build step)** for two business partners, **Abdul** and **Punith**, who split revenue **50/50**.

Currency is in Indian Rupees (**₹**, `en-IN` number format). Built with **Supabase (Auth + PostgreSQL + Realtime)** and hostable directly on **GitHub Pages** or any static host.

---

## ⚡ Key Features

1. **Strict Two-Partner Authentication**:
   - Fixed accounts: `abdul@scalemagnet.app` and `punith@scalemagnet.app`. Any other email is rejected.
   - Quick one-tap partner toggle on login screen with secure password authentication.
   - Persistent authenticated sessions across visits with "Name · Sign out" in header.
   - The dashboard is completely protected and hidden until signed in.

2. **6 Core Screens**:
   - **Overview**: Month/year selector, Monthly Revenue (with ▲/▼ % change vs previous month), Punith's 50% Share, Abdul's 50% Share, Monthly Expenses (% of revenue; expenses are tracked separately and NOT deducted from gross revenue shares), and quick-action shortcuts.
   - **Clients**: Client income tracking per month, service type, due dates, payment status (paid / pending / overdue), search filter, "Copy last month's clients" action, and "Clear month" with confirmation.
   - **Expenses**: Operating expenses tracking with categories (Video Editor, Software/Tools, Marketing/Ads, Office/Travel, etc.), amount, and who paid out-of-pocket (Abdul or Punith).
   - **Savings**: Deposits & withdrawals with running balance, note, and automated validation blocking withdrawals exceeding available balance.
   - **Analysis**: Interactive revenue by month bar chart (selected month highlighted), partner totals, gross revenue, total expenses, net profit after expenses, **Who Owes Whom** calculation to settle out-of-pocket expenses, yearly summary breakdown, top clients leaderboard, and expense category breakdown.
   - **Activity**: Database-enforced audit log of every add, edit, delete, restore, and import, showing author (`by Abdul`), timestamp, and old vs new values for edits.

3. **Production Behavior & Polish**:
   - Author metadata on every row: `by Abdul · 24 Nov`.
   - In-place edit modal for clients, expenses, and savings.
   - Soft deletes with a 7-second Undo toast bar + "Recently Deleted" drawer to restore items anytime.
   - Live Supabase Realtime synchronization: instant UI updates and toast notifications when the other partner adds, edits, or deletes an item.
   - Full Export/Import (JSON backup) and monthly/yearly CSV exports.
   - Offline detection banner ("Offline — changes not saved") that blocks writes safely rather than losing them silently.
   - Safe input validation and strict HTML text escaping to prevent XSS.
   - Automatic migration helper for legacy `scalarMagnetDashboard_v1` localStorage records.
   - PWA compliant: installable on Android/iOS/Desktop, standalone display, network-first caching for static assets, zero caching of Supabase calls.

---

## 🚀 Setup Steps in 5 Minutes

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/) and create a new project.
2. Note your **Project URL** and **anon public API key** from **Project Settings → API**.

### Step 2: Run the Database Setup SQL
1. In your Supabase dashboard, open the **SQL Editor**.
2. Open `supabase_setup.sql` from this repository, copy its contents, paste them into the SQL Editor, and click **Run**.
3. This creates:
   - `entries` table (with constraints, indexes, and RLS)
   - `activity` table (immutable audit trail)
   - Automated triggers on `entries` that log every insert, update, soft-delete, and restore
   - Row Level Security policies restricted strictly to `abdul@scalemagnet.app` and `punith@scalemagnet.app`
   - Realtime publication on both tables.

### Step 3: Create the Two Partner Accounts
1. In Supabase, go to **Authentication → Users**.
2. Click **Add User** → **Create User**:
   - Email: `abdul@scalemagnet.app`, enter a secure password, and ensure **Auto Confirm User?** is **checked**.
3. Click **Add User** → **Create User** again:
   - Email: `punith@scalemagnet.app`, enter a secure password, and ensure **Auto Confirm User?** is **checked**.

### Step 4: Disable Public Sign-ups
1. Go to **Authentication → Providers → Email**.
2. Toggle **OFF** "Allow new users to sign up" and click **Save**.
3. This guarantees no unauthorized accounts can ever register.

### Step 5: Configure Supabase Keys
Open `index.html` and update the constants at the top of the `<script>`:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```
*(Tip: You can also click the "Connect Supabase" key icon on the login screen or settings modal inside the app to save or test credentials at runtime).*

### Step 6: Host on GitHub Pages
1. Push the files to a GitHub repository:
   - `index.html`
   - `manifest.webmanifest`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
   - `apple-touch-icon.png`
   - `supabase_setup.sql`
   - `README.md`
2. In your GitHub repository, go to **Settings → Pages**.
3. Under **Branch**, select `main` (root) and click **Save**.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

### Step 7: Install on Mobile (PWA)
- **Android (Chrome)**: Tap the in-app "Install App" button or tap the browser menu (⋮) → **Add to Home screen**.
- **iOS (Safari)**: Tap the **Share** button (box with arrow) → scroll down and tap **Add to Home Screen**.

---

## 🛡️ Security & Privacy
- **No service_role key**: The application uses only the public anon key.
- **Row Level Security (RLS)**: Enforced directly inside PostgreSQL. Even if an attacker knew the anon key, Supabase rejects queries not authenticated with `abdul@scalemagnet.app` or `punith@scalemagnet.app`.
- **Database-enforced Audit Trail**: The `activity` table is written via `SECURITY DEFINER` Postgres triggers and is read-only for partners.
- **XSS Escaping**: All dynamic user text is sanitized using safe DOM node methods and HTML entity escaping.
