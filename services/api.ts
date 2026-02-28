import { Surah, Ayah, AyahTranslation, ProcessedAyah, VideoAsset } from '../types';
import { QURAN_API_BASE, AUDIO_BASE_URL, PEXELS_API_BASE, PEXELS_API_KEY, PEXELS_COLLECTION_ID, RECITERS, HAS_PEXELS_ACCESS } from '../constants';

export const fetchSurahs = async (): Promise<Surah[]> => {
  const response = await fetch(`${QURAN_API_BASE}/surah`);
  const data = await response.json();
  return data.data;
};

export const fetchAyahRange = async (
  surahNumber: number,
  start: number,
  end: number,
  reciterId: string
): Promise<ProcessedAyah[]> => {
  const results: ProcessedAyah[] = [];

  for (let i = start; i <= end; i++) {
    // 1. Fetch Arabic Text
    const arabicRes = await fetch(`${QURAN_API_BASE}/ayah/${surahNumber}:${i}`);
    const arabicData = await arabicRes.json();
    let arabicText = arabicData.data.text;

    // Strip Basmalah if it's the first Ayah of any Surah except Al-Fatiha (Surah 1)
    if (surahNumber !== 1 && i === 1) {
      const basmalahs = [
        "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
        "بِسْمِ ٱللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ",
        "بسم الله الرحمن الرحيم",
        "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ"
      ];
      
      let stripped = false;
      for (const b of basmalahs) {
        if (arabicText.includes(b)) {
          arabicText = arabicText.replace(b, "").trim();
          stripped = true;
          break;
        }
      }
      
      // Fallback: If it starts with "Bism" but wasn't caught by literal strings, 
      // strip the first 4 words (standard length of Basmalah)
      if (!stripped && arabicText.trim().startsWith("بِسْمِ")) {
        const words = arabicText.trim().split(/\s+/);
        if (words.length > 4) {
          arabicText = words.slice(4).join(" ").trim();
        }
      }
    }

    // 2. Fetch Translation (Sahih International usually)
    // Edition identifier: en.sahih
    const transRes = await fetch(`${QURAN_API_BASE}/ayah/${surahNumber}:${i}/en.sahih`);
    const transData = await transRes.json();
    const transText = transData.data.text;

    // 3. Construct Audio URL
    // EveryAyah format: {ReciterID}/{SurahPad3}{AyahPad3}.mp3
    const padSurah = String(surahNumber).padStart(3, '0');
    const padAyah = String(i).padStart(3, '0');
    const audioUrl = `${AUDIO_BASE_URL}/${reciterId}/${padSurah}${padAyah}.mp3`;

    results.push({
      ayahNumber: i,
      arabic: arabicText,
      translation: transText,
      audioUrl: audioUrl,
      // Default timestamps - will be reconstructed after audio processing
      startTime: 0,
      endTime: 0,
      originalDuration: 0,
      trimmedDuration: 0,
    });
  }

  return results;
};

// Function to get local video files from assets folder
const getLocalVideoFiles = (): string[] => {
  // Return all available local video files from assets folder
  const localVideos = [
    '/assets/6962-197634410_medium.mp4',
    '/assets/8947-215890483_medium.mp4',
    '/assets/9153-217588676_medium.mp4',
    '/assets/17013-278400948_medium.mp4',
    '/assets/21723-320725678_medium.mp4',
    '/assets/126678-736705679_medium.mp4',
    '/assets/140568-775389231_medium.mp4',
    '/assets/140733-775596128_medium.mp4',
    '/assets/280165_medium.mp4',
    '/assets/312999_medium.mp4'
  ];

  return localVideos;
};

// Helper function to shuffle array randomly
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const fetchBackgroundVideos = async (keyword: string, count: number = 3): Promise<string[]> => {
  // If Pexels API is not available, use local videos
  if (!HAS_PEXELS_ACCESS) {
    console.log('Pexels API not available, using random local video files');
    const localVideos = getLocalVideoFiles();

    // Shuffle videos randomly and select the requested count
    const shuffledVideos = shuffleArray(localVideos);
    return shuffledVideos.slice(0, Math.min(count, localVideos.length));
  }

  // We fetch from the specific collection provided by the user
  const url = `${PEXELS_API_BASE}/collections/${PEXELS_COLLECTION_ID}?per_page=80`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) throw new Error('Pexels API Error');

    const data = await response.json();

    // Filter for videos only (media can contain photos)
    const videos = (data.media || []).filter((item: any) => item.type === 'Video' || item.video_files);

    if (videos.length > 0) {
      // Heuristic: Try to find videos whose URL slug matches the keyword
      const keywordLower = keyword.toLowerCase();
      const matchingVideos = videos.filter((v: any) =>
        v.url && v.url.toLowerCase().includes(keywordLower)
      );

      // If we found matches, use them; otherwise use the whole collection
      const pool = matchingVideos.length > 0 ? matchingVideos : videos;

      // Shuffle pool to get random variety
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const selectedVideos = shuffled.slice(0, count);

      return selectedVideos.map((video: any) => {
        const file = video.video_files.find(
          (f: any) => f.file_type === 'video/mp4' && f.width < 1500 && f.width > 500
        ) || video.video_files[0];
        return file.link;
      });
    }
    
    // If Pexels returns no videos, fallback to local videos
    console.log('No videos found from Pexels, using local fallback');
    const localVideos = getLocalVideoFiles();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(localVideos[i % localVideos.length]);
    }
    return result;
    
  } catch (error) {
    console.error('Pexels fetch failed', error);

    // Fallback to local videos on any error
    console.log('Falling back to local video files');
    const localVideos = getLocalVideoFiles();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(localVideos[i % localVideos.length]);
    }
    return result;
  }
};
