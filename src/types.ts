export interface Chapter {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface Document {
  id: string;
  filename: string;
  chapters: Chapter[];
  status: 'study' | 'recap' | 'completed';
  currentChapterIndex: number;
  currentParagraphIndex: number;
  previousCumulativeSummary: string;
}

export interface Feedback {
  status: 'APPROVED' | 'NEEDS_REVISION';
  feedback: string;
  flags: {
    is_copy_paste: boolean;
    too_long: boolean;
  };
}

export interface RecapFeedback {
  mastery_score: number;
  threshold_concepts_found: string[];
  gaps_identified: string[];
  action_plan: string;
  proceed_to_next_chapter: boolean;
}

export interface SurpriseQuestion {
  question: string;
  options: string[];
  correct_option_index: number;
  concept_name: string;
  explanation: string;
  memory_anchor: string;
}

export type AmbushFrequency = 'unpredictable' | 'frequent' | 'rare';

export interface AmbushStats {
  totalIntercepts: number;
  successfulRecalls: number;
  currentStreak: number;
  bestStreak: number;
  history: Array<{
    timestamp: number;
    question: string;
    concept: string;
    wasCorrect: boolean;
  }>;
}
