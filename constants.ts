import { Reciter } from './types';

// NOTE: In a production environment, keys should be proxied or in .env
// Pexels Key provided in spec
export const PEXELS_API_KEY = 'kcGUOqBqL2T4hmzu3YAguXBcyhDtKhnTvfmzQgzUJpD8DOmJO67OF6iC';

// Check if Pexels API key is available and valid
export const HAS_PEXELS_ACCESS = PEXELS_API_KEY && PEXELS_API_KEY.length > 10 && PEXELS_API_KEY !== 'DISABLED';

export const RECITERS: Reciter[] = [
  { id: 'Alafasy_128kbps', name: 'مشاري راشد العفاسي' },
  { id: 'Ahmed_ibn_Ali_al-Ajamy_128kbps', name: 'أحمد بن علي العجمي' },
  { id: 'Abdurrahmaan_As-Sudais_192kbps', name: 'عبد الرحمن السديس' },
  { id: 'Saood_ash-Shuraym_128kbps', name: 'سعود الشريم' },
  { id: 'MaherAlMuaiqly_128kbps', name: 'ماهر المعيقلي' },
  { id: 'Ghamadi_40kbps', name: 'سعد الغامدي' },
  { id: 'Husary_128kbps', name: 'محمود خليل الحصري' },
  { id: 'Husary_Mujawwad_128kbps', name: 'محمود خليل الحصري (مجود)' },
  { id: 'Minshawy_Murattal_128kbps', name: 'محمد صديق المنشاوي (مرتل)' },
  { id: 'Minshawy_Mujawwad_192kbps', name: 'محمد صديق المنشاوي (مجود)' },
  { id: 'Abdul_Basit_Murattal_192kbps', name: 'عبد الباسط عبد الصمد (مرتل)' },
  { id: 'Abdul_Basit_Mujawwad_128kbps', name: 'عبد الباسط عبد الصمد (مجود)' },
  { id: 'Abu_Bakr_Ash-Shatri_128kbps', name: 'أبو بكر الشاطري' },
  { id: 'Hani_Rifai_192kbps', name: 'هاني الرفاعي' },
  { id: 'Abdullah_Basfar_192kbps', name: 'عبد الله بصفر' },
  { id: 'Muhammad_Ayyoub_128kbps', name: 'محمد أيوب' },
  { id: 'Nasser_Alqatami_128kbps', name: 'ناصر القطامي' },
  { id: 'Yasser_Ad-Dussary_128kbps', name: 'ياسر الدوسري' },
  { id: 'Mohammad_al_Tablaway_128kbps', name: 'محمد الطبلاوي' },
  { id: 'Hudhaify_128kbps', name: 'علي الحذيفي' },
  { id: 'Ibrahim_Akhdar_32kbps', name: 'إبراهيم الأخضر' },
  { id: 'Karim_Mansoori_40kbps', name: 'كريم منصوري' },
  { id: 'Parhizgar_48kbps', name: 'شهريار برهيزقار' }
];

export const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
export const AUDIO_BASE_URL = 'https://everyayah.com/data';
export const PEXELS_API_BASE = 'https://api.pexels.com/v1';
export const PEXELS_COLLECTION_ID = 'ynfjbj8';

// Fallback nature video if Pexels search fails or returns nothing suitable
export const FALLBACK_VIDEO_URL = 'https://player.vimeo.com/external/174002621.sd.mp4?s=6319c5b651030310842095811797828588046808&profile_id=165&oauth2_token_id=57447761';