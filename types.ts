export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string; // Arabic
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
}

export interface AyahTranslation {
  text: string; // English
}

export interface ProcessedAyah {
  ayahNumber: number;
  arabic: string;
  translation: string;
  audioUrl: string;
}

export interface Reciter {
  id: string; // e.g., 'Alafasy_128kbps'
  name: string;
}

export interface VideoAsset {
  id: number;
  video_files: {
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }[];
  image: string; // thumbnail
}

export interface GenerationState {
  status: 'idle' | 'fetching_data' | 'analyzing_context' | 'finding_video' | 'downloading_assets' | 'ready' | 'error';
  message: string;
  progress: number;
  error?: string;
}
