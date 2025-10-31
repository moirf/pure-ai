import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { register } from './router';

interface Question {
  id: number;
  text: string;
  options: string[];
  // store answer as numeric index (server-side only)
  answerIndex: number;
  explanation?: string;
}

// Expanded sample question bank
const questions: Question[] = [
  {
    "id": 1,
    "topic": "Child Development & Pedagogy",
    "text": "Which of the following best describes Piaget's theory?",
    "options": [
      "Moral development",
      "Cognitive development",
      "Language acquisition"
    ],
    "answerIndex": 1
  },
  {
    "id": 2,
    "topic": "Language I (English)",
    "text": "Listening skill is best developed through:",
    "options": [
      "Dictation",
      "Storytelling",
      "Grammar drills"
    ],
    "answerIndex": 1
  },
  {
    "id": 3,
    "topic": "Language II (Hindi)",
    "text": "‘पर्यायवाची’ का अर्थ है:",
    "options": [
      "विपरीतार्थक शब्द",
      "एक जैसे अर्थ वाले शब्द",
      "भिन्न भाषा के शब्द"
    ],
    "answerIndex": 1
  },
  {
    "id": 4,
    "topic": "Mathematics",
    "text": "Which of these is a prime number?",
    "options": [
      "9",
      "11",
      "15"
    ],
    "answerIndex": 1
  },
  {
    "id": 5,
    "topic": "Environmental Studies",
    "text": "Plants prepare their food by:",
    "options": [
      "Photosynthesis",
      "Respiration",
      "Evaporation"
    ],
    "answerIndex": 0
  },
  {
    "id": 6,
    "topic": "Child Development & Pedagogy",
    "text": "Child-centered education focuses on:",
    "options": [
      "Teacher authority",
      "Learner participation",
      "Strict discipline"
    ],
    "answerIndex": 1
  },
  {
    "id": 7,
    "topic": "Language I (English)",
    "text": "The primary goal of language teaching is:",
    "options": [
      "Memorizing grammar",
      "Communication competence",
      "Learning definitions"
    ],
    "answerIndex": 1
  },
  {
    "id": 8,
    "topic": "Language II (Hindi)",
    "text": "भाषा सीखने का सबसे अच्छा तरीका है:",
    "options": [
      "पढ़ना और याद करना",
      "अभ्यास और संवाद",
      "केवल सुनना"
    ],
    "answerIndex": 1
  },
  {
    "id": 9,
    "topic": "Mathematics",
    "text": "Area of a square with side 6 cm is:",
    "options": [
      "36 sq.cm",
      "12 sq.cm",
      "18 sq.cm"
    ],
    "answerIndex": 0
  },
  {
    "id": 10,
    "topic": "Environmental Studies",
    "text": "Which of the following is a renewable resource?",
    "options": [
      "Coal",
      "Wind",
      "Petroleum"
    ],
    "answerIndex": 1
  },
  {
    "id": 11,
    "topic": "Child Development & Pedagogy",
    "text": "Vygotsky emphasized the importance of:",
    "options": [
      "Individual learning",
      "Social interaction",
      "Genetic factors"
    ],
    "answerIndex": 1
  },
  {
    "id": 12,
    "topic": "Language I (English)",
    "text": "‘Phonemic awareness’ refers to:",
    "options": [
      "Understanding sounds of language",
      "Writing sentences",
      "Reading paragraphs"
    ],
    "answerIndex": 0
  },
  {
    "id": 13,
    "topic": "Language II (Hindi)",
    "text": "‘शब्द’ का अर्थ है:",
    "options": [
      "ध्वनियों का समूह जो अर्थपूर्ण हो",
      "वाक्य का अंश",
      "अक्षरों की गिनती"
    ],
    "answerIndex": 0
  },
  {
    "id": 14,
    "topic": "Mathematics",
    "text": "The value of 3/4 + 2/4 is:",
    "options": [
      "1",
      "5/4",
      "3/2"
    ],
    "answerIndex": 0
  },
  {
    "id": 15,
    "topic": "Environmental Studies",
    "text": "Water changes into vapor during:",
    "options": [
      "Condensation",
      "Evaporation",
      "Freezing"
    ],
    "answerIndex": 1
  },
  {
    "id": 16,
    "topic": "Child Development & Pedagogy",
    "text": "Which of the following best describes Piaget's theory?",
    "options": [
      "Moral development",
      "Cognitive development",
      "Language acquisition"
    ],
    "answerIndex": 1
  },
  {
    "id": 17,
    "topic": "Language I (English)",
    "text": "Listening skill is best developed through:",
    "options": [
      "Dictation",
      "Storytelling",
      "Grammar drills"
    ],
    "answerIndex": 1
  },
  {
    "id": 18,
    "topic": "Language II (Hindi)",
    "text": "‘पर्यायवाची’ का अर्थ है:",
    "options": [
      "विपरीतार्थक शब्द",
      "एक जैसे अर्थ वाले शब्द",
      "भिन्न भाषा के शब्द"
    ],
    "answerIndex": 1
  },
  {
    "id": 19,
    "topic": "Mathematics",
    "text": "Which of these is a prime number?",
    "options": [
      "9",
      "11",
      "15"
    ],
    "answerIndex": 1
  },
  {
    "id": 20,
    "topic": "Environmental Studies",
    "text": "Plants prepare their food by:",
    "options": [
      "Photosynthesis",
      "Respiration",
      "Evaporation"
    ],
    "answerIndex": 0
  },
  {
    "id": 21,
    "topic": "Child Development & Pedagogy",
    "text": "Child-centered education focuses on:",
    "options": [
      "Teacher authority",
      "Learner participation",
      "Strict discipline"
    ],
    "answerIndex": 1
  },
  {
    "id": 22,
    "topic": "Language I (English)",
    "text": "The primary goal of language teaching is:",
    "options": [
      "Memorizing grammar",
      "Communication competence",
      "Learning definitions"
    ],
    "answerIndex": 1
  },
  {
    "id": 23,
    "topic": "Language II (Hindi)",
    "text": "भाषा सीखने का सबसे अच्छा तरीका है:",
    "options": [
      "पढ़ना और याद करना",
      "अभ्यास और संवाद",
      "केवल सुनना"
    ],
    "answerIndex": 1
  },
  {
    "id": 24,
    "topic": "Mathematics",
    "text": "Area of a square with side 6 cm is:",
    "options": [
      "36 sq.cm",
      "12 sq.cm",
      "18 sq.cm"
    ],
    "answerIndex": 0
  },
  {
    "id": 25,
    "topic": "Environmental Studies",
    "text": "Which of the following is a renewable resource?",
    "options": [
      "Coal",
      "Wind",
      "Petroleum"
    ],
    "answerIndex": 1
  },
  {
    "id": 26,
    "topic": "Child Development & Pedagogy",
    "text": "Vygotsky emphasized the importance of:",
    "options": [
      "Individual learning",
      "Social interaction",
      "Genetic factors"
    ],
    "answerIndex": 1
  },
  {
    "id": 27,
    "topic": "Language I (English)",
    "text": "‘Phonemic awareness’ refers to:",
    "options": [
      "Understanding sounds of language",
      "Writing sentences",
      "Reading paragraphs"
    ],
    "answerIndex": 0
  },
  {
    "id": 28,
    "topic": "Language II (Hindi)",
    "text": "‘शब्द’ का अर्थ है:",
    "options": [
      "ध्वनियों का समूह जो अर्थपूर्ण हो",
      "वाक्य का अंश",
      "अक्षरों की गिनती"
    ],
    "answerIndex": 0
  },
  {
    "id": 29,
    "topic": "Mathematics",
    "text": "The value of 3/4 + 2/4 is:",
    "options": [
      "1",
      "5/4",
      "3/2"
    ],
    "answerIndex": 0
  },
  {
    "id": 30,
    "topic": "Environmental Studies",
    "text": "Water changes into vapor during:",
    "options": [
      "Condensation",
      "Evaporation",
      "Freezing"
    ],
    "answerIndex": 1
  },
  {
    "id": 31,
    "topic": "Child Development & Pedagogy",
    "text": "Which of the following best describes Piaget's theory?",
    "options": [
      "Moral development",
      "Cognitive development",
      "Language acquisition"
    ],
    "answerIndex": 1
  },
  {
    "id": 32,
    "topic": "Language I (English)",
    "text": "Listening skill is best developed through:",
    "options": [
      "Dictation",
      "Storytelling",
      "Grammar drills"
    ],
    "answerIndex": 1
  },
  {
    "id": 33,
    "topic": "Language II (Hindi)",
    "text": "‘पर्यायवाची’ का अर्थ है:",
    "options": [
      "विपरीतार्थक शब्द",
      "एक जैसे अर्थ वाले शब्द",
      "भिन्न भाषा के शब्द"
    ],
    "answerIndex": 1
  },
  {
    "id": 34,
    "topic": "Mathematics",
    "text": "Which of these is a prime number?",
    "options": [
      "9",
      "11",
      "15"
    ],
    "answerIndex": 1
  },
  {
    "id": 35,
    "topic": "Environmental Studies",
    "text": "Plants prepare their food by:",
    "options": [
      "Photosynthesis",
      "Respiration",
      "Evaporation"
    ],
    "answerIndex": 0
  },
  {
    "id": 36,
    "topic": "Child Development & Pedagogy",
    "text": "Child-centered education focuses on:",
    "options": [
      "Teacher authority",
      "Learner participation",
      "Strict discipline"
    ],
    "answerIndex": 1
  },
  {
    "id": 37,
    "topic": "Language I (English)",
    "text": "The primary goal of language teaching is:",
    "options": [
      "Memorizing grammar",
      "Communication competence",
      "Learning definitions"
    ],
    "answerIndex": 1
  },
  {
    "id": 38,
    "topic": "Language II (Hindi)",
    "text": "भाषा सीखने का सबसे अच्छा तरीका है:",
    "options": [
      "पढ़ना और याद करना",
      "अभ्यास और संवाद",
      "केवल सुनना"
    ],
    "answerIndex": 1
  },
  {
    "id": 39,
    "topic": "Mathematics",
    "text": "Area of a square with side 6 cm is:",
    "options": [
      "36 sq.cm",
      "12 sq.cm",
      "18 sq.cm"
    ],
    "answerIndex": 0
  },
  {
    "id": 40,
    "topic": "Environmental Studies",
    "text": "Which of the following is a renewable resource?",
    "options": [
      "Coal",
      "Wind",
      "Petroleum"
    ],
    "answerIndex": 1
  },
  {
    "id": 41,
    "topic": "Child Development & Pedagogy",
    "text": "Vygotsky emphasized the importance of:",
    "options": [
      "Individual learning",
      "Social interaction",
      "Genetic factors"
    ],
    "answerIndex": 1
  },
  {
    "id": 42,
    "topic": "Language I (English)",
    "text": "‘Phonemic awareness’ refers to:",
    "options": [
      "Understanding sounds of language",
      "Writing sentences",
      "Reading paragraphs"
    ],
    "answerIndex": 0
  },
  {
    "id": 43,
    "topic": "Language II (Hindi)",
    "text": "‘शब्द’ का अर्थ है:",
    "options": [
      "ध्वनियों का समूह जो अर्थपूर्ण हो",
      "वाक्य का अंश",
      "अक्षरों की गिनती"
    ],
    "answerIndex": 0
  },
  {
    "id": 44,
    "topic": "Mathematics",
    "text": "The value of 3/4 + 2/4 is:",
    "options": [
      "1",
      "5/4",
      "3/2"
    ],
    "answerIndex": 0
  },
  {
    "id": 45,
    "topic": "Environmental Studies",
    "text": "Water changes into vapor during:",
    "options": [
      "Condensation",
      "Evaporation",
      "Freezing"
    ],
    "answerIndex": 1
  },
  {
    "id": 46,
    "topic": "Child Development & Pedagogy",
    "text": "Which of the following best describes Piaget's theory?",
    "options": [
      "Moral development",
      "Cognitive development",
      "Language acquisition"
    ],
    "answerIndex": 1
  },
  {
    "id": 47,
    "topic": "Language I (English)",
    "text": "Listening skill is best developed through:",
    "options": [
      "Dictation",
      "Storytelling",
      "Grammar drills"
    ],
    "answerIndex": 1
  },
  {
    "id": 48,
    "topic": "Language II (Hindi)",
    "text": "‘पर्यायवाची’ का अर्थ है:",
    "options": [
      "विपरीतार्थक शब्द",
      "एक जैसे अर्थ वाले शब्द",
      "भिन्न भाषा के शब्द"
    ],
    "answerIndex": 1
  },
  {
    "id": 49,
    "topic": "Mathematics",
    "text": "Which of these is a prime number?",
    "options": [
      "9",
      "11",
      "15"
    ],
    "answerIndex": 1
  },
  {
    "id": 50,
    "topic": "Environmental Studies",
    "text": "Plants prepare their food by:",
    "options": [
      "Photosynthesis",
      "Respiration",
      "Evaporation"
    ],
    "answerIndex": 0
  },
  {
    "id": 51,
    "topic": "Child Development & Pedagogy",
    "text": "Child-centered education focuses on:",
    "options": [
      "Teacher authority",
      "Learner participation",
      "Strict discipline"
    ],
    "answerIndex": 1
  },
  {
    "id": 52,
    "topic": "Language I (English)",
    "text": "The primary goal of language teaching is:",
    "options": [
      "Memorizing grammar",
      "Communication competence",
      "Learning definitions"
    ],
    "answerIndex": 1
  },
  {
    "id": 53,
    "topic": "Language II (Hindi)",
    "text": "भाषा सीखने का सबसे अच्छा तरीका है:",
    "options": [
      "पढ़ना और याद करना",
      "अभ्यास और संवाद",
      "केवल सुनना"
    ],
    "answerIndex": 1
  },
  {
    "id": 54,
    "topic": "Mathematics",
    "text": "Area of a square with side 6 cm is:",
    "options": [
      "36 sq.cm",
      "12 sq.cm",
      "18 sq.cm"
    ],
    "answerIndex": 0
  },
  {
    "id": 55,
    "topic": "Environmental Studies",
    "text": "Which of the following is a renewable resource?",
    "options": [
      "Coal",
      "Wind",
      "Petroleum"
    ],
    "answerIndex": 1
  },
  {
    "id": 56,
    "topic": "Child Development & Pedagogy",
    "text": "Vygotsky emphasized the importance of:",
    "options": [
      "Individual learning",
      "Social interaction",
      "Genetic factors"
    ],
    "answerIndex": 1
  },
  {
    "id": 57,
    "topic": "Language I (English)",
    "text": "‘Phonemic awareness’ refers to:",
    "options": [
      "Understanding sounds of language",
      "Writing sentences",
      "Reading paragraphs"
    ],
    "answerIndex": 0
  },
  {
    "id": 58,
    "topic": "Language II (Hindi)",
    "text": "‘शब्द’ का अर्थ है:",
    "options": [
      "ध्वनियों का समूह जो अर्थपूर्ण हो",
      "वाक्य का अंश",
      "अक्षरों की गिनती"
    ],
    "answerIndex": 0
  },
  {
    "id": 59,
    "topic": "Mathematics",
    "text": "The value of 3/4 + 2/4 is:",
    "options": [
      "1",
      "5/4",
      "3/2"
    ],
    "answerIndex": 0
  },
  {
    "id": 60,
    "topic": "Environmental Studies",
    "text": "Water changes into vapor during:",
    "options": [
      "Condensation",
      "Evaporation",
      "Freezing"
    ],
    "answerIndex": 1
  },
  {
    "id": 61,
    "topic": "Child Development & Pedagogy",
    "text": "Which of the following best describes Piaget's theory?",
    "options": [
      "Moral development",
      "Cognitive development",
      "Language acquisition"
    ],
    "answerIndex": 1
  },
  {
    "id": 62,
    "topic": "Language I (English)",
    "text": "Listening skill is best developed through:",
    "options": [
      "Dictation",
      "Storytelling",
      "Grammar drills"
    ],
    "answerIndex": 1
  },
  {
    "id": 63,
    "topic": "Language II (Hindi)",
    "text": "‘पर्यायवाची’ का अर्थ है:",
    "options": [
      "विपरीतार्थक शब्द",
      "एक जैसे अर्थ वाले शब्द",
      "भिन्न भाषा के शब्द"
    ],
    "answerIndex": 1
  },
  {
    "id": 64,
    "topic": "Mathematics",
    "text": "Which of these is a prime number?",
    "options": [
      "9",
      "11",
      "15"
    ],
    "answerIndex": 1
  },
  {
    "id": 65,
    "topic": "Environmental Studies",
    "text": "Plants prepare their food by:",
    "options": [
      "Photosynthesis",
      "Respiration",
      "Evaporation"
    ],
    "answerIndex": 0
  },
  {
    "id": 66,
    "topic": "Child Development & Pedagogy",
    "text": "Child-centered education focuses on:",
    "options": [
      "Teacher authority",
      "Learner participation",
      "Strict discipline"
    ],
    "answerIndex": 1
  },
  {
    "id": 67,
    "topic": "Language I (English)",
    "text": "The primary goal of language teaching is:",
    "options": [
      "Memorizing grammar",
      "Communication competence",
      "Learning definitions"
    ],
    "answerIndex": 1
  },
  {
    "id": 68,
    "topic": "Language II (Hindi)",
    "text": "भाषा सीखने का सबसे अच्छा तरीका है:",
    "options": [
      "पढ़ना और याद करना",
      "अभ्यास और संवाद",
      "केवल सुनना"
    ],
    "answerIndex": 1
  },
  {
    "id": 69,
    "topic": "Mathematics",
    "text": "Area of a square with side 6 cm is:",
    "options": [
      "36 sq.cm",
      "12 sq.cm",
      "18 sq.cm"
    ],
    "answerIndex": 0
  },
  {
    "id": 70,
    "topic": "Environmental Studies",
    "text": "Which of the following is a renewable resource?",
    "options": [
      "Coal",
      "Wind",
      "Petroleum"
    ],
    "answerIndex": 1
  },
  {
    "id": 71,
    "topic": "Child Development & Pedagogy",
    "text": "Vygotsky emphasized the importance of:",
    "options": [
      "Individual learning",
      "Social interaction",
      "Genetic factors"
    ],
    "answerIndex": 1
  },
  {
    "id": 72,
    "topic": "Language I (English)",
    "text": "‘Phonemic awareness’ refers to:",
    "options": [
      "Understanding sounds of language",
      "Writing sentences",
      "Reading paragraphs"
    ],
    "answerIndex": 0
  },
  {
    "id": 73,
    "topic": "Language II (Hindi)",
    "text": "‘शब्द’ का अर्थ है:",
    "options": [
      "ध्वनियों का समूह जो अर्थपूर्ण हो",
      "वाक्य का अंश",
      "अक्षरों की गिनती"
    ],
    "answerIndex": 0
  },
  {
    "id": 74,
    "topic": "Mathematics",
    "text": "The value of 3/4 + 2/4 is:",
    "options": [
      "1",
      "5/4",
      "3/2"
    ],
    "answerIndex": 0
  },
  {
    "id": 75,
    "topic": "Environmental Studies",
    "text": "Water changes into vapor during:",
    "options": [
      "Condensation",
      "Evaporation",
      "Freezing"
    ],
    "answerIndex": 1
  },
  {
    "id": 76,
    "topic": "Child Development & Pedagogy",
    "text": "Which of the following best describes Piaget's theory?",
    "options": [
      "Moral development",
      "Cognitive development",
      "Language acquisition"
    ],
    "answerIndex": 1
  },
  {
    "id": 77,
    "topic": "Language I (English)",
    "text": "Listening skill is best developed through:",
    "options": [
      "Dictation",
      "Storytelling",
      "Grammar drills"
    ],
    "answerIndex": 1
  },
  {
    "id": 78,
    "topic": "Language II (Hindi)",
    "text": "‘पर्यायवाची’ का अर्थ है:",
    "options": [
      "विपरीतार्थक शब्द",
      "एक जैसे अर्थ वाले शब्द",
      "भिन्न भाषा के शब्द"
    ],
    "answerIndex": 1
  },
  {
    "id": 79,
    "topic": "Mathematics",
    "text": "Which of these is a prime number?",
    "options": [
      "9",
      "11",
      "15"
    ],
    "answerIndex": 1
  },
  {
    "id": 80,
    "topic": "Environmental Studies",
    "text": "Plants prepare their food by:",
    "options": [
      "Photosynthesis",
      "Respiration",
      "Evaporation"
    ],
    "answerIndex": 0
  },
  {
    "id": 81,
    "topic": "Child Development & Pedagogy",
    "text": "Child-centered education focuses on:",
    "options": [
      "Teacher authority",
      "Learner participation",
      "Strict discipline"
    ],
    "answerIndex": 1
  },
  {
    "id": 82,
    "topic": "Language I (English)",
    "text": "The primary goal of language teaching is:",
    "options": [
      "Memorizing grammar",
      "Communication competence",
      "Learning definitions"
    ],
    "answerIndex": 1
  },
  {
    "id": 83,
    "topic": "Language II (Hindi)",
    "text": "भाषा सीखने का सबसे अच्छा तरीका है:",
    "options": [
      "पढ़ना और याद करना",
      "अभ्यास और संवाद",
      "केवल सुनना"
    ],
    "answerIndex": 1
  },
  {
    "id": 84,
    "topic": "Mathematics",
    "text": "Area of a square with side 6 cm is:",
    "options": [
      "36 sq.cm",
      "12 sq.cm",
      "18 sq.cm"
    ],
    "answerIndex": 0
  },
  {
    "id": 85,
    "topic": "Environmental Studies",
    "text": "Which of the following is a renewable resource?",
    "options": [
      "Coal",
      "Wind",
      "Petroleum"
    ],
    "answerIndex": 1
  },
  {
    "id": 86,
    "topic": "Child Development & Pedagogy",
    "text": "Vygotsky emphasized the importance of:",
    "options": [
      "Individual learning",
      "Social interaction",
      "Genetic factors"
    ],
    "answerIndex": 1
  },
  {
    "id": 87,
    "topic": "Language I (English)",
    "text": "‘Phonemic awareness’ refers to:",
    "options": [
      "Understanding sounds of language",
      "Writing sentences",
      "Reading paragraphs"
    ],
    "answerIndex": 0
  },
  {
    "id": 88,
    "topic": "Language II (Hindi)",
    "text": "‘शब्द’ का अर्थ है:",
    "options": [
      "ध्वनियों का समूह जो अर्थपूर्ण हो",
      "वाक्य का अंश",
      "अक्षरों की गिनती"
    ],
    "answerIndex": 0
  },
  {
    "id": 89,
    "topic": "Mathematics",
    "text": "The value of 3/4 + 2/4 is:",
    "options": [
      "1",
      "5/4",
      "3/2"
    ],
    "answerIndex": 0
  },
  {
    "id": 90,
    "topic": "Environmental Studies",
    "text": "Water changes into vapor during:",
    "options": [
      "Condensation",
      "Evaporation",
      "Freezing"
    ],
    "answerIndex": 1
  },
  {
    "id": 91,
    "topic": "Child Development & Pedagogy",
    "text": "Which of the following best describes Piaget's theory?",
    "options": [
      "Moral development",
      "Cognitive development",
      "Language acquisition"
    ],
    "answerIndex": 1
  },
  {
    "id": 92,
    "topic": "Language I (English)",
    "text": "Listening skill is best developed through:",
    "options": [
      "Dictation",
      "Storytelling",
      "Grammar drills"
    ],
    "answerIndex": 1
  },
  {
    "id": 93,
    "topic": "Language II (Hindi)",
    "text": "‘पर्यायवाची’ का अर्थ है:",
    "options": [
      "विपरीतार्थक शब्द",
      "एक जैसे अर्थ वाले शब्द",
      "भिन्न भाषा के शब्द"
    ],
    "answerIndex": 1
  },
  {
    "id": 94,
    "topic": "Mathematics",
    "text": "Which of these is a prime number?",
    "options": [
      "9",
      "11",
      "15"
    ],
    "answerIndex": 1
  },
  {
    "id": 95,
    "topic": "Environmental Studies",
    "text": "Plants prepare their food by:",
    "options": [
      "Photosynthesis",
      "Respiration",
      "Evaporation"
    ],
    "answerIndex": 0
  },
  {
    "id": 96,
    "topic": "Child Development & Pedagogy",
    "text": "Child-centered education focuses on:",
    "options": [
      "Teacher authority",
      "Learner participation",
      "Strict discipline"
    ],
    "answerIndex": 1
  },
  {
    "id": 97,
    "topic": "Language I (English)",
    "text": "The primary goal of language teaching is:",
    "options": [
      "Memorizing grammar",
      "Communication competence",
      "Learning definitions"
    ],
    "answerIndex": 1
  },
  {
    "id": 98,
    "topic": "Language II (Hindi)",
    "text": "भाषा सीखने का सबसे अच्छा तरीका है:",
    "options": [
      "पढ़ना और याद करना",
      "अभ्यास और संवाद",
      "केवल सुनना"
    ],
    "answerIndex": 1
  },
  {
    "id": 99,
    "topic": "Mathematics",
    "text": "Area of a square with side 6 cm is:",
    "options": [
      "36 sq.cm",
      "12 sq.cm",
      "18 sq.cm"
    ],
    "answerIndex": 0
  },
  {
    "id": 100,
    "topic": "Environmental Studies",
    "text": "Which of the following is a renewable resource?",
    "options": [
      "Coal",
      "Wind",
      "Petroleum"
    ],
    "answerIndex": 1
  }
];

