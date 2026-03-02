import { useState, useCallback } from 'react';
import { ProcessedAyah, GenerationState, Surah } from '../types';
import { fetchAyahRange, fetchBackgroundVideos } from '../services/api';
import { getVisualKeyword } from '../services/geminiService';
import { FALLBACK_VIDEO_URL } from '../constants';

interface UseQuranMediaReturn {
  generate: (surah: Surah, start: number, end: number, reciterId: string) => Promise<void>;
  state: GenerationState;
  data: {
    ayahs: ProcessedAyah[];
    videoUrls: string[];
    surahInfo: Surah | null;
  };
  reset: () => void;
}

export const useQuranMedia = (): UseQuranMediaReturn => {
  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    message: 'جاهز للإنشاء',
    progress: 0,
  });

  const [data, setData] = useState<{
    ayahs: ProcessedAyah[];
    videoUrls: string[];
    surahInfo: Surah | null;
  }>({
    ayahs: [],
    videoUrls: [],
    surahInfo: null,
  });

  const reset = useCallback(() => {
    setState({ status: 'idle', message: 'جاهز', progress: 0 });
    setData({ ayahs: [], videoUrls: [], surahInfo: null });
  }, []);

  const generate = useCallback(async (surah: Surah, start: number, end: number, reciterId: string) => {
    try {
      setState({ status: 'fetching_data', message: 'جاري جلب الآيات والتلاوة...', progress: 10 });
      
      // 1. Fetch Ayahs
      const ayahs = await fetchAyahRange(surah.number, start, end, reciterId);
      
      setState({ status: 'analyzing_context', message: 'تحليل المعنى بالذكاء الاصطناعي...', progress: 40 });

      // 2. AI Analysis
      const fullTranslation = ayahs.map(a => a.translation).join(' ');
      const keyword = await getVisualKeyword(fullTranslation);
      
      if (!keyword) {
        console.warn("AI Analysis failed, using default keyword");
        // Show user notification about AI failure
        setState(prev => ({
          ...prev,
          message: 'تنبيه: تعذر تحليل النص بالذكاء الاصطناعي، سيتم استخدام خلفية افتراضية',
          warning: 'AI_FAILURE'
        }));
      }

      console.log("AI Keyword:", keyword);

      setState({ status: 'finding_video', message: `جاري البحث عن خلفيات مناسبة...`, progress: 60 });

      // 3. Pexels Search
      // We fetch up to 5 videos for variety
      let videoUrls = await fetchBackgroundVideos(keyword || "nature", 5);
      if (videoUrls.length === 0) {
        console.warn("No videos found, using fallback");
        videoUrls = [FALLBACK_VIDEO_URL];
      }

      setState({ status: 'downloading_assets', message: 'تجهيز محرك الفيديو...', progress: 80 });

      // 4. Finalize
      setData({
        ayahs,
        videoUrls,
        surahInfo: surah,
      });

      setState({ status: 'ready', message: 'تم الإنشاء بنجاح', progress: 100 });

    } catch (error: any) {
      console.error(error);
      setState({ 
        status: 'error', 
        message: 'فشل الإنشاء', 
        progress: 0, 
        error: error.message || 'خطأ غير معروف' 
      });
    }
  }, []);

  return { generate, state, data, reset };
};
