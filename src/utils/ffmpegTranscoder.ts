import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;

/**
 * Initialize FFmpeg.wasm instance
 */
export const initFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  ffmpegInstance = new FFmpeg();
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  console.log(`[FFmpeg Transcoder]: FFmpeg base URL: ${baseURL}`); // Add this line
  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  
  return ffmpegInstance;
};

/**
 * Perform deep transcoding to ensure social media compatibility
 * Based on DEEP_TRANSCODE_LOGIC.md specifications
 */
export const performDeepTranscode = async (
  inputBlob: Blob,
  inputFileName: string = 'input.webm',
  outputFileName: string = 'output.mp4',
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  try {
    const ffmpeg = await initFFmpeg();
    
    // Add FFmpeg log listener
    ffmpeg.on('log', ({ message }) => {
      console.log(`[FFmpeg.wasm log]: ${message}`);
    });

    // Set up progress callback if provided
    if (onProgress) {
      ffmpeg.on('progress', (event: any) => {
        // Convert ratio (0-1) to percentage (0-100)
        const ratio = event?.ratio || 0;
        const progress = Math.round(ratio * 100);
        onProgress(progress);
      });
    }
    
    // Log input file details
    console.log(`[FFmpeg Transcoder]: Input file name: ${inputFileName}, size: ${inputBlob.size} bytes`);

    // Write input file to FFmpeg memory
    await ffmpeg.writeFile(inputFileName, await fetchFile(inputBlob));
    
    const command = [
      '-i', inputFileName,
      // Video codec: H.264 for maximum compatibility
      '-c:v', 'libx264',
      // Audio codec: AAC for social media compatibility
      '-c:a', 'aac',
      // Pixel format: YUV 4:2:0 for broad compatibility
      '-pix_fmt', 'yuv420p',
      // Profile: High for better quality and modern device compatibility
      '-profile:v', 'high',
      // Level: 4.0 for high-resolution video support (up to 1080p)
      '-level', '4.0',
      // Faststart: Move moov atom to beginning for streaming
      '-movflags', '+faststart',
      // Constant frame rate to avoid VFR issues
      '-r', '30',
      // Video bitrate: 2.5M for good quality with reasonable file size
      '-b:v', '2500k',
      // Audio bitrate: 128k for good audio quality
      '-b:a', '128k',
      // Audio sample rate: 44.1kHz standard
      '-ar', '44100',
      // Ensure progressive download compatibility
      '-preset', 'ultrafast',
      // Output file
      outputFileName
    ];

    console.log(`[FFmpeg Transcoder]: Executing FFmpeg command: ${command.join(' ')}`);

    // Execute deep transcoding with social media compatible settings
    // Based on DEEP_TRANSCODE_LOGIC.md specifications
    await ffmpeg.exec(command);
    
    // Read the processed file
    const data = await ffmpeg.readFile(outputFileName);
    
    // Create blob with MP4 MIME type - handle both Uint8Array and string types
    const uint8Array = new Uint8Array(data as Uint8Array);
    const mp4Blob = new Blob([uint8Array], { type: 'video/mp4' });
    
    console.log(`[FFmpeg Transcoder]: Output file name: ${outputFileName}, size: ${mp4Blob.size} bytes`);
    
    return mp4Blob;
  } catch (error) {
    console.error('[FFmpeg Transcoder]: FFmpeg transcoding error:', error);
    throw new Error(`Failed to transcode video: ${error}`);
  }
};

/**
 * Check if FFmpeg is loaded and ready
 */
export const isFFmpegReady = (): boolean => {
  return ffmpegInstance !== null && ffmpegInstance.loaded;
};

/**
 * Clean up FFmpeg instance
 */
export const cleanupFFmpeg = async (): Promise<void> => {
  if (ffmpegInstance) {
    try {
      await ffmpegInstance.terminate();
      ffmpegInstance = null;
    } catch (error) {
      console.warn('[FFmpeg Transcoder]: Error cleaning up FFmpeg:', error);
    }
  }
};
