# Fix "bucket not found" on hosted Supabase (Vercel app)

If uploads fail on **bettok.vercel.app** with "bucket not found", the **media** storage bucket doesn’t exist in your hosted Supabase project yet.

## Option 1: Run the migration SQL (recommended)

1. Open your **hosted** project at [supabase.com](https://supabase.com) → your **bettok** project.
2. Go to **SQL Editor**.
3. Click **New query** and paste the contents of:
   - `supabase/migrations/00002_storage_media_bucket.sql`
4. Click **Run**.

That creates the `media` bucket and the policies so logged-in users can upload and everyone can read.

## Option 2: Create the bucket in the dashboard

1. In the Supabase dashboard go to **Storage**.
2. Click **New bucket**.
3. **Name:** `media`.
4. Enable **Public bucket** (so clip URLs work without auth).
5. **File size limit:** 100 MB (or leave default).
6. **Allowed MIME types:** add `video/mp4`, `video/webm`, `video/quicktime`, `image/jpeg`, `image/png`, `image/webp` (or leave empty to allow all).
7. Create the bucket.
8. Open the bucket → **Policies** → **New policy**:
   - **INSERT** for `authenticated` (so users can upload).
   - **SELECT** for `public` (so clips are viewable).
   Add policies as needed to match the migration (INSERT for authenticated, SELECT for public).

After the bucket and policies exist, try uploading again on bettok.vercel.app.
