-- Migration 00005: Add image support for vocabulary words

ALTER TABLE words ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for word images
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('word-images', 'word-images', true, false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anon users can CRUD (no auth required)
CREATE POLICY "Anon users can view word images"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'word-images');

CREATE POLICY "Anon users can upload word images"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'word-images');

CREATE POLICY "Anon users can update word images"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'word-images');

CREATE POLICY "Anon users can delete word images"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'word-images');
