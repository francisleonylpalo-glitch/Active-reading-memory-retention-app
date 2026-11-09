# 🧠 AI Active Reading & Surprise Recall

> Read any book or paper with active compression, Feynman recaps, and surprise cold-recall quizzes to lock ideas into long-term memory.

---

## 💡 What is this?

Most people forget 70% of what they read within 48 hours because passive reading creates an **"illusion of competence"**—words look familiar, but your brain never actually stores the knowledge.

**Cumulative Marginalia** turns passive reading into an active learning game:
1. **Paragraph Breakdown**: Upload any PDF book or paper. The app splits it into digestible reading sections.
2. **Cumulative Condensation**: For every section, you write a 1-sentence summary in your own words (no copy-pasting allowed!) and connect it with what you learned before.
3. **AI Socratic Coach**: Gemini checks your logic in real-time. If you copy-pasted or missed the core point, it guides you without giving away the answer.
4. **Feynman Chapter Teaching**: At the end of each chapter, you teach the core concepts from memory without looking at notes.
5. **⚡ Cold-Recall Ambush (Surprise Quizzes)**: Out of nowhere, when you least expect it, a surprise micro-question tests a concept you read earlier to trigger dopamine and permanently consolidate memory.

---

## ✨ Key Features

- 📄 **PDF Parser**: Upload any PDF book, paper, or textbook (or use the built-in sample article).
- ✍️ **Active Encoding**: Write summaries step-by-step with progressive context accumulation.
- 🚫 **Anti-Copy-Paste Guard**: Detects word-for-word copy-paste and prompts you to explain concepts in plain language.
- 🎓 **Feynman End-of-Chapter Recap**: Tests whether you understand *cause-and-effect* relationships before letting you move forward.
- ⚡ **Surprise Memory Intercepts**:
  - Tests older material so you don't just rely on immediate short-term memory.
  - Safe timing: only triggers between transitions, never while you're in the middle of typing.
  - Variable-ratio schedule (Unpredictable, Frequent, or Rare).
  - Instant recall streaks & memory anchor takeaways.
  - "Surprise Me Now" button to test yourself anytime on demand.

---

## 🛠️ Quick Start for Beginners

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version 18 or higher) installed on your computer.

### 2. Clone the Repository
```bash
git clone https://github.com/francisleonylpalo-glitch/Book-Reading-With-AI---includes-random-multiple-choice-question-for-memory-retention.git
cd Book-Reading-With-AI---includes-random-multiple-choice-question-for-memory-retention
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Set Your Gemini API Key
Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

Create a `.env` file in the root folder:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Start the App
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🧠 The Science Behind It

This app is built on proven cognitive psychology principles:
- **The Testing Effect (Roediger & Karpicke, 2006)**: Actively retrieving an idea from memory strengthens neural pathways up to 4x more than re-reading.
- **Desirable Difficulties (Robert Bjork)**: Mild retrieval effort triggers lasting synaptic consolidation.
- **Dopamine via Unpredictability**: Unannounced surprise questions engage the attention network, tagging concepts with high behavioral relevance.

---

## 📂 Project Structure

```
├── server.ts               # Express backend & Gemini API endpoints
├── src/
│   ├── App.tsx             # Main application layout & state
│   ├── components/
│   │   ├── StudyView.tsx           # Step-by-step reading & active summary zone
│   │   ├── RecapView.tsx           # Feynman chapter-level teaching assessment
│   │   ├── SurpriseRecallModal.tsx # Unexpected cold-recall quiz modal
│   │   ├── AmbushControls.tsx      # Recall settings, streak tracking & frequency
│   │   └── UploadView.tsx          # PDF upload & sample document loader
│   └── types.ts            # TypeScript interfaces
├── .env.example            # Example environment variables
└── README.md
```

---

## 📄 License

MIT License — Feel free to use, modify, and build on this project!
