import { useEffect, useState } from "react";

import {
  buildQuestionById,
  createPracticeSession,
  getValidQuestions,
  SESSION_MODES,
} from "./sessionSelection.js";
import {
  clearPerformance,
  formatQuestionPerformance,
  hasMistakeReviewQuestions,
  loadPerformance,
  rankMistakeReviewQuestions,
  recordConfirmedAnswer,
  savePerformance,
} from "./questionPerformance.js";
import {
  buildPostSessionReview,
  buildResultSummary,
  captureMissedAnswer,
} from "./resultViewModels.js";

const DATA_URL = `${import.meta.env.BASE_URL}detran_rj_exams.json`;

const SCREEN = {
  LOADING: "loading",
  MODE: "mode",
  QUESTION: "question",
  RESULT: "result",
  REVIEW: "review",
  ERROR: "error",
};

const cardClass = "rounded-lg border border-zinc-300 bg-white p-6 shadow-sm";
const actionsClass = "mt-5 flex flex-wrap gap-2.5";
const buttonBaseClass =
  "rounded-md px-4 py-2.5 font-sans text-white disabled:cursor-not-allowed disabled:bg-zinc-400";
const primaryButtonClass = `${buttonBaseClass} bg-blue-700`;
const secondaryButtonClass = `${buttonBaseClass} bg-zinc-600`;
const linkButtonClass =
  "mt-3 bg-transparent p-0 font-sans text-blue-700 underline";

export default function App() {
  const [screen, setScreen] = useState(SCREEN.LOADING);
  const [error, setError] = useState("");
  const [progressOverride, setProgressOverride] = useState("");
  const [data, setData] = useState(null);
  const [questionById, setQuestionById] = useState(() => new Map());
  const [performance, setPerformance] = useState(() => loadPerformance());
  const [activeSession, setActiveSession] = useState(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
          throw new Error(`Não foi possível carregar ${DATA_URL}`);
        }

        const loadedData = await response.json();
        const questions = getValidQuestions(loadedData);
        const loadedQuestionById = buildQuestionById(questions);

        if (questions.length === 0) {
          throw new Error("O arquivo JSON não contém questões válidas.");
        }

        setData(loadedData);
        setQuestionById(loadedQuestionById);
        setScreen(SCREEN.MODE);
      } catch (loadError) {
        setError(loadError.message);
        setScreen(SCREEN.ERROR);
      }
    }

    loadQuestions();
  }, []);

  const currentQuestion =
    activeSession?.questions[activeSession.currentIndex] || null;
  const progressText = getProgressText(screen, activeSession, progressOverride);
  const availableQuestionIds = [...questionById.keys()];
  const hasMistakes = hasMistakeReviewQuestions(
    performance,
    availableQuestionIds,
  );
  const resultSummary = activeSession
    ? buildResultSummary(activeSession)
    : null;
  const postSessionReview = activeSession
    ? buildPostSessionReview(activeSession.missedAnswers)
    : null;

  function startSession(mode) {
    const selection = createPracticeSession(data, mode, {
      performance,
      rankMistakeReviewQuestions,
    });
    if (!selection.ok) {
      setProgressOverride("Modo indisponível.");
      setError(selection.message);
      return;
    }

    setError("");
    setProgressOverride("");
    setActiveSession({
      mode: selection.mode,
      title: selection.title,
      source: selection.source,
      questions: selection.questionIds.map((id) => questionById.get(id)),
      currentIndex: 0,
      score: 0,
      missedAnswers: [],
    });
    setSelectedAnswerId(null);
    setAnswered(false);
    setScreen(SCREEN.QUESTION);
  }

  function selectAnswer(answerId) {
    if (answered) {
      return;
    }

    setSelectedAnswerId(answerId);
  }

  function confirmAnswer() {
    if (!activeSession || !currentQuestion || !selectedAnswerId || answered) {
      return;
    }

    const selected = currentQuestion.alternatives.find(
      (answer) => answer.id === selectedAnswerId,
    );
    const isCorrect = Boolean(selected && selected.is_correct);
    const nextPerformance = recordConfirmedAnswer(
      performance,
      currentQuestion.id,
      isCorrect,
    );

    setActiveSession({
      ...activeSession,
      score: activeSession.score + (isCorrect ? 1 : 0),
      missedAnswers: isCorrect
        ? activeSession.missedAnswers
        : [
            ...activeSession.missedAnswers,
            captureMissedAnswer(currentQuestion, selectedAnswerId),
          ],
    });
    setPerformance(nextPerformance);
    savePerformance(nextPerformance);
    setAnswered(true);
  }

  function nextQuestion() {
    if (!activeSession) {
      return;
    }

    if (activeSession.currentIndex + 1 >= activeSession.questions.length) {
      setScreen(SCREEN.RESULT);
      return;
    }

    setActiveSession({
      ...activeSession,
      currentIndex: activeSession.currentIndex + 1,
    });
    setSelectedAnswerId(null);
    setAnswered(false);
  }

  function returnToModeSelection() {
    const hasSessionProgress =
      answered ||
      selectedAnswerId ||
      (activeSession &&
        (activeSession.currentIndex > 0 ||
          activeSession.score > 0 ||
          activeSession.missedAnswers.length > 0));

    if (
      hasSessionProgress &&
      !window.confirm(
        "Deseja sair desta sessão de prática? O progresso desta sessão será perdido.",
      )
    ) {
      return;
    }

    setActiveSession(null);
    setSelectedAnswerId(null);
    setAnswered(false);
    setError("");
    setProgressOverride("");
    setScreen(SCREEN.MODE);
  }

  function resetProgress() {
    if (
      !window.confirm("Tem certeza que deseja resetar todo o desempenho salvo?")
    ) {
      return;
    }

    clearPerformance();
    setPerformance(loadPerformance());
    setError("");
    setProgressOverride("");
    setScreen(SCREEN.MODE);
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans">
      <main className="mx-auto py-8 w-full max-w-3xl px-4">
        <header className="mb-5">
          <h1 className="mb-1.5 text-3xl font-bold">Simulado Detran RJ</h1>
          <p className="text-zinc-600">{progressText}</p>
        </header>

        {screen === SCREEN.MODE ? (
          <ModeCard
            hasMistakes={hasMistakes}
            onStartSession={startSession}
            onResetProgress={resetProgress}
          />
        ) : null}

        {screen === SCREEN.QUESTION && currentQuestion ? (
          <QuestionCard
            activeSession={activeSession}
            answered={answered}
            currentQuestion={currentQuestion}
            performance={performance}
            selectedAnswerId={selectedAnswerId}
            onConfirmAnswer={confirmAnswer}
            onReturnToModeSelection={returnToModeSelection}
            onNextQuestion={nextQuestion}
            onSelectAnswer={selectAnswer}
          />
        ) : null}

        {screen === SCREEN.RESULT && resultSummary ? (
          <ResultCard
            summary={resultSummary}
            onRestart={() => startSession(SESSION_MODES.OFFICIAL_30)}
            onShowPostSessionReview={() => setScreen(SCREEN.REVIEW)}
          />
        ) : null}

        {screen === SCREEN.REVIEW && postSessionReview ? (
          <ReviewCard
            review={postSessionReview}
            onBackToResults={() => setScreen(SCREEN.RESULT)}
            onNewSession={() => startSession(SESSION_MODES.OFFICIAL_30)}
          />
        ) : null}

        {error ? (
          <p className="mt-4 rounded-md border border-red-700 bg-red-100 p-3 text-red-900">
            {error}
          </p>
        ) : null}
      </main>
    </div>
  );
}

