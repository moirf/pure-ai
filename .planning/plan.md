# Web Testing App — Implementation Plan

Goal
- Web app for quizzes (single and multiple choice).
- Backend validates answers and returns score/percent.
- Frontend displays current percent and per-question feedback.

Recommended tech stack
- Backend: Node.js + Express (or Fastify). Prototype DB: SQLite; production: Postgres.
- Frontend: React (Vite/Create React App) or plain HTML + vanilla JS for a minimal prototype.
- Optional: JWT/session auth for user tracking.

Core data model
- Question
  - id: string
  - text: string
  - choices: [{ id: string, text: string }]
  - correct: string[]           # 1 element for single-choice, multiple for multiple-choice
  - type: 'single' | 'multiple'
  - points?: number            # default 1
- Attempt
  - id: string
  - quizId?: string
  - answers: [{ questionId: string, selected: string[] }]
  - score: number
  - percent: number
  - createdAt: string

API design
- GET /api/quizzes/:id/questions
- POST /api/attempts
  - Request: { quizId?, answers: [{ questionId, selected: [choiceId] }] }
  - Response:
    {
      attemptId,
      score,
      percent,
      totalPoints,
      perQuestion: [{ questionId, correct: boolean, earnedPoints, maxPoints }]
    }
- GET /api/attempts/:id

Validation & scoring rules
- Normalize selected IDs to a unique set per question.
- Single-choice: full credit if selected[0] === correct[0].
- Multiple-choice:
  - Strict: full credit only if the sets match exactly.
  - Partial credit: earned = max(0, (# correct selected / # correct) - (# incorrect selected / # choices)) * points.

Frontend behavior
- Render questions with radio buttons (single-choice) and checkboxes (multiple-choice).
- Local optimistic percent: show live progress using the same scoring heuristic.
- Submission flow:
  1. Collect answers and disable UI.
  2. POST submission via /api/attempts.
  3. Display percent and per-question feedback.
- UI elements:
  - Animated progress bar.
  - Per-question badges (correct / incorrect / partial).
  - Optional review mode to show correct answers.

Testing
- Unit tests for scoring/validation logic.
- Integration tests for API endpoints.
- Optional E2E tests for complete user flow.

Milestones
1. Setup repository, backend skeleton, and sample data.
2. Implement validation logic and POST /api/attempts.
3. Build basic frontend interface to load questions and submit answers.
4. Display percent and per-question feedback.
5. Testing, polish, and deploy.

Extensions / Future Work
- Timed quizzes and multimedia support in questions.
- Admin UI for quiz management.
- User accounts and analytics dashboard.
