import { useState, useEffect, MouseEvent } from 'react';
import { UploadView } from './components/UploadView';
import { StudyView } from './components/StudyView';
import { RecapView } from './components/RecapView';
import { SurpriseRecallModal } from './components/SurpriseRecallModal';
import { AmbushControls } from './components/AmbushControls';
import { Chapter, Document, SurpriseQuestion, AmbushFrequency, AmbushStats } from './types';
import { Book, Plus, Trash2 } from 'lucide-react';

const DEFAULT_DOCUMENTS: Document[] = [
  {
    id: 'sample-doc-1',
    filename: 'Neurobiology of Retrieval & Spaced Memory.pdf',
    chapters: [
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
    ],
    status: 'study',
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
    previousCumulativeSummary: '',
  }
];

export default function App() {
  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem('marginalia_docs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_DOCUMENTS;
  });
  
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(() => {
    return documents.length > 0 ? documents[0].id : null;
  });
  const [isUploading, setIsUploading] = useState(false);

  // Surprise Ambush State & Preferences
  const [ambushEnabled, setAmbushEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('marginalia_ambush_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [ambushFrequency, setAmbushFrequency] = useState<AmbushFrequency>(() => {
    const saved = localStorage.getItem('marginalia_ambush_freq');
    return (saved as AmbushFrequency) || 'unpredictable';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('marginalia_ambush_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [ambushStats, setAmbushStats] = useState<AmbushStats>(() => {
    const saved = localStorage.getItem('marginalia_ambush_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      totalIntercepts: 0,
      successfulRecalls: 0,
      currentStreak: 0,
      bestStreak: 0,
      history: []
    };
  });

  const [activeSurpriseQuestion, setActiveSurpriseQuestion] = useState<SurpriseQuestion | null>(null);
  const [onSurpriseProceedCallback, setOnSurpriseProceedCallback] = useState<(() => void) | null>(null);
  const [isTriggeringInstant, setIsTriggeringInstant] = useState(false);

  // Sync documents to localStorage
  useEffect(() => {
    localStorage.setItem('marginalia_docs', JSON.stringify(documents));
  }, [documents]);

  // Sync ambush preferences
  useEffect(() => {
    localStorage.setItem('marginalia_ambush_enabled', JSON.stringify(ambushEnabled));
  }, [ambushEnabled]);

  useEffect(() => {
    localStorage.setItem('marginalia_ambush_freq', ambushFrequency);
  }, [ambushFrequency]);

  useEffect(() => {
    localStorage.setItem('marginalia_ambush_sound', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const handleUploadComplete = (filename: string, newChapters: Chapter[]) => {
    const newDoc: Document = {
      id: crypto.randomUUID(),
      filename,
      chapters: newChapters,
      status: 'study',
      currentChapterIndex: 0,
      currentParagraphIndex: 0,
      previousCumulativeSummary: '',
    };
    
    setDocuments(prev => [...prev, newDoc]);
    setActiveDocumentId(newDoc.id);
    setIsUploading(false);
  };

  const updateActiveDocument = (updates: Partial<Document>) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === activeDocumentId ? { ...doc, ...updates } : doc
    ));
  };

  const handleStudyComplete = () => {
    updateActiveDocument({ status: 'recap' });
  };

  const handleRecapComplete = () => {
    const activeDoc = documents.find(d => d.id === activeDocumentId);
    if (!activeDoc) return;
    
    if (activeDoc.currentChapterIndex < activeDoc.chapters.length - 1) {
      updateActiveDocument({
        currentChapterIndex: activeDoc.currentChapterIndex + 1,
        currentParagraphIndex: 0,
        previousCumulativeSummary: '',
        status: 'study'
      });
    } else {
      updateActiveDocument({ status: 'completed' });
    }
  };
  
  const handleDeleteDocument = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (activeDocumentId === id) {
      const remaining = documents.filter(d => d.id !== id);
      setActiveDocumentId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Strategic Surprise Ambush Evaluation
  const handleSurpriseCheck = async (
    pastParagraphs: string[],
    pastSummaries: string[],
    onProceed: () => void
  ): Promise<boolean> => {
    if (!ambushEnabled || pastParagraphs.length < 2) {
      return false;
    }

    // Variable ratio schedule probabilities:
    // frequent: 65%, unpredictable (Poisson optimal): 38%, rare: 20%
    const probability = ambushFrequency === 'frequent' ? 0.65 : ambushFrequency === 'rare' ? 0.20 : 0.38;
    if (Math.random() > probability) {
      return false;
    }

    try {
      // Prior paragraphs to force delayed retrieval rather than immediate echo
      const delayedParagraphs = pastParagraphs.slice(0, -1);

      const response = await fetch('/api/generate-surprise-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_title: activeDoc?.filename || 'Current Study Material',
          past_material: delayedParagraphs,
          past_summaries: pastSummaries
        })
      });

      if (!response.ok) {
        return false;
      }

      const questionData: SurpriseQuestion = await response.json();
      setActiveSurpriseQuestion(questionData);
      setOnSurpriseProceedCallback(() => onProceed);
      return true;
    } catch (err) {
      console.error('Surprise generation failed:', err);
      return false;
    }
  };

  // Instant Ambush Trigger (on-demand test)
  const handleInstantAmbush = async () => {
    if (!activeDoc) return;
    const currentChapter = activeDoc.chapters[activeDoc.currentChapterIndex];
    if (!currentChapter) return;

    // Gather material read so far
    const readParagraphs = currentChapter.paragraphs.slice(0, Math.max(1, activeDoc.currentParagraphIndex + 1));
    if (readParagraphs.length === 0) return;

    setIsTriggeringInstant(true);
    try {
      const response = await fetch('/api/generate-surprise-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_title: activeDoc.filename,
          past_material: readParagraphs,
          past_summaries: [activeDoc.previousCumulativeSummary].filter(Boolean)
        })
      });

      if (response.ok) {
        const questionData: SurpriseQuestion = await response.json();
        setActiveSurpriseQuestion(questionData);
        setOnSurpriseProceedCallback(null);
      }
    } catch (err) {
      console.error('Instant ambush error:', err);
    } finally {
      setIsTriggeringInstant(false);
    }
  };

  const handleSurpriseAnswered = (isCorrect: boolean) => {
    setAmbushStats(prev => {
      const nextStreak = isCorrect ? prev.currentStreak + 1 : 0;
      const updated: AmbushStats = {
        totalIntercepts: prev.totalIntercepts + 1,
        successfulRecalls: prev.successfulRecalls + (isCorrect ? 1 : 0),
        currentStreak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        history: [
          {
            timestamp: Date.now(),
            question: activeSurpriseQuestion?.question || '',
            concept: activeSurpriseQuestion?.concept_name || '',
            wasCorrect: isCorrect
          },
          ...prev.history.slice(0, 19)
        ]
      };
      localStorage.setItem('marginalia_ambush_stats', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCloseSurprise = () => {
    setActiveSurpriseQuestion(null);
    if (onSurpriseProceedCallback) {
      const callback = onSurpriseProceedCallback;
      setOnSurpriseProceedCallback(null);
      callback();
    }
  };

  const activeDoc = documents.find(d => d.id === activeDocumentId);
  const showUpload = isUploading || (documents.length === 0 && !activeDoc);

  return (
    <div className="flex h-screen w-full bg-[#E4E3E0] text-[#141414] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#141414] bg-[#F5F5F5] flex flex-col shrink-0">
        <div className="h-12 border-b border-[#141414] bg-[#141414] text-[#E4E3E0] flex items-center px-4 shrink-0">
          <span className="font-mono text-[10px] tracking-widest font-bold">YOUR_LIBRARY</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {documents.map(doc => (
            <button
              key={doc.id}
              onClick={() => {
                setActiveDocumentId(doc.id);
                setIsUploading(false);
              }}
              className={`text-left p-3 border border-[#141414] font-mono text-xs hover:bg-[#E4E3E0] flex items-center justify-between group ${activeDocumentId === doc.id && !isUploading ? 'bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]' : 'bg-white'}`}
            >
              <div className="flex items-center gap-2 truncate">
                <Book size={14} className="shrink-0" />
                <span className="truncate">{doc.filename}</span>
              </div>
              <Trash2 
                size={14} 
                className="opacity-0 group-hover:opacity-100 hover:text-red-500 shrink-0" 
                onClick={(e) => handleDeleteDocument(doc.id, e)}
              />
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-[#141414] bg-white shrink-0">
          <button
            onClick={() => setIsUploading(true)}
            className="w-full bg-[#E4E3E0] text-[#141414] border border-[#141414] px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest hover:bg-[#D1D0CC] transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={14} /> New Document
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-[#141414] flex items-center justify-between px-6 bg-[#141414] text-[#E4E3E0] shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs tracking-widest opacity-70">CORE_ENGINE_v4.2</span>
            <h1 className="font-bold uppercase tracking-tighter text-lg truncate max-w-sm">
              {activeDoc ? activeDoc.filename : 'Cumulative Marginalia'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Surprise Ambush Controls & Status */}
            <AmbushControls
              enabled={ambushEnabled}
              onToggleEnabled={() => setAmbushEnabled(prev => !prev)}
              frequency={ambushFrequency}
              onChangeFrequency={setAmbushFrequency}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(prev => !prev)}
              stats={ambushStats}
              onTriggerInstantAmbush={handleInstantAmbush}
              canTriggerInstant={Boolean(activeDoc && activeDoc.chapters.length > 0)}
              isTriggering={isTriggeringInstant}
            />

            {!showUpload && activeDoc && (
              <div className="flex items-center gap-3 border-l border-neutral-700 pl-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-xs font-mono font-bold uppercase hidden md:inline">
                    {activeDoc.status === 'study' ? 'PARAGRAPH_COACH' : 'CHAPTER_RECAP'}
                  </span>
                </div>
                <div className="text-xs font-mono border border-white/20 px-2 py-0.5 uppercase">
                  Ch {activeDoc.currentChapterIndex + 1}/{activeDoc.chapters.length}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden relative">
          {showUpload && <UploadView onUpload={handleUploadComplete} />}
          {!showUpload && activeDoc && activeDoc.status === 'study' && activeDoc.chapters[activeDoc.currentChapterIndex] && (
            <StudyView
              chapter={activeDoc.chapters[activeDoc.currentChapterIndex]}
              documentId={activeDoc.id}
              initialParagraphIndex={activeDoc.currentParagraphIndex}
              initialPreviousSummary={activeDoc.previousCumulativeSummary}
              onProgressUpdate={(paraIndex, prevSummary) => {
                updateActiveDocument({
                  currentParagraphIndex: paraIndex,
                  previousCumulativeSummary: prevSummary
                });
              }}
              onComplete={handleStudyComplete}
              onRequestSurpriseCheck={handleSurpriseCheck}
            />
          )}
          {!showUpload && activeDoc && activeDoc.status === 'recap' && activeDoc.chapters[activeDoc.currentChapterIndex] && (
            <RecapView
              chapter={activeDoc.chapters[activeDoc.currentChapterIndex]}
              onComplete={handleRecapComplete}
            />
          )}
          {!showUpload && activeDoc && activeDoc.status === 'completed' && (
            <div className="flex-1 flex items-center justify-center flex-col p-8 bg-[#E4E3E0]">
              <h2 className="text-3xl font-mono font-bold uppercase tracking-tighter mb-4 text-center">You have finished {activeDoc.filename}!</h2>
              <p className="text-[#141414]/70 mb-8 font-mono text-center">You successfully read and synthesized all the material.</p>
              <button
                onClick={() => setIsUploading(true)}
                className="bg-[#141414] text-[#E4E3E0] px-6 py-2 text-xs font-mono font-bold uppercase tracking-widest hover:bg-black transition-colors"
              >
                Study Another Document
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Surprise Recall Ambush Modal */}
      {activeSurpriseQuestion && (
        <SurpriseRecallModal
          questionData={activeSurpriseQuestion}
          onAnswered={handleSurpriseAnswered}
          onClose={handleCloseSurprise}
          soundEnabled={soundEnabled}
        />
      )}
    </div>
  );
}