function ModeCard({ hasMistakes, onStartSession, onResetProgress }) {
  return (
    <section className={cardClass}>
      <h2 className="mb-4 text-2xl font-bold">Escolha uma sessão de prática</h2>
      <div className="flex flex-wrap gap-2.5">
        <button
          className={primaryButtonClass}
          type="button"
          onClick={() => onStartSession(SESSION_MODES.OFFICIAL_30)}
        >
          Simulado de 30 questões
        </button>
        <button
          className={secondaryButtonClass}
          type="button"
          onClick={() => onStartSession(SESSION_MODES.ALL_QUESTIONS)}
        >
          Todas as questões
        </button>
        <button
          className={secondaryButtonClass}
          type="button"
          disabled={!hasMistakes}
          onClick={() => onStartSession(SESSION_MODES.MISTAKE_REVIEW)}
        >
          Revisão de erros
        </button>
      </div>
      <p className="mt-4 text-zinc-600">
        {hasMistakes
          ? "Revise questões que você já errou, priorizando seu menor desempenho."
          : "A Revisão de erros fica disponível depois que você errar uma questão confirmada."}
      </p>
      <button
        className={linkButtonClass}
        type="button"
        onClick={onResetProgress}
      >
        Resetar progresso
      </button>
    </section>
  );
}

function QuestionCard({
  activeSession,
  answered,
  currentQuestion,
  performance,
  selectedAnswerId,
  onConfirmAnswer,
  onReturnToModeSelection,
  onNextQuestion,
  onSelectAnswer,
}) {
  const imageSrc = currentQuestion.image_path || currentQuestion.image_url;
  const showPerformance =
    answered && activeSession.mode === SESSION_MODES.MISTAKE_REVIEW;
  const isLastQuestion =
    activeSession.currentIndex + 1 === activeSession.questions.length;

  return (
    <section className={cardClass}>
      <button
        className="mb-5 bg-transparent p-0 font-sans text-blue-700 underline"
        type="button"
        onClick={onReturnToModeSelection}
      >
        Voltar para escolha de sessão
      </button>

      {imageSrc ? (
        <div className="mb-5 text-center">
          <img
            className="inline-block max-h-56 max-w-56"
            src={imageSrc}
            alt="Imagem da questão"
          />
        </div>
      ) : null}

      <h2 className="mb-5 text-2xl font-bold leading-snug">
        {currentQuestion.question}
      </h2>
      <div className="grid gap-2.5">
        {currentQuestion.alternatives.map((answer) => (
          <button
            className={getAnswerClass(answer, answered, selectedAnswerId)}
            key={answer.id}
            type="button"
            disabled={answered}
            onClick={() => onSelectAnswer(answer.id)}
          >
            {answer.text}
          </button>
        ))}
      </div>

      {showPerformance ? (
        <p className="mt-4 font-bold text-zinc-600">
          {formatQuestionPerformance(performance, currentQuestion.id)}
        </p>
      ) : null}

      <div className={actionsClass}>
        {!answered ? (
          <button
            className={primaryButtonClass}
            type="button"
            disabled={!selectedAnswerId}
            onClick={onConfirmAnswer}
          >
            Confirmar
          </button>
        ) : (
          <button
            className={primaryButtonClass}
            type="button"
            onClick={onNextQuestion}
          >
            {isLastQuestion ? "Ver resultado" : "Próxima"}
          </button>
        )}
      </div>
    </section>
  );
}

