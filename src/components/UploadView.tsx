import { useState, useRef } from 'react';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { Chapter } from '../types';

interface UploadViewProps {
  onUpload: (filename: string, chapters: Chapter[]) => void;
}

export function UploadView({ onUpload }: UploadViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }
    
    // Check if file is larger than 15MB
    if (file.size > 15 * 1024 * 1024) {
      setError('File is too large. Please upload a PDF smaller than 15MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        let errMsg = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (e) {}
        throw new Error(errMsg);
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        if (text.trim().startsWith('<')) {
          throw new Error('Server returned an HTML page instead of data. The server might be restarting or the file is too large. Please try again with a smaller file (under 10MB).');
        }
        throw new Error('Invalid JSON response from server.');
      }

      if (data.chapters && data.chapters.length > 0) {
        onUpload(file.name, data.chapters);
      } else {
        setError('No text could be extracted from the PDF.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-[#E4E3E0] overflow-hidden">
      <div 
        className={`max-w-xl w-full p-12 bg-white border border-[#141414] transition-colors flex flex-col items-center text-center shadow-[8px_8px_0_0_rgba(20,20,20,1)] ${isDragging ? 'bg-[#D1D0CC]' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <div className="w-16 h-16 bg-[#141414] text-[#E4E3E0] rounded-none flex items-center justify-center mb-6">
          <UploadCloud size={32} />
        </div>
        <h2 className="text-2xl font-mono uppercase font-bold tracking-tighter mb-2 text-[#141414]">Upload PDF Document</h2>
        <p className="text-[#141414]/70 mb-8 max-w-md font-sans text-sm">
          Upload a document to begin. The engine will parse and deconstruct the text into structural active reading segments.
        </p>
        
        <input 
          type="file" 
          accept="application/pdf" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-xs font-mono font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading ? (
              <><Loader2 className="animate-spin" size={16} /> Parsing...</>
            ) : (
              <><FileText size={16} /> Select PDF File</>
            )}
          </button>

          <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold">OR</span>

          <button
            onClick={() => {
              const sampleChapters: Chapter[] = [
                {
                  id: 'chapter-1',
                  title: 'Chapter 1: The Testing Effect & Neurobiology of Retrieval',
                  paragraphs: [
                    'Memory retention is fundamentally governed by synaptic plasticity and long-term potentiation in the hippocampus. Without active reactivation, newly encoded episodic traces rapidly degrade along the classic Ebbinghaus forgetting curve, where up to 70 percent of new details vanish within forty-eight hours.',
                    'In seminal research by Roediger and Karpicke (2006), repeated passive reading was shown to foster a dangerous "illusion of competence." Because text looks familiar to the eyes, learners confuse perceptual fluency with durable mastery. True retention only occurs when learners actively practice retrieving knowledge from memory without perceptual prompts.',
                    'Robert Bjork introduced the principle of "Desirable Difficulties," establishing that retrieval effort is directly proportional to long-term synaptic consolidation. When recall feels somewhat effortful, slow, or delayed, the biological machinery rewires more robust memory pathways than effortless linear reviewing.',
                    'Neurochemically, unpredictable retrieval probes engage the Locus Coeruleus-Norepinephrine (LC-NE) network and phasic dopamine firing. When a question arrives unexpectedly without advance cueing or anticipation, the brain tags the retrieved concept with high behavioral significance, accelerating permanent consolidation into neocortical circuits.',
                    'To prevent cognitive fragmentation, active retrieval must be paired with progressive condensation. Translating complex conceptual mechanisms into concise, uncopied summaries forces the learner to discard borrowed jargon and reconcile logic gaps through the Feynman learning paradigm.'
                  ]
                },
                {
                  id: 'chapter-2',
                  title: 'Chapter 2: Tactical Implementation of Spaced Surprise Recalls',
                  paragraphs: [
                    'The fatal flaw of traditional pop quizzes is working memory annihilation. When a surprise test interrupts a student in the middle of drafting a sentence, the fragile phonological buffer collapses, triggering acute frustration and task abandonment rather than learning.',
                    'A scientifically valid surprise recall system must only intercept learners at natural cognitive checkpoints, specifically immediately following the successful synthesis of an active paragraph, before the next cognitive unit is initiated.',
                    'Furthermore, testing immediate working memory provides almost zero retention benefit. Quizzing an idea that was read five seconds ago merely measures sensory echo. Effective retrieval practice demands asking about concepts from prior paragraphs or earlier chapters that have already begun to cool in memory.',
                    'To combat cognitive fatigue, surprise probes must be structured as rapid micro-challenges taking under fifteen seconds. Sharp discrimination choices or focused causal questions activate deep retrieval pathways without inducing the friction of lengthy essay compositions.',
                    'Crucially, even when a learner fails an unexpected retrieval probe, the subsequent immediate correction cements memory more profoundly than if they had passively reviewed the correct answer, leveraging prediction error to permanently lock in the semantic schema.'
                  ]
                }
              ];
              onUpload('Neurobiology of Retrieval & Spaced Memory.pdf', sampleChapters);
            }}
            disabled={isUploading}
            className="px-5 py-3 bg-white text-[#141414] border border-[#141414] text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>⚡ Load Sample Cognitive Science Text</span>
          </button>
        </div>

        {error && (
          <p className="mt-6 text-red-600 font-mono text-xs uppercase tracking-wider font-bold border border-red-600 px-3 py-1 bg-red-50">{error}</p>
        )}
      </div>
    </div>
  );
}
