import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ProcessedAyah, Surah } from '../types';
import { Play, Pause, Download, RefreshCcw, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface PlayerProps {
  ayahs: ProcessedAyah[];
  videoUrls: string[];
  surahInfo: Surah | null;
  reciterName: string;
  onReset: () => void;
}

interface ProcessedAyahWithChunks extends ProcessedAyah {
  arabicChunks: string[][];
  englishChunks: string[][];
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  alpha: number;
  maxAlpha: number;
}

// Helper: Fade edges to prevent digital clicks/pops (De-clicking)
const applySmartFades = (buffer: AudioBuffer, fadeDuration: number = 0.05): AudioBuffer => {
  const fadeSamples = Math.floor(fadeDuration * buffer.sampleRate);
  const channels = buffer.numberOfChannels;

  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch);
    const len = data.length;

    // Fade In (0 -> 1)
    for (let i = 0; i < fadeSamples && i < len; i++) {
      data[i] = data[i] * (i / fadeSamples);
    }

    // Fade Out (1 -> 0)
    for (let i = 0; i < fadeSamples && i < len; i++) {
      data[len - 1 - i] = data[len - 1 - i] * (i / fadeSamples);
    }
  }
  return buffer;
};

// Helper: Smart Silence Trimming with Tail Preservation
const trimSilence = (buffer: AudioBuffer, context: AudioContext): AudioBuffer => {
  const channelData = buffer.getChannelData(0); 
  const threshold = 0.015; // Sensitivity threshold

  let start = 0;
  let end = channelData.length;

  // Find start
  for (let i = 0; i < channelData.length; i++) {
    if (Math.abs(channelData[i]) > threshold) {
      start = i;
      break;
    }
  }
  
  // Find end
  for (let i = channelData.length - 1; i >= 0; i--) {
    if (Math.abs(channelData[i]) > threshold) {
      end = i;
      break;
    }
  }

  // Padding:
  // - 50ms Start Padding (Breath intake)
  // - 300ms End Padding (Reverb/Echo tail) - Increased to prevent "choppy" cuts
  const startPadding = Math.floor(buffer.sampleRate * 0.05);
  const endPadding = Math.floor(buffer.sampleRate * 0.30);

  start = Math.max(0, start - startPadding);
  end = Math.min(channelData.length, end + endPadding);

  const length = end - start;
  
  if (length <= 0 || start >= end) return buffer;

  const newBuffer = context.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const newData = newBuffer.getChannelData(ch);
    const oldData = buffer.getChannelData(ch);
    // Efficiently copy subarray
    newData.set(oldData.subarray(start, end));
  }
  
  // Apply fades to the new clipped buffer
  return applySmartFades(newBuffer, 0.03); // 30ms fade
};

