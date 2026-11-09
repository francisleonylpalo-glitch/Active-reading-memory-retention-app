import { useState } from 'react';
import { Chapter, RecapFeedback } from '../types';
import { Loader2, CheckCircle, AlertTriangle, BookOpen, ArrowRight, AlertCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecapViewProps {
  chapter: Chapter;
  onComplete: () => void;
}

export function RecapView({ chapter, onComplete }: RecapViewProps) {
  const [recap, setRecap] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<RecapFeedback | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const completeText = chapter.paragraphs.join('\n\n');

  const handleSubmit = async () => {
    if (!recap.trim()) return;
    
    setIsEvaluating(true);
    setFeedback(null);
    setErrorMessage(null);
    const currentAttempt = attempts + 1;
    setAttempts(currentAttempt);

    try {
      const response = await fetch('/api/evaluate-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complete_chapter_text: completeText,
          user_recap_explanation: recap,
          attempt_number: currentAttempt
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Evaluation failed. The model is temporarily busy. Please try again.');
      }
      setFeedback(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error evaluating recap. The model is busy right now. Please try again.');
      setAttempts(attempts); // revert
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <section className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="flex-1 grid grid-cols-2 overflow-hidden">
        {/* Left Panel: Chapter Review */}
        <div className="border-r border-[#141414] flex flex-col bg-white min-h-0">
          <div className="h-8 bg-[#E4E3E0] border-b border-[#141414] px-4 flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase font-bold">Chapter Review</span>
            <span className="text-[10px] font-mono opacity-50">Review the full text before teaching.</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 font-serif leading-relaxed text-lg text-[#222]">
            <div className="max-w-2xl mx-auto space-y-4">
              {chapter.paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Teaching Recaps */}
        <div className="flex flex-col bg-white min-h-0">
          <div className="h-8 bg-[#E4E3E0] border-b border-[#141414] px-4 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold">Feynman Teaching Evaluation</span>
            <span className="text-[10px] font-mono">Attempt {attempts} / 2</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <div className="bg-[#141414] text-[#E4E3E0] p-4">
              <h3 className="font-mono text-xs font-bold uppercase mb-2">Your Task: Teach this Chapter</h3>
              <p className="text-sm font-sans opacity-80 leading-relaxed">
                Without looking too heavily at the text on the left, explain the core principles of this chapter in your own words as if teaching it to someone else. Make sure to explain *why* things happen (cause and effect).
              </p>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <textarea
                value={recap}
                onChange={e => setRecap(e.target.value)}
                disabled={feedback?.proceed_to_next_chapter || isEvaluating || attempts >= 2}
                className="w-full flex-1 min-h-[16rem] border border-[#141414] bg-[#F5F5F5] p-4 text-sm focus:outline-none resize-none font-medium disabled:opacity-50"
                placeholder="Start teaching here..."
              />
              
              {errorMessage && (
                <div className="p-3 border border-red-500 bg-red-50 text-red-800 text-xs font-mono flex items-center justify-between gap-3 shrink-0">
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
                </div>
              )}

              {(!feedback?.proceed_to_next_chapter && attempts < 2) ? (
                <div className="flex justify-end shrink-0 mt-auto">
                  <button
                    onClick={handleSubmit}
                    disabled={isEvaluating || !recap.trim()}
                    className="bg-[#141414] text-[#E4E3E0] px-6 py-2 text-xs font-mono font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50 flex items-center gap-2"
                  >
                    {isEvaluating ? <><Loader2 size={14} className="animate-spin" /> Evaluating Mastery...</> : 'Submit Explanation'}
                  </button>
                </div>
              ) : (
                <div className="flex justify-end shrink-0 mt-auto">
                  <button
                    onClick={onComplete}
                    className="bg-green-600 text-white px-6 py-2 text-xs font-mono font-bold uppercase tracking-widest hover:bg-green-700 flex items-center gap-2"
                  >
                    Proceed to Next Section <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Rubric Feedback */}
      {feedback && (
        <div className="h-48 border-t border-[#141414] bg-[#F0EFEC] flex shrink-0">
          <div className="w-2/3 p-4 flex flex-col border-r border-[#141414] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[11px] font-mono font-bold border px-1 ${
                feedback.mastery_score >= 80 ? 'text-green-600 border-green-600' : 
                feedback.proceed_to_next_chapter ? 'text-orange-600 border-orange-600' : 'text-red-600 border-red-600'
              }`}>EVALUATION_FEEDBACK</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 shrink-0">
              <div>
                <h4 className="font-mono text-[10px] uppercase font-bold opacity-50 mb-1">Threshold Concepts Found</h4>
                <ul className="list-disc pl-4 space-y-1 text-xs font-medium text-[#141414]">
                  {feedback.threshold_concepts_found.map((concept, i) => (
                    <li key={i}>{concept}</li>
                  ))}
                </ul>
              </div>

              {feedback.gaps_identified && feedback.gaps_identified.length > 0 && (
                <div>
                  <h4 className="font-mono text-[10px] uppercase font-bold text-red-600 mb-1">Knowledge Gaps</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs font-medium text-red-700">
                    {feedback.gaps_identified.map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-4 pt-2 border-t border-[#141414]/10 shrink-0">
              <h4 className="font-mono text-[10px] uppercase font-bold opacity-50 mb-1">Socratic Action Plan</h4>
              <p className="text-sm italic text-[#444] font-medium">
                "{feedback.action_plan}"
              </p>
            </div>
          </div>
          
          <div className="flex-1 p-4 flex flex-col items-center justify-center bg-[#141414] text-[#E4E3E0]">
            <div className="text-xs font-mono uppercase opacity-50 mb-2">Section Mastery</div>
            <div className={`text-5xl font-mono font-bold tracking-tighter mb-1 ${
              feedback.mastery_score >= 80 ? 'text-green-500' : 
              feedback.proceed_to_next_chapter ? 'text-orange-500' : 'text-red-500'
            }`}>
              {feedback.mastery_score.toFixed(1)}
            </div>
            <div className="w-full px-8 mt-2">
              <div className="h-1 bg-white/10 w-full overflow-hidden">
                <div className={`h-full ${
                  feedback.mastery_score >= 80 ? 'bg-green-500' : 'bg-orange-500'
                }`} style={{ width: `${feedback.mastery_score}%` }}></div>
              </div>
            </div>
            <div className="text-[9px] font-mono uppercase mt-2 text-orange-500">Socratic Threshold: 80.0</div>
          </div>
        </div>
      )}
    </section>
  );
}
