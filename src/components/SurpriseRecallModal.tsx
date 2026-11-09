import { useState, useEffect } from 'react';
import { SurpriseQuestion } from '../types';
import { motion } from 'motion/react';
import { ShieldAlert, Zap, CheckCircle2, XCircle, ArrowRight, Flame, Brain, Info, HelpCircle } from 'lucide-react';

interface SurpriseRecallModalProps {
  questionData: SurpriseQuestion;
  onAnswered: (isCorrect: boolean) => void;
  onClose: () => void;
  soundEnabled?: boolean;
}

export function SurpriseRecallModal({
  questionData,
  onAnswered,
  onClose,
  soundEnabled = true,
}: SurpriseRecallModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showScience, setShowScience] = useState(false);

  // Play surprise alert sound on mount
  useEffect(() => {
    if (soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          // Two-tone attention chirp
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
          
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }
      } catch (e) {
        // audio context blocked or unavailable
      }
    }
  }, [soundEnabled]);

  const handleSelectOption = (index: number) => {
    if (hasSubmitted) return;
    setSelectedIndex(index);
    setHasSubmitted(true);
    const isCorrect = index === questionData.correct_option_index;
    onAnswered(isCorrect);
  };

  const isCorrect = selectedIndex === questionData.correct_option_index;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-2xl bg-[#F5F5F3] border-2 border-[#141414] shadow-[10px_10px_0_0_rgba(20,20,20,1)] overflow-hidden flex flex-col"
      >
        {/* Surprise Ambush Header */}
        <div className="bg-[#141414] text-[#E4E3E0] px-6 py-3 flex items-center justify-between border-b border-[#141414]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold">
              <Zap size={14} className="text-yellow-400 fill-yellow-400" />
              <span>COLD_RETRIEVAL_AMBUSH // ZERO_ANTICIPATION</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowScience(prev => !prev)}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-500 px-2 py-0.5 transition-colors"
          >
            <Brain size={12} className="text-yellow-400" />
            <span>Why This Ambush?</span>
          </button>
        </div>

        {/* Cognitive Science / Anti-Shithole Explainer Accordion */}
        {showScience && (
          <div className="bg-neutral-900 text-neutral-200 p-4 border-b border-neutral-800 text-xs font-mono space-y-2 leading-relaxed">
            <div className="flex items-center gap-2 text-yellow-400 font-bold uppercase text-[11px]">
              <Info size={14} /> Cognitive Science & Anti-Shithole Architecture:
            </div>
            <ul className="list-disc pl-4 space-y-1 text-neutral-300 text-[11px]">
              <li>
                <strong className="text-white">Testing Effect (Roediger & Karpicke, 2006):</strong> Actively fishing an idea out of memory consolidates synaptic pathways up to 4x stronger than passive re-reading.
              </li>
              <li>
                <strong className="text-white">Dopamine via Unpredictability:</strong> By triggering this out of nowhere without anticipation, your brain registers novelty, heightening retention.
              </li>
              <li>
                <strong className="text-white">Anti-Shithole Rule #1 (Zero Input Wiping):</strong> This intercept triggers only on transition boundaries—never mid-keystroke. Your draft work is 100% safe.
              </li>
              <li>
                <strong className="text-white">Anti-Shithole Rule #2 (Delayed Retrieval):</strong> We never quiz what you read 5 seconds ago (working memory echo). We pull from prior material to force true retrieval practice.
              </li>
            </ul>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[#141414]/15 pb-2">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-neutral-500">
              TARGET CONCEPT: <span className="text-[#141414] font-bold">{questionData.concept_name}</span>
            </span>
            <span className="text-[10px] font-mono uppercase bg-neutral-200 text-neutral-700 px-2 py-0.5 font-bold">
              Micro-Recall (15s)
            </span>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-serif font-bold text-[#141414] leading-snug">
              {questionData.question}
            </h3>
            <p className="text-xs text-neutral-500 font-mono mt-1">
              Select the most accurate conclusion below from memory:
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-2.5">
            {questionData.options.map((option, idx) => {
              const isSelected = selectedIndex === idx;
              const isOptionCorrect = idx === questionData.correct_option_index;

              let btnStyle = "bg-white border-[#141414] text-[#141414] hover:bg-neutral-100";
              if (hasSubmitted) {
                if (isOptionCorrect) {
                  btnStyle = "bg-green-100 border-green-700 text-green-900 font-semibold shadow-sm";
                } else if (isSelected && !isOptionCorrect) {
                  btnStyle = "bg-red-100 border-red-600 text-red-900 font-semibold";
                } else {
                  btnStyle = "bg-neutral-100 border-neutral-300 text-neutral-400 opacity-60";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={hasSubmitted}
                  className={`text-left p-3.5 border transition-all flex items-start gap-3 text-sm font-sans leading-relaxed group ${btnStyle}`}
                >
                  <span className={`font-mono text-xs px-2 py-0.5 border shrink-0 mt-0.5 ${
                    hasSubmitted && isOptionCorrect
                      ? 'bg-green-700 text-white border-green-700 font-bold'
                      : hasSubmitted && isSelected && !isOptionCorrect
                        ? 'bg-red-600 text-white border-red-600 font-bold'
                        : 'bg-neutral-200 text-neutral-800 border-neutral-400 font-bold group-hover:bg-[#141414] group-hover:text-white'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {hasSubmitted && isOptionCorrect && (
                    <CheckCircle2 size={18} className="text-green-700 shrink-0 mt-0.5" />
                  )}
                  {hasSubmitted && isSelected && !isOptionCorrect && (
                    <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Post-Answer Feedback & Memory Anchor */}
          {hasSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 border ${
                isCorrect 
                  ? 'bg-green-50 border-green-600 text-green-950' 
                  : 'bg-amber-50 border-amber-600 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5 font-mono text-xs uppercase font-bold tracking-wider">
                {isCorrect ? (
                  <div className="flex items-center gap-1.5 text-green-700">
                    <CheckCircle2 size={16} />
                    <span>SYNAPTIC TRACE REINFORCED (+1 STREAK)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-700">
                    <ShieldAlert size={16} />
                    <span>CONSOLIDATION GAP CAUGHT (ANCHOR APPLIED)</span>
                  </div>
                )}
              </div>

              <p className="text-sm leading-relaxed mb-3 font-sans">
                {questionData.explanation}
              </p>

              {/* Memory Anchor Takeaway */}
              <div className="bg-white/80 border border-current/20 p-2.5 font-mono text-xs">
                <span className="font-bold uppercase tracking-wider block text-[10px] opacity-75 mb-0.5">
                  📌 Long-Term Memory Anchor:
                </span>
                <span className="italic">"{questionData.memory_anchor}"</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#E4E3E0] px-6 py-3 border-t border-[#141414] flex items-center justify-between">
          <div className="text-[11px] font-mono text-neutral-600 flex items-center gap-2">
            <Flame size={14} className="text-orange-600" />
            <span>Spaced Retrieval Protocol Active</span>
          </div>

          {hasSubmitted ? (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#141414] text-[#E4E3E0] font-mono text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>Resume Reading</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <span className="text-[11px] font-mono text-neutral-500 italic">
              Choose an answer above to continue...
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