function stripAnswer(q: Question) {
  const { answerIndex, explanation, ...rest } = q;
  return rest;
}

export const listQuestions = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  // Support query params: index=<n> returns single question at index (0-based),
  // count=<m> returns m random questions, random=true returns randomized set
  const qs = (event.queryStringParameters || {}) as Record<string, string>;
  const index = qs.index ? Number(qs.index) : undefined;
  const count = qs.count ? Math.min(50, Math.max(1, Number(qs.count))) : undefined;
  const random = qs.random === 'true' || false;

  if (typeof index === 'number' && !isNaN(index)) {
    const q = questions[index % questions.length];
    if (!q) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Not found' }) };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stripAnswer(q)) };
  }

  let pool = [...questions];
  if (random) {
    // simple shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  if (count) {
    pool = pool.slice(0, count);
  }

  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pool.map(stripAnswer)) };
};

export const validateAnswer = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { sessionId, index, selectedIndex } = body as { sessionId?: string; index?: number; selectedIndex?: number };
    if (!sessionId || typeof index !== 'number' || typeof selectedIndex !== 'number') {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'sessionId, index and selectedIndex are required' }) };
    }

    const sess = sessionStore.get(sessionId);
    if (!sess) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Session not found' }) };
    if (index < 0 || index >= sess.ids.length) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid index' }) };

    const qid = sess.ids[index];
    const q = questions.find((x) => x.id === qid);
    if (!q) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Question not found' }) };

    // Map selectedIndex (client-ordered) back to original index
    const order = sess.optionOrders[index];
    const mapped = order[selectedIndex];
    const correct = q.answerIndex === mapped;

    // Optionally record the answer in session
    sess.answers[index] = correct ? 1 : 0;

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correct }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

