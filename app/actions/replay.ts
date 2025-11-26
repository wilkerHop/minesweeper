'use server';

import { turso } from '@/lib/db/turso';
import { env } from '@/lib/env';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';

/**
 * Cloudflare R2 client configuration
 * R2 is S3-compatible, so we use the AWS SDK
 */
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Replay data structure
 */
interface ReplayData {
  sessionId: string;
  moves: Array<{
    x: number;
    y: number;
    action: string;
    timestamp: number;
  }>;
  generatedAt: string;
}

/**
 * Generates replay JSON from Turso modified_cells data
 * 
 * @param sessionId - Game session ID
 * @returns Replay data object
 */
export async function generateReplayJSON(sessionId: string): Promise<ReplayData> {
  try {
    z.string().uuid().parse(sessionId);
    
    const result = await turso.execute({
      sql: `
        SELECT x, y, action, timestamp
        FROM modified_cells
        WHERE session_id = ?
        ORDER BY timestamp ASC
      `,
      args: [sessionId],
    });
    
    const moves = result.rows.map(row => ({
      x: row.x as number,
      y: row.y as number,
      action: row.action as string,
      timestamp: row.timestamp as number,
    }));
    
    return {
      sessionId,
      moves,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('generateReplayJSON error:', error);
    throw error;
  }
}

/**
 * Uploads replay JSON to Cloudflare R2
 * 
 * @param sessionId - Game session ID
 * @param replayData - Replay data to upload
 * @returns S3 object key
 */
export async function uploadReplayToR2(
  sessionId: string,
  replayData: ReplayData
): Promise<string> {
  try {
    z.string().uuid().parse(sessionId);
    
    const key = `replays/${sessionId}.json`;
    const jsonContent = JSON.stringify(replayData, null, 2);
    
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: jsonContent,
      ContentType: 'application/json',
      Metadata: {
        sessionId,
        uploadedAt: new Date().toISOString(),
      },
    });
    
    await r2Client.send(command);
    
    console.log(`Replay uploaded successfully: ${key}`);
    return key;
  } catch (error) {
    console.error('uploadReplayToR2 error:', error);
    throw error;
  }
}

/**
 * Gets a signed URL for downloading a replay file
 * The URL is valid for 1 hour
 * 
 * @param sessionId - Game session ID
 * @returns Signed URL for replay download
 */
export async function getReplayURL(sessionId: string): Promise<string> {
  try {
    z.string().uuid().parse(sessionId);
    
    const key = `replays/${sessionId}.json`;
    
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    });
    
    // Generate a signed URL valid for 1 hour
    const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    
    return url;
  } catch (error) {
    console.error('getReplayURL error:', error);
    throw error;
  }
}

/**
 * Generates and uploads a replay for a completed game session
 * This is typically called after a game ends
 * 
 * @param sessionId - Game session ID
 * @returns URL for downloading the replay
 */
export async function createAndUploadReplay(sessionId: string): Promise<string> {
  try {
    // Generate replay data from Turso
    const replayData = await generateReplayJSON(sessionId);
    
    // Upload to R2
    await uploadReplayToR2(sessionId, replayData);
    
    // Get signed URL
    const url = await getReplayURL(sessionId);
    
    return url;
  } catch (error) {
    console.error('createAndUploadReplay error:', error);
    throw error;
  }
}
