# What’s left for you to do

Everything that can be done in code is done. The app **builds successfully** and is ready to deploy. You only need to do these steps (they require your accounts and cannot be automated):

---

## 1. Create a Supabase project (free)

1. Go to **[supabase.com](https://supabase.com)** and sign in.
2. Click **New project** → choose org, name, password, region → **Create**.
3. Wait until the project is ready (green).
4. Open **Settings → API** and copy:
   - **Project URL** → you’ll use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
5. Open **SQL Editor**. Run the migrations in order:
   - Copy/paste the contents of `supabase/migrations/00001_initial_schema.sql` → Run.
   - Then `00002_storage_media_bucket.sql` → Run.
   - Then `00003_...`, `00004_...`, `00005_...` in order.
6. In **Storage**: ensure the `media` bucket exists (migration 00002 creates it). If you need to allow uploads: **Policies** → add a policy so **authenticated** users can **INSERT** into `media` with path like `clips/{user_id}/*`.

---

## 2. Push the repo to GitHub

In a terminal, from the project folder:

```bash
cd /Users/markodjordjevic/projects/creators
git init
git add .
git commit -m "Initial commit"
```

Then on **[github.com](https://github.com)** create a **new repository** (no README, no .gitignore). Copy its URL and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

(Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your repo.)

---

## 3. Deploy on Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in (e.g. with GitHub).
2. **Add New… → Project** → import the GitHub repo you just pushed.
3. Before deploying, set:
   - **Root Directory:** click **Edit** → choose **apps/web** → **Continue**.
   - **Environment Variables** → Add these three (use the values from step 1):
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**. Wait for the build to finish.
5. Copy your app URL (e.g. `https://bettok-xxx.vercel.app`).

---

## 4. Set Supabase auth URLs (so login works on the live app)

1. In the **Supabase** dashboard → **Authentication** → **URL Configuration**.
2. Set **Site URL** to your Vercel URL (e.g. `https://bettok-xxx.vercel.app`).
3. Under **Redirect URLs**, add:
   - `https://your-actual-app.vercel.app/**`
   - `https://your-actual-app.vercel.app/auth/callback`
4. Save.

---

## 5. Open on your phone

On your phone’s browser, go to your Vercel URL (e.g. `https://bettok-xxx.vercel.app`). You can add it to the home screen for an app-like shortcut.

---

**Summary:** Supabase project + run migrations → push to GitHub → deploy on Vercel (root `apps/web`, 3 env vars) → set auth URLs in Supabase → open the Vercel URL on your phone.

For more detail (e.g. build commands), see **DEPLOY.md**.