// Simple in-memory session store (ephemeral)
type Session = {
  id: string;
  ids: number[]; // question ids in order for this session
  optionOrders: number[][]; // per-question mapping: client index -> original option index
  answers: number[]; // -1 unanswered, 1 correct, 0 wrong
};

const sessionStore = new Map<string, Session>();

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const startSession = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { count = 15 } = body as { count?: number };
    const pool = shuffle(questions).slice(0, Math.min(count, questions.length));
    const ids = pool.map((q) => q.id);
    const optionOrders = pool.map((q) => shuffle(q.options.map((_, i) => i)));
    const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const sess: Session = { id: sessionId, ids, optionOrders, answers: new Array(ids.length).fill(-1) };
    sessionStore.set(sessionId, sess);

    // return first question with shuffled options
    const first = questions.find((x) => x.id === ids[0])!;
    const order = optionOrders[0];
    const clientOptions = order.map((oi) => first.options[oi]);

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, index: 0, question: { id: first.id, text: first.text, options: clientOptions } }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const getSessionQuestion = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const qs = (event.queryStringParameters || {}) as Record<string, string>;
    const sessionId = qs.session;
    const index = qs.index ? Number(qs.index) : 0;
    if (!sessionId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'session required' }) };
    const sess = sessionStore.get(sessionId);
    if (!sess) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'session not found' }) };
    if (index < 0 || index >= sess.ids.length) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'invalid index' }) };

    const qid = sess.ids[index];
    const q = questions.find((x) => x.id === qid)!;
    const order = sess.optionOrders[index];
    const clientOptions = order.map((oi) => q.options[oi]);

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, index, question: { id: q.id, text: q.text, options: clientOptions } }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

// Register route
register('POST', '/api/questions/start', startSession);
register('GET', '/api/questions', getSessionQuestion);
register('POST', '/api/questions/answer', validateAnswer);
