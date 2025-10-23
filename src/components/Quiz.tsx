import React, { useState } from 'react';

const Quiz: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions'); // Updated to use the local API
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  return (
    <div>
      <button onClick={fetchQuestions}>Start Quiz</button>
      <ul>
        {questions.map((question, index) => (
          <li key={index}>{question.text}</li>
        ))}
      </ul>
    </div>
  );
};

export default Quiz;
