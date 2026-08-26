# Balram — Polling Day Voter Tracker

Simple 3-role app for polling day:
- **Coordinator** (e.g. Sawai, Ali): manage their assigned people, mark Voted / Not Voted / Not Interested, one-tap Call and WhatsApp reminder.
- **Balram (Admin)**: see everyone's live progress toward the 223 target, nudge any lagging coordinator on WhatsApp.
- **Admin**: create new coordinator logins.

## 1. Put this on GitHub

1. Create a new empty repo on GitHub (e.g. `balram-voter-tracker`).
2. In this folder, run:
   ```
   git init
   git add .
   git commit -m "Initial version"
   git branch -M main
   git remote add origin https://github.com/<your-username>/balram-voter-tracker.git
   git push -u origin main
   ```

## 2. Deploy on Vercel

1. Go to vercel.com → **Add New Project** → import the GitHub repo you just pushed.
2. Framework preset: Next.js (auto-detected). Click **Deploy** once — it will fail on first build because storage isn't set up yet. That's fine, continue to step 3.

## 3. Add storage (Vercel KV)

This app stores coordinators and voter lists in **Vercel KV** (a simple shared database) so everyone's updates show up live for everyone.

1. In your Vercel project → **Storage** tab → **Create Database** → choose **KV**.
2. Name it anything (e.g. `balram-kv`) and connect it to this project.
3. Vercel will automatically add the required environment variables (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.) — you don't need to type these yourself.

## 4. Set the admin password

1. In your Vercel project → **Settings** → **Environment Variables**.
2. Add a variable: `ADMIN_PASSWORD` = a password of your choice (this is what Balram/you use to log in as Admin).
3. Redeploy the project (Deployments tab → click the three dots on the latest deployment → **Redeploy**).

## 5. Use it

- Open your site link → choose **Balram / Admin** → log in with the `ADMIN_PASSWORD` you set.
- From the Admin page, create a coordinator (e.g. "Sawai") with a password.
- Share the site link with Sawai. He logs in under **Coordinator** with his name + password, adds his ~10 people's names and phone numbers.
- On polling day, Sawai marks each person Voted / Not Voted / Not Interested as they show up, and can tap Call or WhatsApp for anyone still pending.
- Balram's Admin page auto-refreshes every 30 seconds and shows every coordinator's live count, ranked, with a one-tap "Nudge on WhatsApp" button for any coordinator falling behind.

## Notes

- Polling window is set to 9:00 AM – 6:30 PM. To change this, edit `lib/pollingWindow.js`.
- The 223 target can be changed anytime by re-adding a coordinator with a different `target` value, or ask me to add a small "edit target" control on the Admin page.
- Phone numbers should include the country code (e.g. `91XXXXXXXXXX`) for the Call and WhatsApp buttons to work correctly.
