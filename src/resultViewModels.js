export function buildResultSummary(session) {
  const totalQuestions = session.questions.length;
  const percentage = totalQuestions === 0 ? 0 : Math.round((session.score / totalQuestions) * 100);

  return {
    score: session.score,
    totalQuestions,
    percentage,
    missedCount: session.missedAnswers.length,
    canOpenPostSessionReview: session.missedAnswers.length > 0,
  };
}

export function captureMissedAnswer(question, selectedAnswerId) {
  const selectedAnswer = question.alternatives.find((answer) => answer.id === selectedAnswerId);
  const correctAnswer = question.alternatives.find((answer) => answer.is_correct);

  return {
    questionId: question.id,
    questionText: question.question,
    image: {
      code: question.image_code || null,
      path: question.image_path || null,
      url: question.image_url || null,
    },
    alternatives: question.alternatives.map((answer) => ({
      id: answer.id,
      text: answer.text,
      isCorrect: Boolean(answer.is_correct),
    })),
    selectedAnswer: {
      id: selectedAnswer.id,
      text: selectedAnswer.text,
    },
    correctAnswer: {
      id: correctAnswer.id,
      text: correctAnswer.text,
    },
  };
}

export function buildPostSessionReview(missedAnswers) {
  return {
    isReadOnly: true,
    items: missedAnswers.map((answer) => ({ ...answer })),
  };
}
