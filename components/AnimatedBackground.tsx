import React, { useEffect, useRef } from 'react';

const AnimatedBackground: React.FC = () => {
  const starsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createStars = () => {
      const starsContainer = starsContainerRef.current;
      if (!starsContainer) return;

      const totalStars = 200;

      for (let i = 0; i < totalStars; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        const size = Math.random() * 2 + 0.5;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const animDuration = Math.random() * 4 + 2;
        const animDelay = Math.random() * 5;

        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${posX}%`;
        star.style.top = `${posY}%`;
        star.style.animationDuration = `${animDuration}s`;
        star.style.animationDelay = `${animDelay}s`;

        starsContainer.appendChild(star);
      }
    };

    createStars();
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Dynamic Stars Container */}
      <div ref={starsContainerRef} id="stars-container" className="absolute inset-0" />

      

      {/* Swaying Lantern */}
      <div className="lantern-container absolute top-0 left-[40%] flex flex-col items-center transform-origin-top-center z-20 pointer-events-none">
        <div className="chain w-[3px] h-[18vh] bg-repeating-linear-gradient-to-b from-[#d4af37] via-[#d4af37_6px] to-transparent via-[transparent_10px] filter drop-shadow-[0_0_5px_rgba(212,175,55,0.6)]" />
        <svg 
          viewBox="0 0 100 160" 
          className="lantern-svg w-[12vmin] min-w-[60px] h-auto mt-[-5px] filter drop-shadow-[0_0_20px_rgba(253,224,71,0.7)]" 
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b8860b"/>
              <stop offset="50%" stopColor="#ffe066"/>
              <stop offset="100%" stopColor="#b8860b"/>
            </linearGradient>
            <radialGradient id="glass-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1"/>
              <stop offset="35%" stopColor="#fde047" stopOpacity="0.9"/>
              <stop offset="80%" stopColor="#ca8a04" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#ca8a04" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="50" cy="15" r="10" stroke="url(#gold-grad)" strokeWidth="4" fill="none"/>
          <rect x="45" y="24" width="10" height="6" fill="url(#gold-grad)"/>
          <path d="M 50 30 L 20 60 L 80 60 Z" fill="url(#gold-grad)"/>
          <path d="M 20 60 L 80 60 L 75 65 L 25 65 Z" fill="url(#gold-grad)"/>
          <path d="M 27 65 L 73 65 L 63 115 L 37 115 Z" fill="url(#glass-glow)"/>
          <line x1="42" y1="65" x2="45" y2="115" stroke="url(#gold-grad)" strokeWidth="2.5"/>
          <line x1="58" y1="65" x2="55" y2="115" stroke="url(#gold-grad)" strokeWidth="2.5"/>
          <line x1="50" y1="65" x2="50" y2="115" stroke="url(#gold-grad)" strokeWidth="3"/>
          <path d="M 27 80 L 71 80" stroke="url(#gold-grad)" strokeWidth="1.5" opacity="0.6"/>
          <path d="M 32 100 L 68 100" stroke="url(#gold-grad)" strokeWidth="1.5" opacity="0.6"/>
          <path d="M 37 115 L 63 115 L 68 125 L 32 125 Z" fill="url(#gold-grad)"/>
          <path d="M 32 125 L 68 125 L 72 132 L 28 132 Z" fill="url(#gold-grad)"/>
          <path d="M 40 132 L 60 132 L 50 142 Z" fill="url(#gold-grad)"/>
          <path d="M 45 142 L 40 155 M 50 142 L 50 160 M 55 142 L 60 155" stroke="url(#gold-grad)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      </div>

      <div className="lantern-container absolute top-0 left-[-65%] flex flex-col items-center transform-origin-top-center z-20 pointer-events-none">
        <div className="chain w-[3px] h-[18vh] bg-repeating-linear-gradient-to-b from-[#d4af37] via-[#d4af37_6px] to-transparent via-[transparent_10px] filter drop-shadow-[0_0_5px_rgba(212,175,55,0.6)]" />
        <svg 
          viewBox="0 0 100 160" 
          className="lantern-svg w-[12vmin] min-w-[60px] h-auto mt-[-5px] filter drop-shadow-[0_0_20px_rgba(253,224,71,0.7)]" 
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b8860b"/>
              <stop offset="50%" stopColor="#ffe066"/>
              <stop offset="100%" stopColor="#b8860b"/>
            </linearGradient>
            <radialGradient id="glass-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1"/>
              <stop offset="35%" stopColor="#fde047" stopOpacity="0.9"/>
              <stop offset="80%" stopColor="#ca8a04" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#ca8a04" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="50" cy="15" r="10" stroke="url(#gold-grad)" strokeWidth="4" fill="none"/>
          <rect x="45" y="24" width="10" height="6" fill="url(#gold-grad)"/>
          <path d="M 50 30 L 20 60 L 80 60 Z" fill="url(#gold-grad)"/>
          <path d="M 20 60 L 80 60 L 75 65 L 25 65 Z" fill="url(#gold-grad)"/>
          <path d="M 27 65 L 73 65 L 63 115 L 37 115 Z" fill="url(#glass-glow)"/>
          <line x1="42" y1="65" x2="45" y2="115" stroke="url(#gold-grad)" strokeWidth="2.5"/>
          <line x1="58" y1="65" x2="55" y2="115" stroke="url(#gold-grad)" strokeWidth="2.5"/>
          <line x1="50" y1="65" x2="50" y2="115" stroke="url(#gold-grad)" strokeWidth="3"/>
          <path d="M 27 80 L 71 80" stroke="url(#gold-grad)" strokeWidth="1.5" opacity="0.6"/>
          <path d="M 32 100 L 68 100" stroke="url(#gold-grad)" strokeWidth="1.5" opacity="0.6"/>
          <path d="M 37 115 L 63 115 L 68 125 L 32 125 Z" fill="url(#gold-grad)"/>
          <path d="M 32 125 L 68 125 L 72 132 L 28 132 Z" fill="url(#gold-grad)"/>
          <path d="M 40 132 L 60 132 L 50 142 Z" fill="url(#gold-grad)"/>
          <path d="M 45 142 L 40 155 M 50 142 L 50 160 M 55 142 L 60 155" stroke="url(#gold-grad)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
};

export default AnimatedBackground;