# Deploy BetTok to Vercel (free, view on mobile)

## 1. Hosted Supabase (required for production)

The app uses Supabase. For a live URL you need a **hosted** Supabase project (not local).

1. Go to [supabase.com](https://supabase.com) → Sign in → **New project**.
2. Create a project and wait for it to be ready.
3. In the dashboard: **Settings → API**:
   - Copy **Project URL** → you’ll use it as `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (for server actions).
4. In **SQL Editor**, run your schema: copy the contents of your local migrations from `supabase/migrations/*.sql` and run them in order (or use **Database → Migrations** if you link the project).

## 2. Push code to GitHub

```bash
cd /Users/markodjordjevic/projects/creators
git init
git add .
git commit -m "Initial commit"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → Sign in (e.g. with GitHub).
2. **Add New… → Project** → Import your GitHub repo.
3. **Root Directory (required):** Click **Edit** next to Root Directory → enter `apps/web` → **Continue**. If you leave this blank, Vercel will not detect Next.js and the build will fail.
4. **Build and Output Settings:** The repo’s `apps/web/vercel.json` already sets Install/Build. Optionally in the UI set:
   - **Install Command:** `(cd ../.. && pnpm install)`
   - **Build Command:** `cd ../.. && pnpm exec turbo build --filter=@bettok/web`
5. **Environment Variables** (Add):
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key  
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service_role key  
6. Click **Deploy**. Wait for the build to finish.
7. Open the generated URL (e.g. `https://your-app.vercel.app`) on your phone.

## 4. Supabase auth redirect (for login/signup)

In Supabase: **Authentication → URL Configuration**:

- **Site URL:** `https://your-app.vercel.app` (your Vercel URL)
- **Redirect URLs:** add `https://your-app.vercel.app/**` and `https://your-app.vercel.app/auth/callback`

Save. Then sign up and login will work from your mobile browser.

---

**Summary:** Hosted Supabase project → env vars in Vercel → Root Directory `apps/web` → custom Install/Build commands above → deploy and open the Vercel URL on your phone.
