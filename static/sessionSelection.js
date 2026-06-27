export const SESSION_MODES = {
  OFFICIAL_30: "official-30",
  ALL_QUESTIONS: "all-questions",
  MISTAKE_REVIEW: "mistake-review",
};

export function isValidQuestion(question) {
  return Boolean(
    question &&
      question.id &&
      question.question &&
      Array.isArray(question.alternatives) &&
      question.alternatives.some((answer) => answer && answer.is_correct),
  );
}

export function getValidQuestions(data) {
  return (data.questions || []).filter(isValidQuestion);
}

export function buildQuestionById(questions) {
  return new Map(questions.map((question) => [question.id, question]));
}

export function getCompleteOfficialExamVersions(data, expectedCount = 30) {
  const questionById = buildQuestionById(getValidQuestions(data));

  return Object.values(data.exam_versions || {})
    .filter((exam) => {
      if (!Array.isArray(exam.question_ids) || exam.question_ids.length !== expectedCount) {
        return false;
      }

      const uniqueIds = new Set(exam.question_ids);
      return uniqueIds.size === expectedCount && exam.question_ids.every((id) => questionById.has(id));
    })
    .sort((left, right) => Number(left.numero_prova) - Number(right.numero_prova));
}

export function createOfficial30Session(data, { rng = Math.random } = {}) {
  const versions = getCompleteOfficialExamVersions(data);
  if (versions.length === 0) {
    return unavailable(SESSION_MODES.OFFICIAL_30, "Nenhum simulado oficial de 30 questões está disponível no momento.");
  }

  const index = Math.min(Math.floor(rng() * versions.length), versions.length - 1);
  const version = versions[index];
  return {
    ok: true,
    mode: SESSION_MODES.OFFICIAL_30,
    title: "Simulado de 30 questões",
    source: { type: "official_exam_version", numero_prova: version.numero_prova },
    questionIds: [...version.question_ids],
  };
}

export function createAllQuestionsSession(data) {
  const questionIds = getValidQuestions(data).map((question) => question.id);
  if (questionIds.length === 0) {
    return unavailable(SESSION_MODES.ALL_QUESTIONS, "Nenhuma questão está disponível no momento.");
  }

  return {
    ok: true,
    mode: SESSION_MODES.ALL_QUESTIONS,
    title: "Todas as questões",
    source: { type: "question_bank" },
    questionIds,
  };
}

export function createMistakeReviewSession(data, performance, rankMistakeReviewQuestions) {
  const availableQuestionIds = getValidQuestions(data).map((question) => question.id);
  const questionIds = rankMistakeReviewQuestions(performance, availableQuestionIds);

  if (questionIds.length === 0) {
    return unavailable(
      SESSION_MODES.MISTAKE_REVIEW,
      "A Revisão de erros fica disponível depois que você errar uma questão confirmada.",
    );
  }

  return {
    ok: true,
    mode: SESSION_MODES.MISTAKE_REVIEW,
    title: "Revisão de erros",
    source: { type: "question_performance" },
    questionIds,
  };
}

export function createPracticeSession(data, mode, options = {}) {
  if (mode === SESSION_MODES.OFFICIAL_30) {
    return createOfficial30Session(data, options);
  }

  if (mode === SESSION_MODES.ALL_QUESTIONS) {
    return createAllQuestionsSession(data);
  }

  if (mode === SESSION_MODES.MISTAKE_REVIEW) {
    return createMistakeReviewSession(data, options.performance, options.rankMistakeReviewQuestions);
  }

  return unavailable(mode, "Modo de prática indisponível.");
}

function unavailable(mode, message) {
  return { ok: false, mode, reason: "UNAVAILABLE", message };
}
