import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Process-level safety guards
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

app.use(express.json());

// API routes FIRST
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const upload = multer({ storage: multer.memoryStorage() });

let aiClient: GoogleGenAI | null = null;

function getAI() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Helper to handle API retries for 503/429 errors and model fallback
async function callGeminiWithRetry(ai: GoogleGenAI, params: any, maxRetries = 3) {
  const candidateModels = [params.model || 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const currentModel = attempt > 1 && candidateModels[1] ? candidateModels[1] : candidateModels[0];
    const currentParams = { ...params, model: currentModel };

    try {
      return await ai.models.generateContent(currentParams);
    } catch (error: any) {
      const errorStr = JSON.stringify(error) + (error?.message || '');
      const isRetryable = error?.status === 503 || error?.status === 429 ||
                          error?.error?.code === 503 || error?.error?.code === 429 ||
                          errorStr.includes('503') || errorStr.includes('429') || 
                          errorStr.includes('UNAVAILABLE') || errorStr.includes('RESOURCE_EXHAUSTED') ||
                          errorStr.includes('high demand') || errorStr.includes('overloaded');

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delayMs = attempt * 1200;
      console.warn(`Gemini API busy with ${currentModel}. Retrying in ${delayMs}ms (Attempt ${attempt}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// Helper to chunk text into paragraphs and then into chapters (e.g., 5 paragraphs per chapter)
function processPdfText(text: string) {
  // Split by multiple newlines or rough heuristics
  const rawParagraphs = text.split(/\n\s*\n/).map(p => p.trim().replace(/\n/g, ' ')).filter(p => p.length > 50);
  
  const chapters = [];
  let currentChapter = [];
  
  for (const p of rawParagraphs) {
    currentChapter.push(p);
    if (currentChapter.length >= 5) { // 5 paragraphs per chapter for progressive condensation
      chapters.push(currentChapter);
      currentChapter = [];
    }
  }
  if (currentChapter.length > 0) {
    chapters.push(currentChapter);
  }
  
  return chapters.map((paragraphs, i) => ({
    id: `chapter-${i + 1}`,
    title: `Chapter ${i + 1}`,
    paragraphs
  }));
}

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const parser = new PDFParse({ data: req.file.buffer });
    const data = await parser.getText();
    const chapters = processPdfText(data.text);
    res.json({ chapters });
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse PDF' });
  }
});

app.post('/api/evaluate-paragraph', async (req, res) => {
  try {
    const {
      current_paragraph_text,
      previous_cumulative_summary,
      user_paragraph_summary,
      user_cumulative_summary
    } = req.body;

    const ai = getAI();

    const systemPrompt = `ROLE: You are the core processing engine of an advanced Active Reading and Meta-Learning platform. Your architecture implements a scoped version of "Progressive Condensation" (Cumulative Marginalia) and the Feynman Teaching Technique to maximize semantic retention.

You operate in MODE 1: PARAGRAPH_COACH (Lightweight, Real-time Validation)
OBJECTIVE: Evaluate the user's summaries for the CURRENT paragraph and the SCOPED CUMULATIVE progress of the active section.

COACHING RULES:
1. NEVER provide or write the correct summary for the user.
2. Check for "Copy-Paste Plagiarism": If the user's summaries share more than a 40% lexical match with the raw text without abstraction, flag it immediately.
3. Validate Semantic Accuracy: Ensure the user captured the actual meaning, not a superficial detail.`;

    const prompt = `
INPUT PARAMETERS:
- current_paragraph_text: ${current_paragraph_text}
- previous_cumulative_summary: ${previous_cumulative_summary}
- user_paragraph_summary: ${user_paragraph_summary}
- user_cumulative_summary: ${user_cumulative_summary}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["APPROVED", "NEEDS_REVISION"] },
            feedback: { type: Type.STRING, description: "A concise, encouraging, but direct 1-2 sentence hint. If they failed, point out the *logic gap* or *missing linkage* without revealing the answer." },
            flags: {
              type: Type.OBJECT,
              properties: {
                is_copy_paste: { type: Type.BOOLEAN },
                too_long: { type: Type.BOOLEAN }
              },
              required: ["is_copy_paste", "too_long"]
            }
          },
          required: ["status", "feedback", "flags"]
        }
      }
    });

    res.json(JSON.parse(response.text!));
  } catch (error: any) {
    console.error('Evaluate paragraph error:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate paragraph' });
  }
});

