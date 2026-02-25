import React, { useEffect, useState } from 'react';
import { Surah, Reciter } from '../types';
import { RECITERS } from '../constants';
import { BookOpen, Mic, Sparkles, Loader2, ExternalLink, X } from 'lucide-react';

interface ControlsProps {
  surahs: Surah[];
  onGenerate: (surah: Surah, start: number, end: number, reciterId: string) => void;
  isLoading: boolean;
  statusMessage: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ 
  surahs, 
  onGenerate, 
  isLoading, 
  statusMessage,
  isOpen,
  onToggle
}) => {
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(1);
  const [selectedReciter, setSelectedReciter] = useState<string>(RECITERS[0].id);

  // Reset range when Surah changes
  useEffect(() => {
    if (selectedSurah) {
      setStartAyah(1);
      setEndAyah(Math.min(5, selectedSurah.numberOfAyahs)); // Default to first 5 or length
    }
  }, [selectedSurah]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurah) return;
    onGenerate(selectedSurah, startAyah, endAyah, selectedReciter);
  };

  return (
    <div className={`
      fixed inset-0 z-50 bg-slate-900 border-l border-slate-800 p-6 flex flex-col h-full overflow-y-auto 
      transition-transform duration-300 ease-in-out
      md:relative md:translate-x-0 md:w-[400px] md:shrink-0 md:z-10
      ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
    `}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-l from-gold-400 to-amber-600 bg-clip-text text-transparent">Quran Reels</h1>
          <p className="text-slate-400 text-sm mt-1">منشئ محتوى إسلامي بالذكاء الاصطناعي</p>
        </div>
        <button 
          onClick={onToggle}
          className="p-2 text-slate-400 hover:text-white md:hidden"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Surah Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-slate-300 text-sm font-medium">
            <BookOpen size={16} className="text-gold-500" />
            اختر السورة
          </label>
          <select 
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all"
            onChange={(e) => {
              const surah = surahs.find(s => s.number === parseInt(e.target.value));
              setSelectedSurah(surah || null);
            }}
            value={selectedSurah?.number || ''}
            disabled={isLoading}
          >
            <option value="">-- اختر السورة --</option>
            {surahs.map(s => (
              <option key={s.number} value={s.number}>
                {s.number}. {s.name} ({s.englishName})
              </option>
            ))}
          </select>
        </div>

        {/* Ayah Range */}
        {selectedSurah && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium">من الآية</label>
              <input 
                type="number" 
                min="1" 
                max={selectedSurah.numberOfAyahs}
                value={startAyah}
                onChange={(e) => setStartAyah(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium">إلى الآية</label>
              <input 
                type="number" 
                min={startAyah} 
                max={selectedSurah.numberOfAyahs}
                value={endAyah}
                onChange={(e) => setEndAyah(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-gold-500 outline-none"
                disabled={isLoading}
              />
            </div>
            <p className="col-span-2 text-xs text-slate-500 text-center">
              عدد الآيات في السورة: {selectedSurah.numberOfAyahs}
            </p>
          </div>
        )}

        {/* Reciter Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-slate-300 text-sm font-medium">
            <Mic size={16} className="text-gold-500" />
            القارئ
          </label>
          <select 
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-gold-500 focus:outline-none"
            value={selectedReciter}
            onChange={(e) => setSelectedReciter(e.target.value)}
            disabled={isLoading}
          >
            {RECITERS.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Generate Button */}
        <button 
          type="submit" 
          disabled={!selectedSurah || isLoading}
          className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg
            ${!selectedSurah || isLoading 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-gradient-to-l from-gold-500 to-amber-600 text-slate-950 hover:from-gold-400 hover:to-amber-500 hover:scale-[1.02]'
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              جاري الإنشاء...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              إنشاء الريل
            </>
          )}
        </button>

        {isLoading && (
          <div className={`rounded-lg p-3 border transition-all duration-300 ${statusMessage.includes('تنبيه') ? 'bg-amber-900/20 border-amber-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
            <p className={`text-center text-sm ${statusMessage.includes('تنبيه') ? 'text-amber-400' : 'text-gold-400 animate-pulse'}`}>
              {statusMessage}
            </p>
          </div>
        )}
      </form>
      
      <div className="mt-auto pt-6 text-center space-y-3">
         <div className="text-xs text-slate-500 font-english dir-ltr flex items-center justify-center gap-1">
          
           <a 
             href="https://www.facebook.com/abdo.awad.nagy" 
             target="_blank" 
             rel="noopener noreferrer" 
             className="font-semibold hover:text-gold-500 transition-colors inline-flex items-center gap-0.5"
           >
             Abdelrahman Nagy
             <ExternalLink size={10} />
           </a>
            <span>Made by</span>
         </div>
      </div>
    </div>
  );
};