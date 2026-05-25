import React from 'react';
import { Level, LevelDetails } from '../types';
import { GraduationCap, BookOpen, Landmark } from 'lucide-react';

interface LevelSelectorProps {
  activeLevel: Level;
  onLevelChange: (level: Level) => void;
  levelsConfig: Record<Level, LevelDetails>;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  activeLevel,
  onLevelChange,
  levelsConfig,
}) => {
  const getIcon = (id: Level) => {
    switch (id) {
      case 'biennio':
        return <BookOpen className="w-5 h-5" />;
      case 'triennio':
        return <GraduationCap className="w-5 h-5" />;
      case 'maturita':
        return <Landmark className="w-5 h-5" />;
    }
  };

  return (
    <div id="level-selector-container" className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {(Object.keys(levelsConfig) as Level[]).map((levelId) => {
        const config = levelsConfig[levelId];
        const isActive = activeLevel === levelId;

        // Custom styling variables for Bento design
        let activeClasses = '';
        let descClasses = 'text-sm text-slate-500 leading-relaxed';
        let badgeBgClass = 'bg-slate-100 text-slate-600';

        if (isActive) {
          if (levelId === 'biennio') {
            activeClasses = 'bg-emerald-50/80 border-emerald-500 ring-4 ring-emerald-500/10 shadow-md scale-[1.02]';
            descClasses = 'text-sm text-emerald-900/70 font-medium leading-relaxed';
            badgeBgClass = 'bg-emerald-100 text-emerald-800';
          } else if (levelId === 'triennio') {
            activeClasses = 'bg-amber-50/80 border-amber-500 ring-4 ring-amber-500/10 shadow-md scale-[1.02]';
            descClasses = 'text-sm text-amber-900/70 font-medium leading-relaxed';
            badgeBgClass = 'bg-amber-200 text-amber-800';
          } else {
            activeClasses = 'bg-rose-50/80 border-rose-500 ring-4 ring-rose-500/10 shadow-md scale-[1.02]';
            descClasses = 'text-sm text-rose-900/70 font-medium leading-relaxed';
            badgeBgClass = 'bg-red-100 text-red-800';
          }
        } else {
          activeClasses = 'border-slate-200 bg-white hover:border-slate-300 opacity-65 hover:opacity-95 shadow-xs';
        }

        return (
          <button
            key={levelId}
            id={`level-btn-${levelId}`}
            onClick={() => onLevelChange(levelId)}
            className={`relative flex flex-col items-start p-5 rounded-3xl border-2 text-left transition-all duration-300 cursor-pointer focus:outline-hidden ${activeClasses}`}
          >
            {/* Upper row: Badge & Icon */}
            <div className="flex justify-between items-center w-full mb-4">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase italic ${badgeBgClass}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {config.badge}
              </span>
              <div
                className={`p-2 rounded-xl transition-colors duration-300 ${
                  isActive
                    ? levelId === 'biennio'
                      ? 'bg-emerald-500 text-white'
                      : levelId === 'triennio'
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {getIcon(levelId)}
              </div>
            </div>

            {/* Title / Label */}
            <h3
              className={`text-lg font-bold flex items-center gap-2 mb-1.5 ${
                isActive 
                  ? levelId === 'biennio' 
                    ? 'text-emerald-950 font-black' 
                    : levelId === 'triennio'
                    ? 'text-amber-950 font-black'
                    : 'text-rose-950 font-black'
                  : 'text-slate-800'
              }`}
            >
              <span>{config.emoji}</span>
              <span>{config.label}</span>
            </h3>

            {/* Subtitle / Description */}
            <p className={descClasses}>
              {config.description}
            </p>

            {/* Decorative active border accent */}
            {isActive && (
              <span
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-t-full ${
                  levelId === 'biennio'
                    ? 'bg-emerald-500'
                    : levelId === 'triennio'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
