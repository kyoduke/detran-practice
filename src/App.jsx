import { useEffect, useRef, useState } from "react";
import { ClipboardList, BookOpen, Info, House, CircleHelp } from "lucide-react";

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
import {
  loadShortcutsDismissed,
  saveShortcutsDismissed,
} from "./shortcutsPreference.js";

import Logo from "./components/Logo.jsx";
import AppBar from "./components/AppBar.jsx";
import ConsoleBar from "./components/ConsoleBar.jsx";
import Button from "./components/Button.jsx";
import AnswerOption from "./components/AnswerOption.jsx";
import Badge from "./components/Badge.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import ScoreRing from "./components/ScoreRing.jsx";
import ActionDock from "./components/ActionDock.jsx";
import ModeRow from "./components/ModeRow.jsx";
import PerformancePanel from "./components/PerformancePanel.jsx";
import FeaturesBar from "./components/FeaturesBar.jsx";
import ShortcutsPopup from "./components/ShortcutsPopup.jsx";

const DATA_URL = `${import.meta.env.BASE_URL}detran_rj_exams.json`;

const SCREEN = {
  LOADING: "loading",
  MODE: "mode",
  QUESTION: "question",
  RESULT: "result",
  REVIEW: "review",
  ERROR: "error",
};

const MODE_LABELS = {
  [SESSION_MODES.OFFICIAL_30]: "SIMULADO DE 30 QUESTÕES",
  [SESSION_MODES.ALL_QUESTIONS]: "TODAS AS QUESTÕES",
  [SESSION_MODES.MISTAKE_REVIEW]: "REVISÃO DE ERROS",
};

function hasAnswered(result) {
  return Boolean(
    result && result.isCorrect !== null && result.isCorrect !== undefined,
  );
}

