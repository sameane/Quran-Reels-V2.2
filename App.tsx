import React, { useEffect, useState } from 'react';
import { Controls } from './components/Controls';
import { Player } from './components/Player';
import AnimatedBackground from './components/AnimatedBackground';
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
    <div className="flex h-screen w-screen ramadan-gradient text-accent overflow-hidden relative islamic-pattern">
      {/* Enhanced Animated Background */}
      <AnimatedBackground />

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
      <main className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Mobile Toggle Button (only visible when sidebar is closed on mobile) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-6 right-6 z-20 p-4 ramadan-btn md:hidden transition-all active:scale-90"
          >
            <Menu size={24} />
          </button>
        )}
        
        {state.status === 'ready' && data.ayahs.length > 0 ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Player
              ayahs={data.ayahs}
              videoUrls={data.videoUrls}
              surahInfo={data.surahInfo}
              reciterName={currentReciterName}
              onReset={reset}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center ramadan-card max-w-md mx-4">
            {/* Crescent Moon Image */}
            <img
              src="/crescent moon.png"
              alt="Crescent Moon"
              className="w-80 h-80 mb-8 object-contain"
              style={{ filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.6))' }}
            />
            
            <h2 className="text-3xl font-bold ramadan-text mb-6 font-arabic">
              لم يتم إنشاء أي ريل بعد
            </h2>
            
            {state.status !== 'idle' && state.status !== 'ready' && state.status !== 'error' && (
              <div className="my-6 flex flex-col items-center gap-4 w-full">
                <p className="text-ramadan-gold-300 font-medium animate-pulse text-lg">
                  {state.message}
                </p>
                <div className="w-full h-3 bg-ramadan-sapphire rounded-full overflow-hidden border border-ramadan-gold/30">
                  <div
                    className="h-full gold-gradient transition-all duration-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
                <span className="text-ramadan-gold-light text-sm font-mono">
                  {state.progress}%
                </span>
              </div>
            )}

            <p className="text-ramadan-moon-300 mt-4 max-w-md font-arabic text-lg">
              اختر السورة والآيات من القائمة الجانبية لإنشاء فيديو روحاني مدعوم بالذكاء الاصطناعي.
            </p>
            
            {state.status === 'error' && (
               <div className="mt-6 p-4 bg-red-900/20 border border-red-900/50 rounded text-red-300 ramadan-card">
                  <span className="font-bold">خطأ:</span> {state.error}
               </div>
            )}
            
            {state.warning && (
               <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-900/50 rounded text-yellow-300 ramadan-card">
                  <span className="font-bold">تنبيه:</span> {state.message}
               </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;