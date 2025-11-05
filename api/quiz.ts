import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { register } from './router';

// Optional DynamoDB support (AWS SDK v3)
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

interface Question {
  id: number;
  Category?: string;
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
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
    "Category": "Child Development & Pedagogy",
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
    "Category": "Language I (English)",
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
    "Category": "Language II (Hindi)",
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
    "Category": "Mathematics",
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
    "Category": "Environmental Studies",
    "text": "Which of the following is a renewable resource?",
    "options": [
      "Coal",
      "Wind",
      "Petroleum"
    ],
    "answerIndex": 1
  }
];

// DynamoDB setup (optional). Set `QUESTIONS_TABLE` or `DDB_TABLE` in env to enable.
const ddbTable = 'QuestionBank';
let ddbDocClient: DynamoDBDocumentClient | null = null;
if (ddbTable) {
  const client = new DynamoDBClient({});
  ddbDocClient = DynamoDBDocumentClient.from(client);
}

// Simple in-memory cache to avoid scanning DynamoDB on every request
let dbQuestionsCache: Question[] | null = null;

async function loadQuestionsFromDB(): Promise<Question[]> {
  if (!ddbDocClient || !ddbTable) return questions;
  if (dbQuestionsCache) return dbQuestionsCache;
  try {
    const res = await ddbDocClient.send(new ScanCommand({ TableName: ddbTable }));
    const items = res.Items || [];
    const mapped: Question[] = items.map((it: any, idx: number) => {
      // Support both numeric and string id representations
      const idVal = it.id ?? it.ID ?? it.pk ?? idx + 1;
      const id = typeof idVal === 'string' ? Number(idVal) : idVal;
      return {
        id,
        text: it.text || it.question || it.title || '',
        options: Array.isArray(it.options) ? it.options : (it.options_list || it.choices || []),
        answerIndex: typeof it.answerIndex === 'number' ? it.answerIndex : (typeof it.answer === 'number' ? it.answer : 0),
        explanation: it.explanation,
      } as Question;
    });
    dbQuestionsCache = mapped;
    return mapped;
  } catch (err) {
    console.warn('Failed to load questions from DynamoDB, falling back to in-file list', String(err));
    dbQuestionsCache = questions;
    return questions;
  }
}

async function getQuestionById(id: number): Promise<Question | undefined> {
  if (!ddbDocClient || !ddbTable) {
    return questions.find((q) => q.id === id);
  }
  try {
    // Try GetCommand assuming primary key is `id`
    const res = await ddbDocClient.send(new GetCommand({ TableName: ddbTable, Key: { id } } as any));
    const it = res.Item;
    if (!it) {
      // fallback to cached scan
      const all = await loadQuestionsFromDB();
      return all.find((q) => q.id === id);
    }
    const idVal = it.id ?? it.ID ?? it.pk ?? id;
    const realId = typeof idVal === 'string' ? Number(idVal) : idVal;
    return {
      id: realId,
      text: it.text || it.question || it.title || '',
      options: Array.isArray(it.options) ? it.options : (it.options_list || it.choices || []),
      answerIndex: typeof it.answerIndex === 'number' ? it.answerIndex : (typeof it.answer === 'number' ? it.answer : 0),
      explanation: it.explanation,
    } as Question;
  } catch (err) {
    // final fallback
    const all = await loadQuestionsFromDB();
    return all.find((q) => q.id === id);
  }
}

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

  const allQuestions = await loadQuestionsFromDB();

  if (typeof index === 'number' && !isNaN(index)) {
    const q = allQuestions[index % allQuestions.length];
    if (!q) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Not found' }) };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stripAnswer(q)) };
  }

  let pool = [...allQuestions];
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
    const q = await getQuestionById(qid);
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
    const all = await loadQuestionsFromDB();
    const pool = shuffle(all).slice(0, Math.min(count, all.length));
    const ids = pool.map((q) => q.id);
    const optionOrders = pool.map((q) => shuffle(q.options.map((_, i) => i)));
    const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const sess: Session = { id: sessionId, ids, optionOrders, answers: new Array(ids.length).fill(-1) };
    sessionStore.set(sessionId, sess);

    // return first question with shuffled options
    const first = await getQuestionById(ids[0]);
    if (!first) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to load first question' }) };
    }
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
    const q = await getQuestionById(qid);
    if (!q) return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to load question' }) };
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

// Seed endpoint: writes the in-file `questions` array into DynamoDB when called.
// Protection: Either set ALLOW_DB_SEED=true in the environment (convenient but unsafe),
// or set SEED_SECRET and provide it in the request body as { secret: '...' }.
export const seedQuestions = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Basic protection
    const allow = process.env.ALLOW_DB_SEED === 'true';
    const expected = process.env.SEED_SECRET;
    let ok = allow;
    const body = event.body ? JSON.parse(event.body) : {};
    if (!ok && expected) {
      ok = body && body.secret === expected;
    }
    if (!ok) {
      return { statusCode: 403, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Seeding not allowed. Set ALLOW_DB_SEED=true or provide SEED_SECRET.' }) };
    }

    if (!ddbDocClient || !ddbTable) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'DynamoDB not configured. Set QUESTIONS_TABLE env var.' }) };
    }

    // Prepare write batches (25 items per BatchWrite)
    const items = questions.map((q) => ({ ...q }));
    const batches: any[] = [];
    for (let i = 0; i < items.length; i += 25) batches.push(items.slice(i, i + 25));

    for (const batch of batches) {
      const putRequests: Array<{ PutRequest: { Item: Question } }> = batch.map((item: Question) => ({ PutRequest: { Item: item } }));
      let params = { RequestItems: { [ddbTable]: putRequests } };
      let resp = await ddbDocClient.send(new BatchWriteCommand(params));
      let tries = 0;
      while (resp && resp.UnprocessedItems && Object.keys(resp.UnprocessedItems).length > 0 && tries < 5) {
        await new Promise((r) => setTimeout(r, 500 * (tries + 1)));
        resp = await ddbDocClient.send(new BatchWriteCommand({ RequestItems: resp.UnprocessedItems }));
        tries++;
      }
      if (resp && resp.UnprocessedItems && Object.keys(resp.UnprocessedItems).length > 0) {
        return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Some items were not processed', details: resp.UnprocessedItems }) };
      }
    }

    // Invalidate cache so future reads come from DB
    dbQuestionsCache = null;

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, written: items.length }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

register('POST', '/api/questions/seed', seedQuestions);
