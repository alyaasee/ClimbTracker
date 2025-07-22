
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export class SupabaseStorageService {
  private bucket = 'climb-media';

  async uploadMedia(file: Buffer, fileName: string, contentType: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(fileName, file, {
        contentType,
        upsert: true
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  async deleteMedia(fileName: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.bucket)
      .remove([fileName]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async createBucketIfNotExists(): Promise<void> {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === this.bucket);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(this.bucket, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
        allowedMimeTypes: ['image/*', 'video/*']
      });

      if (error) {
        console.error('Failed to create bucket:', error);
      }
    }
  }
}

export const storageService = new SupabaseStorageService();
