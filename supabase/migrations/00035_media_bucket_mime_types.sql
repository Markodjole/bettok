-- Allow common browser / camera MIME variants (e.g. image/jpg) and HEIC for uploads.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/x-jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]::text[]
WHERE id = 'media';