export default function App() {
  const [screen, setScreen] = useState(SCREEN.LOADING);
  const [error, setError] = useState("");
  const [progressOverride, setProgressOverride] = useState("");
  const [data, setData] = useState(null);
  const [questionById, setQuestionById] = useState(() => new Map());
  const [performance, setPerformance] = useState(() => loadPerformance());
  const [activeSession, setActiveSession] = useState(null);
  const [shortcutsDismissedForever, setShortcutsDismissedForever] = useState(
    () => loadShortcutsDismissed(),
  );
  const [showShortcutsPopup, setShowShortcutsPopup] = useState(false);

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
  const currentResult =
    activeSession?.questionResults?.[activeSession.currentIndex] ?? null;
  const answered = hasAnswered(currentResult);
  const selectedAnswerId = currentResult?.selectedAnswerId ?? null;
  const availableQuestionIds = [...questionById.keys()];
  const hasMistakes = hasMistakeReviewQuestions(
    performance,
    availableQuestionIds,
  );
  const totalPracticed = Object.values(performance.questions || {}).filter(
    (s) => s.correct + s.wrong > 0,
  ).length;
  const resultSummary = activeSession
    ? buildResultSummary(activeSession)
    : null;
  const postSessionReview = activeSession
    ? buildPostSessionReview(activeSession.missedAnswers)
    : null;

  function getPerformanceStats() {
    const entries = Object.values(performance.questions || {});
    const totalCorrect = entries.reduce((sum, s) => sum + s.correct, 0);
    const totalWrong = entries.reduce((sum, s) => sum + s.wrong, 0);
    const total = totalCorrect + totalWrong;
    const percentage = total === 0 ? 0 : Math.round((totalCorrect / total) * 100);
    return { percentage, hits: totalCorrect, misses: totalWrong };
  }

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
      questionResults: [],
    });
    setShowShortcutsPopup(!shortcutsDismissedForever);
    setScreen(SCREEN.QUESTION);
  }

  function setQuestionResult(session, index, result) {
    const questionResults = [...session.questionResults];
    questionResults[index] = result;
    return { ...session, questionResults };
  }

  function selectAnswer(answerId) {
    if (!activeSession) return;
    const current = activeSession.questionResults?.[activeSession.currentIndex];
    if (hasAnswered(current)) return;

    setActiveSession(
      setQuestionResult(activeSession, activeSession.currentIndex, {
        selectedAnswerId: answerId,
        isCorrect: null,
      }),
    );
  }

  function confirmAnswer() {
    if (!activeSession || !currentQuestion) return;
    const current = activeSession.questionResults?.[activeSession.currentIndex];
    if (!current?.selectedAnswerId || hasAnswered(current)) return;

    const selected = currentQuestion.alternatives.find(
      (answer) => answer.id === current.selectedAnswerId,
    );
    const isCorrect = Boolean(selected && selected.is_correct);
    const nextPerformance = recordConfirmedAnswer(
      performance,
      currentQuestion.id,
      isCorrect,
    );

    setActiveSession({
      ...setQuestionResult(activeSession, activeSession.currentIndex, {
        selectedAnswerId: current.selectedAnswerId,
        isCorrect,
      }),
      score: activeSession.score + (isCorrect ? 1 : 0),
      missedAnswers: isCorrect
        ? activeSession.missedAnswers
        : [
            ...activeSession.missedAnswers,
            captureMissedAnswer(currentQuestion, current.selectedAnswerId),
          ],
    });
    setPerformance(nextPerformance);
    savePerformance(nextPerformance);
  }

  function nextQuestion() {
    if (!activeSession) return;

    if (activeSession.currentIndex + 1 >= activeSession.questions.length) {
      setScreen(SCREEN.RESULT);
      return;
    }

    setActiveSession({
      ...activeSession,
      currentIndex: activeSession.currentIndex + 1,
    });
  }

  function previousQuestion() {
    if (!activeSession) return;
    if (activeSession.currentIndex <= 0) return;

    setActiveSession({
      ...activeSession,
      currentIndex: activeSession.currentIndex - 1,
    });
  }

  function dismissShortcutsForSession() {
    setShowShortcutsPopup(false);
  }

  function dismissShortcutsForever() {
    saveShortcutsDismissed();
    setShortcutsDismissedForever(true);
    setShowShortcutsPopup(false);
  }

  function reopenShortcuts() {
    setShowShortcutsPopup(true);
  }

  const keyStateRef = useRef(null);
  keyStateRef.current = {
    screen,
    showShortcutsPopup,
    activeSession,
    currentQuestion,
    selectAnswer,
    confirmAnswer,
    nextQuestion,
    previousQuestion,
    returnToModeSelection,
  };

  useEffect(() => {
    function handleKeyDown(event) {
      if (
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const {
        screen: currentScreen,
        showShortcutsPopup: popupOpen,
        activeSession: session,
        currentQuestion: question,
      } = keyStateRef.current;

      if (currentScreen !== SCREEN.QUESTION || popupOpen) return;

      const current = session?.questionResults?.[session.currentIndex];
      const isAnswered = hasAnswered(current);
      const keyNumber = Number(event.key);

      if (
        Number.isInteger(keyNumber) &&
        keyNumber >= 1 &&
        keyNumber <= (question?.alternatives.length || 0)
      ) {
        event.preventDefault();
        if (!isAnswered && question) {
          const alternative = question.alternatives[keyNumber - 1];
          if (alternative) {
            keyStateRef.current.selectAnswer(alternative.id);
          }
        }
        return;
      }

      if (
        event.key === "ArrowRight" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        if (!isAnswered && current?.selectedAnswerId) {
          keyStateRef.current.confirmAnswer();
        } else if (isAnswered) {
          keyStateRef.current.nextQuestion();
        }
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        keyStateRef.current.previousQuestion();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        keyStateRef.current.returnToModeSelection();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function returnToModeSelection() {
    const hasSessionProgress =
      activeSession?.questionResults?.some((result) => result != null) ?? false;

    if (
      hasSessionProgress &&
      !window.confirm(
        "Deseja sair desta sessão de prática? O progresso desta sessão será perdido.",
      )
    ) {
      return;
    }

    setActiveSession(null);
    setError("");
    setProgressOverride("");
    setScreen(SCREEN.MODE);
  }

  function goToHome() {
    setActiveSession(null);
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

  const perfStats = getPerformanceStats();

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text-primary">
      {screen === SCREEN.MODE && (
        <>
          <AppBar>
            <Logo />
          </AppBar>
          <ModeCard
            hasMistakes={hasMistakes}
            perfStats={perfStats}
            totalPracticed={totalPracticed}
            onStartSession={startSession}
            onResetProgress={resetProgress}
          />
        </>
      )}

      {(screen === SCREEN.QUESTION || screen === SCREEN.REVIEW) && (
        <ConsoleBar
          modeLabel={
            screen === SCREEN.REVIEW
              ? "REVISÃO PÓS-SESSÃO"
              : MODE_LABELS[activeSession?.mode] || "SESSÃO"
          }
          counter={
            screen === SCREEN.REVIEW
              ? `${activeSession?.missedAnswers.length || 0} questões para revisar`
              : `Questão ${activeSession.currentIndex + 1} de ${activeSession.questions.length}`
          }
          progress={activeSession ? ((activeSession.currentIndex + 1) / activeSession.questions.length) * 170 : 0}
          progressWidth={
            activeSession ? ((activeSession.currentIndex + 1) / activeSession.questions.length) * 170 : 0
          }
        />
      )}

      {screen === SCREEN.RESULT && (
        <AppBar>
          <Logo />
          <Badge color="primary" label="FINALIZADO" />
        </AppBar>
      )}

      <main className="mx-auto w-full flex-1 max-w-3xl px-4 py-8 sm:py-12">
        {screen === SCREEN.MODE ? null : null}

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
            onPreviousQuestion={previousQuestion}
            onGoToResult={() => setScreen(SCREEN.RESULT)}
            onSelectAnswer={selectAnswer}
            onReopenShortcuts={reopenShortcuts}
          />
        ) : null}

        {screen === SCREEN.RESULT && resultSummary ? (
          <ResultCard
            summary={resultSummary}
            onRestart={() => startSession(SESSION_MODES.OFFICIAL_30)}
            onShowPostSessionReview={() => setScreen(SCREEN.REVIEW)}
            onBackToHome={goToHome}
          />
        ) : null}

        {screen === SCREEN.REVIEW && postSessionReview ? (
          <ReviewCard
            review={postSessionReview}
            onBackToResults={() => setScreen(SCREEN.RESULT)}
            onNewSession={() => startSession(SESSION_MODES.OFFICIAL_30)}
          />
        ) : null}

        {screen === SCREEN.QUESTION && showShortcutsPopup && (
        <ShortcutsPopup
          onDismissForSession={dismissShortcutsForSession}
          onDismissForever={dismissShortcutsForever}
        />
      )}

      {error ? (
          <p className="mt-4 rounded-xl border border-error/20 bg-error-soft p-4 font-medium text-error">
            {error}
          </p>
        ) : null}
      </main>

      {screen === SCREEN.MODE && <FeaturesBar />}
    </div>
  );
}

function ModeCard({ hasMistakes, perfStats, totalPracticed, onStartSession, onResetProgress }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl gap-5 px-4 py-8 sm:py-12">
      <PerformancePanel
        percentage={perfStats.percentage}
        hits={perfStats.hits}
        misses={perfStats.misses}
        totalPracticed={totalPracticed}
        onReset={onResetProgress}
      />

      <div className="flex flex-1 flex-col gap-3.5 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <span className="font-display text-xs font-bold uppercase tracking-[1.5px] text-text-muted">
          COMO QUER PRATICAR?
        </span>
        <h2 className="font-display text-[22px] font-bold text-text-primary">
          Escolha seu treino
        </h2>

        <div className="flex flex-col">
          <ModeRow
            icon={ClipboardList}
            title="Simulado de 30 questões"
            subtitle="Prova oficial cronometrada"
            active
            onClick={() => onStartSession(SESSION_MODES.OFFICIAL_30)}
          />
          <ModeRow
            icon={BookOpen}
            title="Todas as questões"
            subtitle="Banco completo, sem pressa"
            onClick={() => onStartSession(SESSION_MODES.ALL_QUESTIONS)}
          />
          <ModeRow
            icon={Info}
            title="Revisão de erros"
            subtitle="Disponível após seu primeiro erro"
            disabled={!hasMistakes}
            onClick={() => onStartSession(SESSION_MODES.MISTAKE_REVIEW)}
          />
        </div>

        <div className="rounded-[var(--radius-sm)] bg-surface-muted p-3">
          <p className="font-body text-xs leading-relaxed text-text-secondary">
            {hasMistakes
              ? "Revise questões que você já errou, priorizando seu menor desempenho."
              : "A Revisão de erros fica disponível depois que você errar uma questão confirmada."}
          </p>
        </div>
      </div>
    </div>
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
  onPreviousQuestion,
  onGoToResult,
  onSelectAnswer,
  onReopenShortcuts,
}) {
  const imageSrc = currentQuestion.image_path || currentQuestion.image_url;
  const isLastQuestion =
    activeSession.currentIndex + 1 === activeSession.questions.length;
  const canGoBack = activeSession.currentIndex > 0;

  const getActionStatus = () => {
    if (!answered) return "none";
    const selected = currentQuestion.alternatives.find(
      (a) => a.id === selectedAnswerId,
    );
    return selected?.is_correct ? "correct" : "incorrect";
  };

  return (
    <div className="flex flex-col gap-5 px-4 py-7">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
        <div className="mb-6 flex items-center justify-between">
          <button
            className="flex cursor-pointer items-center gap-2 bg-transparent font-body text-[13px] font-semibold text-text-secondary transition hover:text-text-primary"
            type="button"
            onClick={onReturnToModeSelection}
          >
            <span className="text-text-muted">
              <House size={14} />
            </span>
            Sair da sessão
          </button>
          <button
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-transparent text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
            type="button"
            aria-label="Atalhos de teclado"
            onClick={onReopenShortcuts}
          >
            <CircleHelp size={18} />
          </button>
        </div>

        {imageSrc && (
          <div className="mb-6 rounded-[var(--radius-md)] bg-surface-muted p-4 text-center">
            <img
              className="inline-block max-h-56 max-w-56 rounded-lg"
              src={imageSrc}
              alt="Imagem da questão"
            />
          </div>
        )}

        <div className="mb-5 flex items-center gap-[18px]">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft">
            <span className="font-display text-2xl font-extrabold text-primary">
              {activeSession.currentIndex + 1}
            </span>
          </div>
          <h2 className="font-display text-[22px] font-bold leading-snug text-text-primary">
            {currentQuestion.question}
          </h2>
        </div>

        <div className="mb-5 flex flex-col gap-2.5">
          {currentQuestion.alternatives.map((answer, index) => (
            <AnswerOption
              answer={answer}
              letter={String(index + 1)}
              answered={answered}
              selectedAnswerId={selectedAnswerId}
              onSelect={onSelectAnswer}
              key={answer.id}
            />
          ))}
        </div>

        {answered && activeSession.mode === SESSION_MODES.MISTAKE_REVIEW && (
          <p className="mb-4 rounded-xl bg-surface-muted p-4 font-body text-sm font-bold text-text-secondary">
            {formatQuestionPerformance(performance, currentQuestion.id)}
          </p>
        )}

        <ActionDock
          status={getActionStatus()}
          confirmed={answered}
          disabled={!selectedAnswerId}
          nextLabel={isLastQuestion ? "Ver resultado" : "Próxima"}
          onConfirm={onConfirmAnswer}
          onNext={isLastQuestion ? onGoToResult : onNextQuestion}
          onBack={onPreviousQuestion}
          canGoBack={canGoBack}
        />
      </div>
    </div>
  );
}

function ResultCard({ summary, onRestart, onShowPostSessionReview, onBackToHome }) {
  return (
    <div className="flex flex-col items-center gap-5 px-4 py-10">
      <ScoreRing
        score={summary.score}
        total={summary.totalQuestions}
        percentage={summary.percentage}
      />

      <h2 className="font-display text-2xl font-bold text-text-primary">
        Você acertou {summary.score} de {summary.totalQuestions}
      </h2>

      <p className="max-w-[420px] text-center font-body text-sm leading-relaxed text-text-secondary">
        {summary.percentage >= 70
          ? "Aprovado! Continue treinando para chegar com confiança ao exame oficial do Detran RJ."
          : "Continue treinando para melhorar seu aproveitamento no exame oficial do Detran RJ."}
      </p>

      <div className="flex gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-3">
          <span className="font-display text-base font-bold text-success">
            {summary.score}
          </span>
          <span className="font-body text-xs text-text-secondary">acertos</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-3">
          <span className="font-display text-base font-bold text-error">
            {summary.missedCount}
          </span>
          <span className="font-body text-xs text-text-secondary">erros</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-3">
          <span className="font-display text-base font-bold text-primary">
            {summary.percentage}%
          </span>
          <span className="font-body text-xs text-text-secondary">
            aproveitamento
          </span>
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <Button icon="rotate-ccw" onClick={onRestart}>
          Refazer simulado
        </Button>
        {summary.canOpenPostSessionReview && (
          <Button variant="secondary" icon="book-open" onClick={onShowPostSessionReview}>
            Revisar respostas
          </Button>
        )}
        <Button variant="ghost" icon="arrow-left" onClick={onBackToHome}>
          Voltar ao início
        </Button>
      </div>
    </div>
  );
}

function ReviewCard({ review, onBackToResults, onNewSession }) {
  return (
    <div className="flex flex-col gap-5 px-4 py-7">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
        <h2 className="mb-1 font-display text-2xl font-bold text-text-primary">
          Revisão pós-sessão
        </h2>
        <p className="mb-5 font-body text-[13px] text-text-secondary">
          Revise apenas os erros da sessão recém-finalizada.
        </p>

        <div className="flex flex-col gap-4">
          {review.items.map((item, index) => (
            <article
              className="rounded-[var(--radius-md)] border border-border bg-surface-muted p-5"
              key={item.questionId}
            >
              <div className="mb-3">
                <Badge color="error" label={`ERRO ${index + 1}`} />
              </div>

              <h3 className="mb-3 font-display text-[17px] font-bold leading-snug text-text-primary">
                {item.questionText}
              </h3>

              {item.image.path || item.image.url ? (
                <img
                  className="mb-3 block max-h-44 max-w-44 rounded-lg"
                  src={item.image.path || item.image.url}
                  alt="Imagem da questão"
                />
              ) : null}

              <div className="flex flex-col gap-2">
                {item.alternatives.map((answer) => {
                  const isCorrect = answer.id === item.correctAnswer.id;
                  const isSelected = answer.id === item.selectedAnswer.id;

                  let dotColor = "bg-border";
                  let textColor = "text-text-secondary";
                  let suffix = "";

                  if (isCorrect) {
                    dotColor = "bg-success";
                    textColor = "text-success font-bold";
                    suffix = " (resposta correta)";
                  } else if (isSelected) {
                    dotColor = "bg-error";
                    textColor = "text-error font-bold";
                    suffix = " (sua resposta)";
                  }

                  return (
                    <div className="flex items-center gap-2.5" key={answer.id}>
                      <span
                        className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`}
                      />
                      <span className={`font-body text-sm ${textColor}`}>
                        {answer.text}
                        {suffix}
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" icon="arrow-left" onClick={onBackToResults}>
            Voltar ao resultado
          </Button>
          <Button icon="rotate-ccw" onClick={onNewSession}>
            Iniciar novo simulado
          </Button>
        </div>
      </div>
    </div>
  );
}