function ResultCard({ summary, onRestart, onShowPostSessionReview }) {
  return (
    <section className={cardClass}>
      <h2 className="mb-4 text-2xl font-bold">
        Resultado da sessão de prática
      </h2>
      <p>
        Você acertou {summary.score} de {summary.totalQuestions} questões.
      </p>
      <p>Aproveitamento: {summary.percentage}%.</p>
      <p>Questões erradas: {summary.missedCount}.</p>
      <div className={actionsClass}>
        <button
          className={primaryButtonClass}
          type="button"
          onClick={onRestart}
        >
          Iniciar novo Simulado de 30 questões
        </button>
        {summary.canOpenPostSessionReview ? (
          <button
            className={secondaryButtonClass}
            type="button"
            onClick={onShowPostSessionReview}
          >
            Revisar erros desta sessão
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ReviewCard({ review, onBackToResults, onNewSession }) {
  return (
    <section className={cardClass}>
      <h2 className="mb-4 text-2xl font-bold">Revisão pós-sessão</h2>
      <div className="grid gap-4">
        {review.items.map((item, index) => (
          <article
            className="border-t border-zinc-300 pt-4"
            key={item.questionId}
          >
            <h3 className="mb-3 text-lg font-bold">
              Erro {index + 1}: {item.questionText}
            </h3>
            {item.image.path || item.image.url ? (
              <img
                className="mb-3 block max-h-44 max-w-44"
                src={item.image.path || item.image.url}
                alt="Imagem da questão"
              />
            ) : null}
            <ul className="list-disc space-y-1 pl-6">
              {item.alternatives.map((answer) => (
                <li
                  className={getReviewAnswerClass(answer, item)}
                  key={answer.id}
                >
                  {getReviewAnswerText(answer, item)}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className={actionsClass}>
        <button
          className={secondaryButtonClass}
          type="button"
          onClick={onBackToResults}
        >
          Voltar ao resultado
        </button>
        <button
          className={primaryButtonClass}
          type="button"
          onClick={onNewSession}
        >
          Iniciar novo Simulado de 30 questões
        </button>
      </div>
    </section>
  );
}

function getProgressText(screen, activeSession, progressOverride) {
  if (progressOverride) {
    return progressOverride;
  }

  if (screen === SCREEN.MODE) {
    return "Escolha como deseja praticar.";
  }

  if (screen === SCREEN.QUESTION && activeSession) {
    return `${activeSession.title}: questão ${activeSession.currentIndex + 1} de ${activeSession.questions.length}`;
  }

  if (screen === SCREEN.RESULT) {
    return "Sessão de prática finalizada.";
  }

  if (screen === SCREEN.REVIEW) {
    return "Revise apenas os erros da sessão recém-finalizada.";
  }

  if (screen === SCREEN.ERROR) {
    return "Erro ao carregar.";
  }

  return "Carregando...";
}

function getAnswerClass(answer, answered, selectedAnswerId) {
  const baseClass =
    "w-full rounded-md border px-3.5 py-3 text-left font-sans text-zinc-900 disabled:cursor-default";

  if (answered && answer.is_correct) {
    return `${baseClass} border-green-700 bg-green-100`;
  }

  if (answered && answer.id === selectedAnswerId) {
    return `${baseClass} border-red-700 bg-red-100`;
  }

  if (answer.id === selectedAnswerId) {
    return `${baseClass} border-blue-700 bg-blue-50`;
  }

  return `${baseClass} border-zinc-400 bg-white hover:border-blue-700 hover:bg-blue-50`;
}

function getReviewAnswerClass(answer, item) {
  if (answer.id === item.correctAnswer.id) {
    return "font-bold text-green-700";
  }

  if (answer.id === item.selectedAnswer.id) {
    return "font-bold text-red-700";
  }

  return "";
}

function getReviewAnswerText(answer, item) {
  if (answer.id === item.correctAnswer.id) {
    return `${answer.text} (resposta correta)`;
  }

  if (answer.id === item.selectedAnswer.id) {
    return `${answer.text} (sua resposta)`;
  }

  return answer.text;
}
