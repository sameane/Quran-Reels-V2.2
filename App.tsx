import React, { useEffect, useState } from 'react';
import { Controls } from './components/Controls';
import { Player } from './components/Player';
import { useQuranMedia } from './hooks/useQuranMedia';
import { fetchSurahs } from './services/api';
import { Surah } from './types';
import { RECITERS } from './constants';
import { Menu } from 'lucide-react';

function App() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [currentReciterName, setCurrentReciterName] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { generate, state, data, reset } = useQuranMedia();

  useEffect(() => {
    // Initial Data Load
    fetchSurahs().then(setSurahs).catch(console.error);
  }, []);

  const handleGenerate = (surah: Surah, start: number, end: number, reciterId: string) => {
    // Find reciter name for the file name
    const reciter = RECITERS.find(r => r.id === reciterId);
    setCurrentReciterName(reciter ? reciter.name : 'Unknown Reciter');
    
    // On mobile, close sidebar when generating starts to show progress/player
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    
    generate(surah, start, end, reciterId);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-white overflow-hidden relative">
      {/* Sidebar Controls */}
      <Controls 
        surahs={surahs} 
        onGenerate={handleGenerate} 
        isLoading={state.status !== 'idle' && state.status !== 'ready' && state.status !== 'error'}
        statusMessage={`${state.message} ${state.progress > 0 ? `(${state.progress}%)` : ''}`}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] bg-slate-950 overflow-hidden">
        {/* Mobile Toggle Button (only visible when sidebar is closed on mobile) */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 right-4 z-20 p-3 bg-gold-500 text-slate-950 rounded-full shadow-lg md:hidden hover:bg-gold-400 transition-all active:scale-90"
          >
            <Menu size={24} />
          </button>
        )}
        
        {state.status === 'ready' && data.ayahs.length > 0 ? (
          <Player 
            ayahs={data.ayahs} 
            videoUrls={data.videoUrls} 
            surahInfo={data.surahInfo}
            reciterName={currentReciterName}
            onReset={reset}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center opacity-50">
            <div className="w-24 h-24 border-4 border-slate-800 rounded-full flex items-center justify-center mb-6">
                <div className="w-3 h-3 bg-slate-600 rounded-full" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700">لم يتم إنشاء أي ريل بعد</h2>
            
            {state.status !== 'idle' && state.status !== 'ready' && state.status !== 'error' && (
              <div className="my-6 flex flex-col items-center gap-3">
                <p className="text-gold-500 font-medium animate-pulse text-lg">{state.message}</p>
                <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className="h-full bg-gradient-to-r from-gold-600 to-amber-400 transition-all duration-500 shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
                <span className="text-sm text-slate-400 font-mono">{state.progress}%</span>
              </div>
            )}

            <p className="text-slate-500 mt-2 max-w-md">
              اختر السورة والآيات من القائمة الجانبية لإنشاء فيديو روحاني مدعوم بالذكاء الاصطناعي.
            </p>
            {state.status === 'error' && (
               <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded text-red-400">
                  خطأ: {state.error}
               </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;