export const QUESTION_PERFORMANCE_KEY = "detranRJ.questionPerformance.v1";

export function createEmptyPerformance() {
  return { version: 1, questions: {} };
}

export function normalizePerformance(raw) {
  if (!raw || typeof raw !== "object" || !raw.questions || typeof raw.questions !== "object") {
    return createEmptyPerformance();
  }

  const normalized = createEmptyPerformance();
  Object.entries(raw.questions).forEach(([questionId, stats]) => {
    if (!questionId || !stats || typeof stats !== "object") {
      return;
    }

    const correct = Math.max(0, Number(stats.correct) || 0);
    const wrong = Math.max(0, Number(stats.wrong) || 0);
    if (correct === 0 && wrong === 0) {
      return;
    }

    normalized.questions[questionId] = {
      correct,
      wrong,
      lastAnsweredAt: stats.lastAnsweredAt || new Date(0).toISOString(),
    };
  });

  return normalized;
}

export function loadPerformance(storage = localStorage) {
  try {
    const raw = storage.getItem(QUESTION_PERFORMANCE_KEY);
    return normalizePerformance(raw ? JSON.parse(raw) : null);
  } catch (_error) {
    return createEmptyPerformance();
  }
}

export function savePerformance(performance, storage = localStorage) {
  try {
    storage.setItem(QUESTION_PERFORMANCE_KEY, JSON.stringify(normalizePerformance(performance)));
  } catch (_error) {
    // Keep the in-memory session usable even if localStorage is unavailable.
  }
}

export function clearPerformance(storage = localStorage) {
  try {
    storage.removeItem(QUESTION_PERFORMANCE_KEY);
  } catch (_error) {
    // Nothing else to clear when storage is unavailable.
  }
}

export function recordConfirmedAnswer(performance, questionId, isCorrect, answeredAt = new Date().toISOString()) {
  const next = normalizePerformance(performance);
  const current = next.questions[questionId] || { correct: 0, wrong: 0, lastAnsweredAt: answeredAt };

  next.questions[questionId] = {
    correct: current.correct + (isCorrect ? 1 : 0),
    wrong: current.wrong + (isCorrect ? 0 : 1),
    lastAnsweredAt: answeredAt,
  };

  return next;
}

export function getQuestionStats(performance, questionId) {
  return normalizePerformance(performance).questions[questionId] || { correct: 0, wrong: 0, lastAnsweredAt: null };
}

export function getQuestionAccuracy(performance, questionId) {
  const stats = getQuestionStats(performance, questionId);
  const total = stats.correct + stats.wrong;
  return total === 0 ? null : stats.correct / total;
}

export function formatQuestionPerformance(performance, questionId) {
  const stats = getQuestionStats(performance, questionId);
  const total = stats.correct + stats.wrong;
  const percentage = total === 0 ? 0 : Math.round((stats.correct / total) * 100);
  return `Desempenho nesta questão: ${percentage}% (${stats.correct} de ${total} respostas corretas).`;
}

export function hasMistakeReviewQuestions(performance, availableQuestionIds) {
  return rankMistakeReviewQuestions(performance, availableQuestionIds).length > 0;
}

export function rankMistakeReviewQuestions(performance, availableQuestionIds, limit = 30) {
  const normalized = normalizePerformance(performance);
  const available = new Set(availableQuestionIds);

  return Object.entries(normalized.questions)
    .filter(([questionId, stats]) => available.has(questionId) && stats.wrong > 0)
    .sort(([leftId, left], [rightId, right]) => {
      const leftAccuracy = left.correct / (left.correct + left.wrong);
      const rightAccuracy = right.correct / (right.correct + right.wrong);
      return (
        leftAccuracy - rightAccuracy ||
        right.wrong - left.wrong ||
        Date.parse(left.lastAnsweredAt) - Date.parse(right.lastAnsweredAt) ||
        leftId.localeCompare(rightId)
      );
    })
    .slice(0, limit)
    .map(([questionId]) => questionId);
}
