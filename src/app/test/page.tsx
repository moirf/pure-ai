"use client";

import { useState, useEffect } from "react";

interface Choice {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  choices: Choice[];
  type: "single" | "multiple";
}

export default function TestPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch("/api/quizzes/id/questions")
      .then((response) => response.json())
      .then((data) => setQuestions(data))
      .catch((error) => console.error("Error loading questions:", error));
  }, []);

  const handleAnswerChange = (questionId: string, choiceId: string, isChecked: boolean) => {
    setSelectedAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];
      const updatedAnswers = isChecked
        ? [...currentAnswers, choiceId]
        : currentAnswers.filter((id) => id !== choiceId);
      return { ...prev, [questionId]: updatedAnswers };
    });
  };

  const handleNext = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="p-4">
      {currentQuestion ? (
        <div>
          <h2 className="text-xl font-bold mb-4">{currentQuestion.text}</h2>
          <div>
            {currentQuestion.choices.map((choice) => (
              <label key={choice.id} className="block mb-2">
                <input
                  type={currentQuestion.type === "single" ? "radio" : "checkbox"}
                  name={currentQuestion.id}
                  value={choice.id}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, choice.id, e.target.checked)
                  }
                />
                {choice.text}
              </label>
            ))}
          </div>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      ) : (
        <h2 className="text-xl font-bold">No more questions.</h2>
      )}
    </div>
  );
}