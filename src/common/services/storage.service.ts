import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_KEY as string,
    );
  }

  private logger = new Logger(StorageService.name);

  async uploadImage({
    fileName,
    contentType,
    fileBuffer,
  }: {
    fileName: string;
    contentType: string;
    fileBuffer?: Buffer;
  }) {
    if (!fileBuffer) {
      throw new Error('File buffer is required');
    }
    if (!contentType) {
      throw new Error('Content type is required');
    }

    const { data, error } = await this.supabase.storage
      .from('images')
      .upload(`images/${fileName}`, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    return this.getPublicUrl(data.path);
  }

  getPublicUrl(filePath: string) {
    const { data } = this.supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
}
