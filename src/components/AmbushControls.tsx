import { useState } from 'react';
import { AmbushFrequency, AmbushStats } from '../types';
import { Zap, Volume2, VolumeX, ShieldCheck, Flame, Sliders, Info, Sparkles, X } from 'lucide-react';

interface AmbushControlsProps {
  enabled: boolean;
  onToggleEnabled: () => void;
  frequency: AmbushFrequency;
  onChangeFrequency: (freq: AmbushFrequency) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  stats: AmbushStats;
  onTriggerInstantAmbush: () => void;
  canTriggerInstant: boolean;
  isTriggering: boolean;
}

export function AmbushControls({
  enabled,
  onToggleEnabled,
  frequency,
  onChangeFrequency,
  soundEnabled,
  onToggleSound,
  stats,
  onTriggerInstantAmbush,
  canTriggerInstant,
  isTriggering,
}: AmbushControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showManifesto, setShowManifesto] = useState(false);

  const accuracy = stats.totalIntercepts > 0
    ? Math.round((stats.successfulRecalls / stats.totalIntercepts) * 100)
    : 100;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Surprise Status Pill */}
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-2.5 py-1 text-[11px] font-mono border transition-colors ${
            enabled 
              ? 'bg-[#141414] text-[#E4E3E0] border-[#E4E3E0]/30 hover:border-yellow-400' 
              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
          }`}
          title="Configure Surprise Memory Ambushes"
        >
          <span className="relative flex h-2 w-2">
            {enabled && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${enabled ? 'bg-yellow-400' : 'bg-neutral-500'}`}></span>
          </span>
          <span className="font-bold tracking-wider">
            SURPRISE_RECALL: {enabled ? frequency.toUpperCase() : 'MUTED'}
          </span>
          {stats.currentStreak > 0 && (
            <span className="flex items-center gap-0.5 text-orange-400 font-bold ml-1">
              <Flame size={12} className="fill-orange-400" />
              {stats.currentStreak}
            </span>
          )}
          <Sliders size={12} className="opacity-70 ml-1" />
        </button>

        {/* Instant Ambush Test Button */}
        <button
          onClick={onTriggerInstantAmbush}
          disabled={!canTriggerInstant || isTriggering}
          className="bg-yellow-400 hover:bg-yellow-300 text-black border border-black px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={canTriggerInstant ? "Trigger a Surprise Retrieval Intercept right now based on past reading" : "Read and summarize at least 1 paragraph first"}
        >
          <Zap size={12} className="fill-black" />
          <span>{isTriggering ? 'Ambushes Loading...' : 'Surprise Me Now'}</span>
        </button>
      </div>

      {/* Settings & Stats Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#F5F5F3] border-2 border-[#141414] shadow-[8px_8px_0_0_rgba(20,20,20,1)] flex flex-col overflow-hidden">
            <div className="bg-[#141414] text-[#E4E3E0] px-5 py-3 flex items-center justify-between border-b border-[#141414]">
              <div className="flex items-center gap-2 font-mono text-xs uppercase font-bold tracking-wider">
                <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                <span>Surprise Memory Retrieval Controls</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-3 border border-[#141414] bg-white p-3 font-mono">
                <div className="text-center border-r border-[#141414]/20 pr-2">
                  <div className="text-[10px] uppercase text-neutral-500 font-bold">Cold Recalls</div>
                  <div className="text-2xl font-bold text-[#141414]">{stats.totalIntercepts}</div>
                </div>
                <div className="text-center border-r border-[#141414]/20 pr-2">
                  <div className="text-[10px] uppercase text-neutral-500 font-bold">Accuracy</div>
                  <div className="text-2xl font-bold text-green-700">{accuracy}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] uppercase text-neutral-500 font-bold">Streak</div>
                  <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
                    <Flame size={18} className="fill-orange-600" />
                    {stats.currentStreak}
                  </div>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center justify-between border-b border-[#141414]/20 pb-4">
                <div>
                  <div className="text-xs font-mono font-bold uppercase text-[#141414]">
                    Unpredictable Surprise Ambushes
                  </div>
                  <div className="text-[11px] text-neutral-600 font-sans mt-0.5">
                    Fires surprise micro-quizzes on chapter or paragraph transitions out of nowhere.
                  </div>
                </div>
                <button
                  onClick={onToggleEnabled}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase border transition-colors ${
                    enabled 
                      ? 'bg-green-700 text-white border-green-800' 
                      : 'bg-neutral-300 text-neutral-700 border-neutral-400'
                  }`}
                >
                  {enabled ? 'ENABLED' : 'PAUSED'}
                </button>
              </div>

              {/* Frequency Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono font-bold uppercase text-[#141414]">
                  Ambush Cadence (Variable Ratio)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['unpredictable', 'frequent', 'rare'] as AmbushFrequency[]).map(freq => (
                    <button
                      key={freq}
                      onClick={() => onChangeFrequency(freq)}
                      className={`p-2.5 text-left border font-mono text-xs transition-all ${
                        frequency === freq
                          ? 'bg-[#141414] text-white border-[#141414] font-bold shadow-sm'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="uppercase font-bold text-[11px]">{freq}</div>
                      <div className="text-[9px] opacity-75 mt-0.5">
                        {freq === 'unpredictable' && '~35% (Poisson ideal)'}
                        {freq === 'frequent' && '~65% (High pressure)'}
                        {freq === 'rare' && '~20% (Gentle stealth)'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between border-t border-[#141414]/20 pt-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#141414]">
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span>Surprise Tone Chime</span>
                </div>
                <button
                  onClick={onToggleSound}
                  className="px-2.5 py-1 text-[11px] font-mono border border-neutral-400 bg-white hover:bg-neutral-100"
                >
                  {soundEnabled ? 'AUDIO ON' : 'MUTED'}
                </button>
              </div>

              {/* Anti-Shithole Manifesto Banner */}
              <div className="bg-neutral-100 border border-[#141414] p-3 text-xs font-mono">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold uppercase text-[10px] text-neutral-800 flex items-center gap-1">
                    <ShieldCheck size={14} className="text-green-700" />
                    Guaranteed Anti-Shithole Safeguards
                  </span>
                  <button
                    onClick={() => setShowManifesto(prev => !prev)}
                    className="text-[10px] text-blue-700 underline font-bold"
                  >
                    {showManifesto ? 'Hide Details' : 'Read Science'}
                  </button>
                </div>
                {showManifesto ? (
                  <div className="mt-2 space-y-1.5 text-[11px] text-neutral-700 font-sans border-t border-neutral-300 pt-2">
                    <p>
                      <strong>1. No Mid-Typing Interruption:</strong> Ambushes only launch upon completing paragraphs or hitting "Continue", never while drafting thoughts.
                    </p>
                    <p>
                      <strong>2. Delayed, Not Immediate:</strong> Tests previously synthesized paragraphs, forcing long-term memory retrieval rather than immediate phonological loop echo.
                    </p>
                    <p>
                      <strong>3. Under 15 Seconds:</strong> Multiple-choice active discrimination so you never suffer essay fatigue.
                    </p>
                    <p>
                      <strong>4. Stochastic Schedule:</strong> Variable-ratio delivery eliminates anticipation anxiety while maximizing dopamine and memory trace consolidation.
                    </p>
                  </div>
                ) : (
                  <div className="text-[10px] text-neutral-500 font-sans">
                    Guards against working-memory disruption, typing loss, and anticipation fatigue.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#E4E3E0] px-6 py-3 border-t border-[#141414] flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-1.5 bg-[#141414] text-white font-mono text-xs font-bold uppercase hover:bg-black transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