app.post('/api/evaluate-recap', async (req, res) => {
  try {
    const {
      complete_chapter_text,
      user_recap_explanation,
      attempt_number
    } = req.body;

    const ai = getAI();

    const systemPrompt = `ROLE: You are the core processing engine of an advanced Active Reading and Meta-Learning platform. Your architecture implements a scoped version of "Progressive Condensation" (Cumulative Marginalia) and the Feynman Teaching Technique to maximize semantic retention.

You operate in MODE 2: CHAPTER_RECAP_EVALUATOR (Heavy, Rubric-Based Grading)
OBJECTIVE: Execute the Socratic Teaching Evaluation at the end of a chapter. Grade the user's explanation against the absolute source text of the chapter.

EVALUATION RULES:
1. Identify 3-5 "Threshold Concepts" (non-negotiable core ideas) within the complete_chapter_text.
2. Cross-reference the user_recap_explanation against these Threshold Concepts.
3. Calculate a Mastery Score from 0 to 100 based on coverage, conceptual clarity, and explanation of causal relationships (X causes Y).
4. If attempt_number == 1 and Score < 80: Act as a tough Socratic professor. Identify the specific conceptual holes and prompt them to revise.
5. If attempt_number == 2 and Score < 80: Pass them to prevent frustration, but explicitly list the answers to their missing gaps and flag them for future review.`;

    const prompt = `
INPUT PARAMETERS:
- complete_chapter_text: ${complete_chapter_text}
- user_recap_explanation: ${user_recap_explanation}
- attempt_number: ${attempt_number}
`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mastery_score: { type: Type.INTEGER },
            threshold_concepts_found: { type: Type.ARRAY, items: { type: Type.STRING } },
            gaps_identified: { type: Type.ARRAY, items: { type: Type.STRING } },
            action_plan: { type: Type.STRING, description: "Specific Socratic guidance on what to adjust, or the explicit answers if it is Attempt #2." },
            proceed_to_next_chapter: { type: Type.BOOLEAN }
          },
          required: ["mastery_score", "threshold_concepts_found", "gaps_identified", "action_plan", "proceed_to_next_chapter"]
        }
      }
    });

    res.json(JSON.parse(response.text!));
  } catch (error: any) {
    console.error('Evaluate recap error:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate recap' });
  }
});

app.post('/api/generate-surprise-question', async (req, res) => {
  try {
    const { document_title, past_material, past_summaries } = req.body;
    const ai = getAI();

    const systemPrompt = `ROLE: You are an expert cognitive scientist and testing-effect specialist.
OBJECTIVE: Generate a high-potency "Surprise Cold-Recall Intercept" question based on PREVIOUSLY studied material.
THE COGNITIVE SCIENCE PRINCIPLE:
To maximize long-term retention and trigger dopamine/norepinephrine consolidation:
1. Test deep conceptual understanding, causal links, or foundational mechanisms—NOT trivial superficial wording.
2. Require active retrieval from past material (the user cannot see the source text during this surprise).
3. Offer 4 plausible, thoughtful multiple-choice options (1 correct answer and 3 tricky distractors representing common misconceptions).
4. Keep the question crisp (under 25 words) so the user can process and answer in under 15 seconds without cognitive fatigue.`;

    const prompt = `
DOCUMENT: ${document_title || 'Current Study Text'}
PAST MATERIAL TO RETRIEVE FROM:
${JSON.stringify(past_material || [])}

PAST USER SUMMARIES:
${JSON.stringify(past_summaries || [])}

Generate a single surprise retrieval question testing an important idea from the past material above.`;

    const response = await callGeminiWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Array of exactly 4 choices"
            },
            correct_option_index: { 
              type: Type.INTEGER, 
              description: "0-based index (0, 1, 2, or 3) of the correct choice" 
            },
            concept_name: { type: Type.STRING, description: "Name of the core concept being tested" },
            explanation: { type: Type.STRING, description: "Clear 1-2 sentence explanation of why this answer is correct and the memory anchor" },
            memory_anchor: { type: Type.STRING, description: "A high-impact 1-sentence takeaway to sear into long-term memory" }
          },
          required: ["question", "options", "correct_option_index", "concept_name", "explanation", "memory_anchor"]
        }
      }
    });

    res.json(JSON.parse(response.text!));
  } catch (error: any) {
    console.error('Surprise question error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate surprise question' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
