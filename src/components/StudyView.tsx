import { useState, useRef, useEffect } from 'react';
import { Chapter, Feedback } from '../types';
import { Loader2, CheckCircle, AlertCircle, ChevronRight, Lock, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudyViewProps {
  chapter: Chapter;
  documentId: string;
  initialParagraphIndex: number;
  initialPreviousSummary: string;
  onProgressUpdate: (paragraphIndex: number, previousSummary: string) => void;
  onComplete: () => void;
  onRequestSurpriseCheck?: (
    pastParagraphs: string[], 
    pastSummaries: string[], 
    onProceed: () => void
  ) => Promise<boolean>;
}

export function StudyView({ 
  chapter, 
  documentId, 
  initialParagraphIndex, 
  initialPreviousSummary, 
  onProgressUpdate, 
  onComplete,
  onRequestSurpriseCheck
}: StudyViewProps) {
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(initialParagraphIndex);
  const [paragraphSummary, setParagraphSummary] = useState('');
  const [cumulativeSummary, setCumulativeSummary] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isIntercepting, setIsIntercepting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previousCumulativeSummary, setPreviousCumulativeSummary] = useState(initialPreviousSummary);

  // Reset state when chapter or document changes
  useEffect(() => {
    setCurrentParagraphIndex(initialParagraphIndex);
    setParagraphSummary('');
    setCumulativeSummary('');
    setFeedback(null);
    setErrorMessage(null);
    setPreviousCumulativeSummary(initialPreviousSummary);
  }, [chapter.id, documentId]);

  // Scroll to active paragraph
  useEffect(() => {
    const activeEl = document.getElementById(`paragraph-${currentParagraphIndex}`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentParagraphIndex]);

  const currentParagraph = chapter.paragraphs[currentParagraphIndex];
  const isFirstParagraph = currentParagraphIndex === 0;

  const handleSubmit = async () => {
    if (!paragraphSummary.trim() || (!isFirstParagraph && !cumulativeSummary.trim())) return;
    
    setIsEvaluating(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/evaluate-paragraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_paragraph_text: currentParagraph,
          previous_cumulative_summary: previousCumulativeSummary,
          user_paragraph_summary: paragraphSummary,
          user_cumulative_summary: isFirstParagraph ? paragraphSummary : cumulativeSummary
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Evaluation failed. The model may be busy. Please try again.');
      }
      setFeedback(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error evaluating paragraph. The server model is momentarily busy. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = async () => {
    const proceed = () => {
      if (currentParagraphIndex < chapter.paragraphs.length - 1) {
        const nextPrevSumm = isFirstParagraph ? paragraphSummary : cumulativeSummary;
        setPreviousCumulativeSummary(nextPrevSumm);
        setCurrentParagraphIndex(prev => prev + 1);
        setParagraphSummary('');
        setCumulativeSummary('');
        setFeedback(null);
        setErrorMessage(null);
        onProgressUpdate(currentParagraphIndex + 1, nextPrevSumm);
      } else {
        onComplete();
      }
    };

    if (onRequestSurpriseCheck) {
      setIsIntercepting(true);
      try {
        const pastParagraphs = chapter.paragraphs.slice(0, currentParagraphIndex + 1);
        const pastSummaries = [
          previousCumulativeSummary, 
          paragraphSummary, 
          cumulativeSummary
        ].filter(Boolean);

        const wasTriggered = await onRequestSurpriseCheck(pastParagraphs, pastSummaries, proceed);
        if (wasTriggered) {
          setIsIntercepting(false);
          return;
        }
      } catch (err) {
        console.error('Surprise intercept check error:', err);
      } finally {
        setIsIntercepting(false);
      }
    }

    proceed();
  };

  return (
    <section className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-white border-b border-[#141414] px-6 py-3 flex flex-col gap-2 shrink-0">
        <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase text-[#444]">
          <span>Progress: {chapter.title || 'Chapter'}</span>
          <span>{currentParagraphIndex + (feedback?.status === 'APPROVED' ? 1 : 0)} / {chapter.paragraphs.length} Paragraphs Completed</span>
        </div>
        <div className="h-1.5 w-full bg-[#E4E3E0] overflow-hidden rounded-none border border-[#141414]/20">
          <div 
            className="h-full bg-[#141414] transition-all duration-500 ease-out" 
            style={{ width: `${((currentParagraphIndex + (feedback?.status === 'APPROVED' ? 1 : 0)) / chapter.paragraphs.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 overflow-hidden">
        {/* Left Panel: PDF Text */}
        <div className="border-r border-[#141414] flex flex-col min-h-0">
          <div className="h-8 shrink-0 bg-[#E4E3E0] border-b border-[#141414] px-4 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold">Current_Paragraph_Source</span>
            <span className="text-[10px] font-mono">WORDS: {currentParagraph ? currentParagraph.split(' ').length : 0}</span>
          </div>
          <div className="p-6 flex-1 overflow-y-auto font-serif leading-relaxed text-lg text-[#222]">
            <div className="max-w-2xl mx-auto space-y-6">
              {chapter.paragraphs.map((para, idx) => {
                const isActive = idx === currentParagraphIndex;
                const isPast = idx < currentParagraphIndex;
                return (
                  <motion.div 
                    key={idx}
                    id={`paragraph-${idx}`}
                    layout
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : isPast ? 0.45 : 0.22,
                      filter: isActive ? 'blur(0px)' : isPast ? 'blur(0px)' : 'blur(1.5px)',
                      scale: isActive ? 1 : 0.995,
                      backgroundColor: isActive ? '#FAFAF9' : 'transparent',
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className={`relative p-5 transition-colors duration-300 border-l-4 ${
                      isActive 
                        ? 'border-[#141414] shadow-sm text-lg leading-relaxed text-[#141414]'
                        : isPast
                          ? 'border-transparent text-[#141414]'
                          : 'border-transparent text-[#141414] select-none pointer-events-none'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 font-mono text-[10px] uppercase tracking-wider select-none">
                      <span className={`px-1.5 py-0.5 ${isActive ? 'bg-[#141414] text-[#E4E3E0] font-bold' : isPast ? 'bg-neutral-200 text-neutral-600' : 'text-neutral-400'}`}>
                        {isPast ? 'COMPLETED' : isActive ? 'ACTIVE PARAGRAPH' : 'UPCOMING'} § {idx + 1}
                      </span>
                    </div>
                    <p>{para}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Inputs */}
        <div className="flex flex-col bg-white min-h-0">
          <div className="h-8 shrink-0 bg-[#E4E3E0] border-b border-[#141414] px-4 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold">Active_Encoding_Zone</span>
            <span className="text-[10px] font-mono">Paragraph {currentParagraphIndex + 1} of {chapter.paragraphs.length}</span>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`paragraph-step-${currentParagraphIndex}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="flex flex-col gap-6"
              >
                {/* Context from previous step */}
                {!isFirstParagraph && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                    className="bg-[#F5F5F5] p-4 border border-[#141414] shadow-sm shrink-0"
                  >
                    <div className="text-[10px] font-mono uppercase font-bold opacity-50 block mb-2 underline decoration-[#141414]/20">
                      Previous Cumulative Summary
                    </div>
                    <p className="text-sm italic text-[#444] font-medium">"{previousCumulativeSummary}"</p>
                  </motion.div>
                )}

                <div className="shrink-0">
                  <label className="text-[10px] font-mono uppercase font-bold opacity-50 block mb-2 underline decoration-[#141414]/20">
                    1. Paragraph Summary (Condensation)
                  </label>
                  <textarea
                    value={paragraphSummary}
                    onChange={e => setParagraphSummary(e.target.value)}
                    disabled={feedback?.status === 'APPROVED' || isEvaluating}
                    className="w-full h-32 border border-[#141414] bg-[#F5F5F5] p-3 text-sm focus:outline-none resize-none font-medium disabled:opacity-50"
                    placeholder="Summarize the core meaning in 1 sentence..."
                  />
                </div>

                {!isFirstParagraph && (
                  <div className="shrink-0">
                    <label className="text-[10px] font-mono uppercase font-bold opacity-50 block mb-2 underline decoration-[#141414]/20">
                      2. Cumulative Context Linkage
                    </label>
                    <textarea
                      value={cumulativeSummary}
                      onChange={e => setCumulativeSummary(e.target.value)}
                      disabled={feedback?.status === 'APPROVED' || isEvaluating}
                      className="w-full h-32 border border-[#141414] bg-[#F5F5F5] p-3 text-sm focus:outline-none resize-none font-medium disabled:opacity-50"
                      placeholder="Merge with previous cumulative summary..."
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Inline Error Message */}
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 border border-red-500 bg-red-50 text-red-800 text-xs font-mono flex items-center justify-between gap-3 shrink-0"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button 
                  onClick={handleSubmit} 
                  disabled={isEvaluating}
                  className="px-3 py-1 bg-red-600 text-white hover:bg-red-700 text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1.5"
                >
                  <RotateCcw size={12} /> Retry
                </button>
              </motion.div>
            )}

            {feedback?.status !== 'APPROVED' ? (
              <div className="flex justify-end mt-4 shrink-0 pb-4">
                <button
                  onClick={handleSubmit}
                  disabled={isEvaluating || !paragraphSummary.trim() || (!isFirstParagraph && !cumulativeSummary.trim())}
                  className="bg-[#141414] text-[#E4E3E0] px-6 py-2 text-xs font-mono font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50 flex items-center gap-2"
                >
                  {isEvaluating ? <><Loader2 size={14} className="animate-spin" /> Evaluating...</> : 'Submit for Coaching'}
                </button>
              </div>
            ) : (
              <div className="flex justify-end mt-4 shrink-0 pb-4">
                <button
                  onClick={handleNext}
                  disabled={isIntercepting}
                  className="bg-green-600 text-white px-6 py-2 text-xs font-mono font-bold uppercase tracking-widest hover:bg-green-700 disabled:opacity-75 flex items-center gap-2"
                >
                  {isIntercepting ? (
                    <><Loader2 size={14} className="animate-spin" /> Verifying Trace...</>
                  ) : (
                    <>Continue <ChevronRight size={14} /></>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Feedback (Only show if we have feedback) */}
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25 }}
            className="h-48 border-t border-[#141414] bg-[#F0EFEC] flex shrink-0"
          >
            <div className="w-2/3 p-4 flex flex-col border-r border-[#141414]">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[11px] font-mono font-bold border px-1 ${feedback.status === 'APPROVED' ? 'text-green-600 border-green-600' : 'text-orange-600 border-orange-600'}`}>COACH_FEEDBACK</span>
                <span className="text-[11px] font-mono font-bold uppercase opacity-60">Analysis Status: {feedback.status}</span>
              </div>
              <p className="text-sm italic text-[#444] font-medium overflow-y-auto">
                "{feedback.feedback}"
              </p>
              
              {feedback.flags && (feedback.flags.is_copy_paste || feedback.flags.too_long) && (
                <div className="mt-auto flex gap-4">
                  {feedback.flags.is_copy_paste && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono font-bold">LEXICAL_OVERLAP</span>
                      <span className="text-[10px] text-red-600 font-bold underline">(REVISE: COPY-PASTE)</span>
                    </div>
                  )}
                  {feedback.flags.too_long && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono font-bold">LENGTH_LIMIT</span>
                      <span className="text-[10px] text-red-600 font-bold underline">(REVISE: TOO LONG)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1 p-4 flex flex-col items-center justify-center bg-[#141414] text-[#E4E3E0]">
              <div className="text-xs font-mono uppercase opacity-50 mb-2">Paragraph Status</div>
              <div className={`text-3xl font-mono font-bold tracking-tighter mb-1 text-center ${feedback.status === 'APPROVED' ? 'text-green-500' : 'text-orange-500'}`}>
                {feedback.status === 'APPROVED' ? 'APPROVED' : 'REVISION REQUIRED'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
