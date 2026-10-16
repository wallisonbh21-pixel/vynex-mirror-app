CREATE POLICY "site-images public read" ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'site-images');