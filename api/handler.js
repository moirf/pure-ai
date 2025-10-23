exports.handler = async (event) => {
  const questions = [
    { id: 1, text: "What is the capital of France?", options: ["Paris", "London", "Berlin"], answer: "Paris" },
    { id: 2, text: "What is 2 + 2?", options: ["3", "4", "5"], answer: "4" },
  ];

  // Parse the index from the event query string or default to 0
  const index = event.queryStringParameters?.index ? parseInt(event.queryStringParameters.index, 10) : 0;

  // Validate the index
  if (index < 0 || index >= questions.length) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Invalid question index" }),
    };
  }

  // Return the question at the specified index
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(questions[index]),
  };
};