// Helper: Format seconds to MM:SS
const formatTime = (timeInSeconds: number) => {
  if (!isFinite(timeInSeconds) || timeInSeconds < 0) return "00:00";
  const m = Math.floor(timeInSeconds / 60);
  const s = Math.floor(timeInSeconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getLines = (
  ctx: CanvasRenderingContext2D, 
  text: string, 
  maxWidth: number, 
  isArabic: boolean = false
): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = currentLine + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && n > 0) {
      lines.push(currentLine.trim());
      currentLine = words[n] + ' ';
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
};

const groupIntoChunks = (lines: string[], maxLines: number): string[][] => {
  const chunks: string[][] = [];
  for (let i = 0; i < lines.length; i += maxLines) {
    chunks.push(lines.slice(i, i + maxLines));
  }
  return chunks;
};

// Helper: Random generator
const random = (min: number, max: number) => Math.random() * (max - min) + min;

export const Player: React.FC<PlayerProps> = ({ ayahs, videoUrls, surahInfo, reciterName, onReset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<AudioBuffer[]>([]);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Playback Timing Refs
  const startTimeRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(0);

  // Visualization & Effects Refs
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const smoothedAmplitudeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const silentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const cumulativeDurationsRef = useRef<number[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [ayahsWithChunks, setAyahsWithChunks] = useState<ProcessedAyahWithChunks[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadExtension, setDownloadExtension] = useState<string>('mp4');
  
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Initialize Particles
  useEffect(() => {
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 50; i++) {
        particlesRef.current.push({
          x: random(0, 1080),
          y: random(0, 1920),
          size: random(1, 4),
          speedY: random(0.3, 1.2),
          speedX: random(-0.2, 0.2),
          alpha: 0,
          maxAlpha: random(0.3, 0.7)
        });
      }
    }
  }, []);

  // Construct Custom Filename
  const getFileName = () => {
      if (!surahInfo || ayahs.length === 0) return `QuranReels-video.${downloadExtension}`;
      const start = ayahs[0].ayahNumber;
      const end = ayahs[ayahs.length - 1].ayahNumber;
      // Clean up names for filename safety
      const safeReciter = reciterName.replace(/[\/\\?%*:|"<>]/g, '-');
      const safeSurah = surahInfo.name.replace(/[\/\\?%*:|"<>]/g, '-');
      return `${safeReciter} - ${safeSurah} - الايات ${start}-${end}.${downloadExtension}`;
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Initialize Resources
  useEffect(() => {
    if (videoUrls.length === 0 || ayahs.length === 0) return;

    const loadResources = async () => {
      setIsReady(false);
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const buffers: AudioBuffer[] = [];
        for (const ayah of ayahs) {
          const response = await fetch(ayah.audioUrl);
          if (!response.ok) throw new Error(`Audio fetch failed for Ayah ${ayah.ayahNumber}`);
          const arrayBuffer = await response.arrayBuffer();
          const rawBuffer = await ctx.decodeAudioData(arrayBuffer);
          // Apply smart trim & fade
          buffers.push(trimSilence(rawBuffer, ctx));
        }
        audioBuffersRef.current = buffers;

        if (videoRef.current) {
          videoRef.current.crossOrigin = 'anonymous'; 
          // Load the first video initially
          videoRef.current.src = videoUrls[0];
          videoRef.current.muted = true;
          videoRef.current.loop = true;
          
          await new Promise<void>((resolve, reject) => {
            if (!videoRef.current) return reject("Video ref missing");
            videoRef.current.onloadeddata = () => resolve();
            videoRef.current.onerror = (e) => reject("Video load error: " + e);
            if (videoRef.current.readyState >= 2) resolve();
          });

          await videoRef.current.play(); 
        }

        // Pre-calculate chunks
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const processed = ayahs.map(ayah => {
              // Measure Arabic
              ctx.font = '700 80px Amiri';
              const arabicLines = getLines(ctx, ayah.arabic, 1080 - 100, true);
              const arabicChunks = groupIntoChunks(arabicLines, 2);

              // Measure English
              ctx.font = '400 36px Inter';
              const englishLines = getLines(ctx, ayah.translation, 1080 - 150, false);
              const englishChunks = groupIntoChunks(englishLines, 2);

              return {
                ...ayah,
                arabicChunks,
                englishChunks
              };
            });
            setAyahsWithChunks(processed);
          }
        }

        setIsReady(true);
      } catch (error) {
        console.error("Resource loading failed", error);
        setToast({
          message: "فشل في تحميل الموارد. يرجى المحاولة مرة أخرى.",
          type: 'error'
        });
      }
    };

    loadResources();

    return () => {
      stopPlayback();
      audioContextRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayahs, videoUrls]);

  // Effect to switch video when Ayah changes
  useEffect(() => {
    if (isPlaying && videoRef.current && videoUrls.length > 1) {
      const videoIndex = currentAyahIndex % videoUrls.length;
      const nextSrc = videoUrls[videoIndex];
      
      if (videoRef.current.src !== nextSrc) {
        videoRef.current.src = nextSrc;
        videoRef.current.play().catch(console.error);
      }
    }
  }, [currentAyahIndex, isPlaying, videoUrls]);

  const stopPlayback = useCallback(() => {
    sourceNodesRef.current.forEach(node => {
      try { node.stop(); } catch (e) {}
    });
    sourceNodesRef.current = [];
    
    // Clean up silent source
    if (silentSourceRef.current) {
        try {
            silentSourceRef.current.stop();
            silentSourceRef.current.disconnect();
        } catch (e) {}
        silentSourceRef.current = null;
    }

    // Clean up analyser
    if (analyserRef.current) {
        try { analyserRef.current.disconnect(); } catch (e) {}
        analyserRef.current = null;
    }

    setIsPlaying(false);
    setCurrentAyahIndex(0);
    smoothedAmplitudeRef.current = 0;
    if (videoRef.current) videoRef.current.pause();
  }, []);

  const playSequence = async (record = false) => {
    if (!audioContextRef.current || !videoRef.current) return;
    
    try {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
    } catch (e) {
      return;
    }

    stopPlayback();
    videoRef.current.play();
    setIsPlaying(true);
    if (record) setIsRecording(true);

    const ctx = audioContextRef.current;
    let startTime = ctx.currentTime + 0.1; 
    startTimeRef.current = startTime;

    // Destination for Recording
    const dest = ctx.createMediaStreamDestination();
    
    // Output to speakers so user can hear
    const masterGain = ctx.createGain();
    
    // --- ANALYSER SETUP ---
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64; // Low FFT size for fewer, thicker bars (32 bins)
    analyser.smoothingTimeConstant = 0.85;
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    // Graph: Sources -> MasterGain -> Analyser -> [Destination, Recorder]
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);
    analyser.connect(dest);

    // --- ZERO BUFFER STRATEGY (Anti-Buzzing) ---
    // Instead of an oscillator, we use a buffer filled with actual zeros.
    // This prevents any DC offset or wave generation that causes buzzing.
    const silentBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const silentData = silentBuffer.getChannelData(0);
    silentData.fill(0); // Explicitly fill with 0

    const silentSource = ctx.createBufferSource();
    silentSource.buffer = silentBuffer;
    silentSource.loop = true; 
    silentSource.connect(dest); // Connect only to recorder destination
    silentSource.start();
    silentSourceRef.current = silentSource;
    // -------------------------------------------

    let cumulativeDuration = 0;
    const bufferDurations = audioBuffersRef.current.map(b => b.duration);
    const totalDuration = bufferDurations.reduce((a, b) => a + b, 0);
    totalDurationRef.current = totalDuration;

    // Pre-calculate cumulative durations for sync
    let currentCumulative = 0;
    cumulativeDurationsRef.current = bufferDurations.map(d => {
      const start = currentCumulative;
      currentCumulative += d;
      return start;
    });

    if (record && canvasRef.current) {
      chunksRef.current = [];
      const canvasStream = canvasRef.current.captureStream(30);
      const audioStream = dest.stream;
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      // --- MIME TYPE & EXTENSION SELECTION ---
      // Priority: H.264/AAC (Cleanest) -> VP9/Opus (Web Standard) -> Fallback
      const supportedTypes = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // Strict MP4
        'video/mp4', // Generic MP4
        'video/webm;codecs=h264,opus', // WebM with H.264 (Hybrid)
        'video/webm;codecs=vp9,opus', // Modern WebM
        'video/webm' // Universal Fallback
      ];

      let selectedMimeType = '';
      let ext = 'webm'; // Default safe fallback for browser generated media

      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          if (type.includes('mp4')) {
            ext = 'mp4';
          } else {
            ext = 'webm';
          }
          break;
        }
      }
      
      // Fallback if loop fails
      if (!selectedMimeType) {
         selectedMimeType = 'video/webm';
         ext = 'webm';
      }
      
      setDownloadExtension(ext);

      try {
        const recorder = new MediaRecorder(combinedStream, { 
            mimeType: selectedMimeType, 
            videoBitsPerSecond: 8000000, // 8 Mbps High Quality Video
            audioBitsPerSecond: 320000   // 320 kbps High Quality Audio (Reduces buzzing artifacts)
        });
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onerror = (e) => {
             console.error("Recorder Error", e);
             setToast({ message: "خطأ في التسجيل", type: 'error' });
             setIsRecording(false);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: selectedMimeType });
          const url = URL.createObjectURL(blob);
          setDownloadUrl(url);
          setIsRecording(false);
          setIsPlaying(false);
          setToast({ message: "تم التسجيل بنجاح!", type: 'success' });
          
          if (silentSourceRef.current) {
            try { silentSourceRef.current.stop(); } catch(e){}
            silentSourceRef.current = null;
          }
          if (analyserRef.current) {
            try { analyserRef.current.disconnect(); } catch (e) {}
            analyserRef.current = null;
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
      } catch (e) {
        setToast({ message: "المتصفح لا يدعم تنسيق التسجيل المطلوب", type: 'error' });
        setIsRecording(false);
        setIsPlaying(false);
        return;
      }
    }

    // Schedule buffers
    audioBuffersRef.current.forEach((buffer, index) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(masterGain);
      source.start(startTime + cumulativeDuration);
      sourceNodesRef.current.push(source);

      // Sync visuals
      const delayMs = (cumulativeDuration) * 1000;
      setTimeout(() => {
        if (sourceNodesRef.current.length > 0) {
             setCurrentAyahIndex(index);
        }
      }, delayMs);

      cumulativeDuration += buffer.duration;
    });

    // Cleanup when done
    setTimeout(() => {
        if (record && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        } else if (!record) {
            stopPlayback();
        }
    }, (totalDuration + 0.5) * 1000); 
  };

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas?.getContext('2d');

      if (canvas && video && ctx && ayahs.length > 0) {
        // --- AUDIO ANALYSIS FOR EFFECTS ---
        let currentAmp = 0;
        if (analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            // Calculate average volume
            let sum = 0;
            const dataArray = dataArrayRef.current;
            const len = dataArray.length;
            for (let i = 0; i < len; i++) {
                sum += dataArray[i];
            }
            currentAmp = sum / len; // 0-255
        }
        
        // Smooth amplitude for less jittery effects
        const targetAmp = currentAmp / 255;
        smoothedAmplitudeRef.current = smoothedAmplitudeRef.current * 0.9 + targetAmp * 0.1;
        const smoothedAmp = smoothedAmplitudeRef.current;

        // --- DRAW VIDEO WITH PARALLAX/PULSE ---
        const vidRatio = video.videoWidth / video.videoHeight;
        const canvasRatio = canvas.width / canvas.height;
        let dw, dh, dx, dy;

        // Base cover dimensions
        if (vidRatio > canvasRatio) {
           dh = canvas.height;
           dw = dh * vidRatio;
           dx = (canvas.width - dw) / 2;
           dy = 0;
        } else {
           dw = canvas.width;
           dh = dw / vidRatio;
           dy = (canvas.height - dh) / 2;
           dx = 0;
        }

        // Apply Zoom/Parallax Pulse based on audio
        // The video gently zooms in/out based on volume
        const zoom = 1.0 + (smoothedAmp * 0.04); // Max 4% zoom
        const zDw = dw * zoom;
        const zDh = dh * zoom;
        const zDx = dx - (zDw - dw) / 2;
        const zDy = dy - (zDh - dh) / 2;
        
        ctx.drawImage(video, zDx, zDy, zDw, zDh);

        // --- OVERLAYS ---
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0.3)');
        gradient.addColorStop(0.3, 'rgba(0,0,0,0.1)');
        gradient.addColorStop(0.7, 'rgba(0,0,0,0.6)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- PARTICLES ---
        if (particlesRef.current.length > 0) {
            particlesRef.current.forEach(p => {
                // Update
                p.y -= p.speedY; // Float up
                p.x += Math.sin(p.y * 0.01) * p.speedX; // Gentle sway
                if (p.y < -10) {
                    p.y = canvas.height + 10;
                    p.x = random(0, canvas.width);
                }
                
                // Fade in based on amplitude if music plays, else stay subtle
                const targetAlpha = isPlaying ? p.maxAlpha : p.maxAlpha * 0.3;
                p.alpha += (targetAlpha - p.alpha) * 0.05;

                // Draw
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 235, 160, ${p.alpha})`;
                ctx.fill();
            });
        }

        // --- AUDIO VISUALIZER ---
        if (isPlaying && analyserRef.current && dataArrayRef.current) {
            const dataArray = dataArrayRef.current;
            const bufferLength = analyserRef.current.frequencyBinCount;
            
            const relevantBins = Math.floor(bufferLength * 0.7); 
            const barWidth = 12;
            const barGap = 6;
            const centerX = canvas.width / 2;
            const centerY = canvas.height - 300; 
            
            for (let i = 0; i < relevantBins; i++) {
                const value = dataArray[i];
                const height = Math.max(4, (value / 255) * 120);
                const opacity = 0.3 + (value / 255) * 0.7;
                ctx.fillStyle = `rgba(250, 204, 21, ${opacity})`;
                
                const xOffset = i * (barWidth + barGap);
                ctx.fillRect(centerX + xOffset + barGap, centerY - height, barWidth, height);
                ctx.fillRect(centerX - xOffset - barWidth - barGap, centerY - height, barWidth, height);
            }
        }

        // --- HEADER TEXT ---
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 36px Amiri';
        ctx.fillText((surahInfo?.name || ''), canvas.width / 2, 80);
        
        ctx.fillStyle = '#EAB308';
        ctx.font = '400 24px Inter';
        ctx.fillText(`${surahInfo?.englishName} • الآية ${ayahs[currentAyahIndex]?.ayahNumber}`, canvas.width / 2, 125);

        // --- MAIN TEXT CONTENT ---
        const currentAyah = ayahsWithChunks[currentAyahIndex];
        if (currentAyah) {
            let progressInAyah = 0;
            if (isPlaying && audioContextRef.current && startTimeRef.current > 0) {
                const sequenceTime = audioContextRef.current.currentTime - startTimeRef.current;
                const ayahStartTime = cumulativeDurationsRef.current[currentAyahIndex] || 0;
                const ayahElapsed = sequenceTime - ayahStartTime;
                const ayahDuration = audioBuffersRef.current[currentAyahIndex]?.duration || 1;
                progressInAyah = Math.min(1, Math.max(0, ayahElapsed / ayahDuration));
            }

            const arabicChunkIdx = Math.floor(progressInAyah * currentAyah.arabicChunks.length);
            const englishChunkIdx = Math.floor(progressInAyah * currentAyah.englishChunks.length);
            
            const arabicLines = currentAyah.arabicChunks[Math.min(arabicChunkIdx, currentAyah.arabicChunks.length - 1)] || [];
            const englishLines = currentAyah.englishChunks[Math.min(englishChunkIdx, currentAyah.englishChunks.length - 1)] || [];

            // ARABIC
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 80px Amiri';
            ctx.direction = 'rtl';
            ctx.textAlign = 'center';
            
            const arabicStartY = canvas.height / 2 - 200; 
            const arabicLineHeight = 130;
            
            arabicLines.forEach((line, i) => {
                ctx.fillText(line, canvas.width / 2, arabicStartY + (i * arabicLineHeight));
            });
            
            const arabicEndY = arabicStartY + (arabicLines.length * arabicLineHeight);
            
            // ENGLISH
            const englishStartY = Math.max(arabicEndY + 60, canvas.height / 2 + 100);
            const englishLineHeight = 55;

            ctx.direction = 'ltr';
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = '400 36px Inter';
            
            englishLines.forEach((line, i) => {
                ctx.fillText(line, canvas.width / 2, englishStartY + (i * englishLineHeight));
            });
        }

        // --- PROGRESS BAR & TIME ---
        if (isPlaying && audioContextRef.current && totalDurationRef.current > 0) {
            const currentTime = audioContextRef.current.currentTime - startTimeRef.current;
            const progress = Math.min(1, Math.max(0, currentTime / totalDurationRef.current));
            
            // Bar Background
            const barWidth = canvas.width - 100;
            const barHeight = 6;
            const barX = 50;
            const barY = canvas.height - 100;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Bar Progress
            ctx.fillStyle = '#FACC15'; // Gold
            ctx.shadowColor = '#FACC15';
            ctx.shadowBlur = 10;
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            ctx.shadowBlur = 0;

            // Timer Text
            ctx.fillStyle = '#ffffff';
            ctx.font = '600 24px Inter';
            ctx.textAlign = 'right';
            const timeStr = `${formatTime(currentTime)} / ${formatTime(totalDurationRef.current)}`;
            ctx.fillText(timeStr, canvas.width - 50, barY - 15);
        }

        if (isRecording) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(50, 50, 15, 0, 2 * Math.PI);
            ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [ayahs, currentAyahIndex, isRecording, surahInfo, isPlaying]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 relative p-4 gap-4">
        <video ref={videoRef} className="hidden" playsInline webkit-playsinline="true" />

        <div className="relative shadow-2xl rounded-2xl overflow-hidden border border-slate-800" style={{ maxHeight: '80vh', aspectRatio: '9/16' }}>
            <canvas ref={canvasRef} width={1080} height={1920} className="w-full h-full object-contain bg-black" />
        </div>

        <div className="absolute bottom-8 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-full border border-slate-700">
            {downloadUrl ? (
                <>
                    <a 
                        href={downloadUrl} 
                        download={getFileName()}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-full font-bold transition-colors"
                    >
                        <Download size={20} />
                        تحميل الفيديو
                    </a>
                    <button onClick={() => { setDownloadUrl(null); }} className="p-2 text-slate-300 hover:text-white">
                        <RefreshCcw size={20} />
                    </button>
                </>
            ) : (
                <>
                     {!isPlaying ? (
                        <>
                            <button 
                                onClick={() => playSequence(false)} 
                                disabled={!isReady}
                                className={`p-4 rounded-full transition-all ${isReady ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-800 text-slate-600'}`}
                                title="معاينة"
                            >
                                <Play size={24} fill="currentColor" />
                            </button>
                            <button 
                                onClick={() => playSequence(true)}
                                disabled={!isReady} 
                                className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all
                                    ${isReady ? 'bg-gold-500 hover:bg-gold-400 text-slate-900' : 'bg-slate-800 text-slate-600'}
                                `}
                            >
                                <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                                تسجيل وتصدير
                            </button>
                        </>
                    ) : (
                        <button onClick={stopPlayback} className="p-4 bg-slate-700 hover:bg-slate-600 rounded-full text-white">
                            <Pause size={24} fill="currentColor" />
                        </button>
                    )}
                    
                    <button onClick={onReset} className="p-3 text-slate-400 hover:text-white transition-colors">
                        <RefreshCcw size={20} />
                    </button>
                </>
            )}
        </div>

        {toast && (
          <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border z-50 flex items-center gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-100' : 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100'
          }`}>
            {toast.type === 'error' ? <AlertCircle size={20} className="text-red-400" /> : <CheckCircle2 size={20} className="text-emerald-400" />}
            <span className="font-medium text-sm text-right">{toast.message}</span>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors mr-2">
              <X size={16} />
            </button>
          </div>
        )}
    </div>
  );
};