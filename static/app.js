import { buildQuestionById, createPracticeSession, getValidQuestions, SESSION_MODES } from "./sessionSelection.js";
import {
  clearPerformance,
  formatQuestionPerformance,
  hasMistakeReviewQuestions,
  loadPerformance,
  rankMistakeReviewQuestions,
  recordConfirmedAnswer,
  savePerformance,
} from "./questionPerformance.js";
import { buildPostSessionReview, buildResultSummary, captureMissedAnswer } from "./resultViewModels.js";

const DATA_URL = "detran_rj_exams.json";

const progressEl = document.getElementById("progress");
const modeCard = document.getElementById("mode-card");
const officialModeBtn = document.getElementById("official-mode-btn");
const allModeBtn = document.getElementById("all-mode-btn");
const mistakeModeBtn = document.getElementById("mistake-mode-btn");
const mistakeModeHelp = document.getElementById("mistake-mode-help");
const resetProgressBtn = document.getElementById("reset-progress-btn");
const questionCard = document.getElementById("question-card");
const resultCard = document.getElementById("result-card");
const reviewCard = document.getElementById("review-card");
const questionTextEl = document.getElementById("question-text");
const answersEl = document.getElementById("answers");
const questionPerformanceEl = document.getElementById("question-performance");
const confirmBtn = document.getElementById("confirm-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const postSessionReviewBtn = document.getElementById("post-session-review-btn");
const backToResultsBtn = document.getElementById("back-to-results-btn");
const reviewNewSessionBtn = document.getElementById("review-new-session-btn");
const scoreEl = document.getElementById("score");
const percentageEl = document.getElementById("percentage");
const missedCountEl = document.getElementById("missed-count");
const reviewItemsEl = document.getElementById("review-items");
const errorEl = document.getElementById("error");
const imageWrap = document.getElementById("image-wrap");
const questionImage = document.getElementById("question-image");

let data = null;
let questionById = new Map();
let performance = loadPerformance();
let activeSession = null;
let selectedAnswerId = null;
let answered = false;

async function loadQuestions() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Não foi possível carregar ${DATA_URL}`);
    }

    data = await response.json();
    const questions = getValidQuestions(data);
    questionById = buildQuestionById(questions);

    if (questions.length === 0) {
      throw new Error("O arquivo JSON não contém questões válidas.");
    }

    renderModeSelection();
  } catch (error) {
    progressEl.textContent = "Erro ao carregar.";
    errorEl.textContent = error.message;
    errorEl.hidden = false;
  }
}

function renderModeSelection() {
  hideAllCards();
  modeCard.hidden = false;
  progressEl.textContent = "Escolha como deseja praticar.";

  const availableQuestionIds = [...questionById.keys()];
  const hasMistakes = hasMistakeReviewQuestions(performance, availableQuestionIds);
  mistakeModeBtn.disabled = !hasMistakes;
  mistakeModeHelp.textContent = hasMistakes
    ? "Revise questões que você já errou, priorizando seu menor desempenho."
    : "A Revisão de erros fica disponível depois que você errar uma questão confirmada.";
}

function startSession(mode) {
  const selection = createPracticeSession(data, mode, { performance, rankMistakeReviewQuestions });
  if (!selection.ok) {
    progressEl.textContent = "Modo indisponível.";
    errorEl.textContent = selection.message;
    errorEl.hidden = false;
    return;
  }

  errorEl.hidden = true;
  activeSession = {
    mode: selection.mode,
    title: selection.title,
    source: selection.source,
    questions: selection.questionIds.map((id) => questionById.get(id)),
    currentIndex: 0,
    score: 0,
    missedAnswers: [],
  };

  hideAllCards();
  questionCard.hidden = false;
  renderQuestion();
}

function renderQuestion() {
  const question = getCurrentQuestion();
  selectedAnswerId = null;
  answered = false;

  progressEl.textContent = `${activeSession.title}: questão ${activeSession.currentIndex + 1} de ${activeSession.questions.length}`;
  questionTextEl.textContent = question.question;
  answersEl.innerHTML = "";
  confirmBtn.disabled = true;
  confirmBtn.hidden = false;
  nextBtn.hidden = true;
  questionPerformanceEl.hidden = true;
  questionPerformanceEl.textContent = "";

  const imageSrc = question.image_path || question.image_url;
  if (imageSrc) {
    questionImage.src = imageSrc;
    imageWrap.hidden = false;
  } else {
    questionImage.removeAttribute("src");
    imageWrap.hidden = true;
  }

  question.alternatives.forEach((answer) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer";
    button.dataset.answerId = answer.id;
    button.textContent = answer.text;
    button.addEventListener("click", () => selectAnswer(answer.id));
    answersEl.appendChild(button);
  });
}

function selectAnswer(answerId) {
  if (answered) {
    return;
  }

  selectedAnswerId = answerId;
  confirmBtn.disabled = false;

  document.querySelectorAll(".answer").forEach((button) => {
    button.classList.toggle("selected", button.dataset.answerId === answerId);
  });
}

function confirmAnswer() {
  if (!selectedAnswerId || answered) {
    return;
  }

  const question = getCurrentQuestion();
  const selected = question.alternatives.find((answer) => answer.id === selectedAnswerId);
  const isCorrect = Boolean(selected && selected.is_correct);
  answered = true;

  if (isCorrect) {
    activeSession.score += 1;
  } else {
    activeSession.missedAnswers.push(captureMissedAnswer(question, selectedAnswerId));
  }

  performance = recordConfirmedAnswer(performance, question.id, isCorrect);
  savePerformance(performance);

  document.querySelectorAll(".answer").forEach((button) => {
    const answer = question.alternatives.find((item) => item.id === button.dataset.answerId);
    button.disabled = true;

    if (answer && answer.is_correct) {
      button.classList.add("correct");
    } else if (button.dataset.answerId === selectedAnswerId) {
      button.classList.add("incorrect");
    }
  });

  if (activeSession.mode === SESSION_MODES.MISTAKE_REVIEW) {
    questionPerformanceEl.textContent = formatQuestionPerformance(performance, question.id);
    questionPerformanceEl.hidden = false;
  }

  confirmBtn.hidden = true;
  nextBtn.hidden = false;
  nextBtn.textContent = activeSession.currentIndex + 1 === activeSession.questions.length ? "Ver resultado" : "Próxima";
}

function nextQuestion() {
  activeSession.currentIndex += 1;

  if (activeSession.currentIndex >= activeSession.questions.length) {
    showResult();
    return;
  }

  renderQuestion();
}

function showResult() {
  hideAllCards();
  resultCard.hidden = false;
  progressEl.textContent = "Sessão de prática finalizada.";

  const summary = buildResultSummary(activeSession);
  scoreEl.textContent = `Você acertou ${summary.score} de ${summary.totalQuestions} questões.`;
  percentageEl.textContent = `Aproveitamento: ${summary.percentage}%.`;
  missedCountEl.textContent = `Questões erradas: ${summary.missedCount}.`;
  postSessionReviewBtn.hidden = !summary.canOpenPostSessionReview;
}

function showPostSessionReview() {
  const review = buildPostSessionReview(activeSession.missedAnswers);
  hideAllCards();
  reviewCard.hidden = false;
  progressEl.textContent = "Revise apenas os erros da sessão recém-finalizada.";
  reviewItemsEl.innerHTML = "";

  review.items.forEach((item, index) => {
    const article = document.createElement("article");
    article.className = "review-item";

    const title = document.createElement("h3");
    title.textContent = `Erro ${index + 1}: ${item.questionText}`;
    article.appendChild(title);

    const imageSrc = item.image.path || item.image.url;
    if (imageSrc) {
      const image = document.createElement("img");
      image.src = imageSrc;
      image.alt = "Imagem da questão";
      article.appendChild(image);
    }

    const list = document.createElement("ul");
    item.alternatives.forEach((answer) => {
      const option = document.createElement("li");
      option.textContent = answer.text;
      if (answer.id === item.correctAnswer.id) {
        option.className = "correct-text";
        option.textContent += " (resposta correta)";
      } else if (answer.id === item.selectedAnswer.id) {
        option.className = "incorrect-text";
        option.textContent += " (sua resposta)";
      }
      list.appendChild(option);
    });
    article.appendChild(list);
    reviewItemsEl.appendChild(article);
  });
}

function resetProgress() {
  if (!window.confirm("Tem certeza que deseja resetar todo o desempenho salvo?")) {
    return;
  }

  clearPerformance();
  performance = loadPerformance();
  renderModeSelection();
}

function getCurrentQuestion() {
  return activeSession.questions[activeSession.currentIndex];
}

function hideAllCards() {
  modeCard.hidden = true;
  questionCard.hidden = true;
  resultCard.hidden = true;
  reviewCard.hidden = true;
}

officialModeBtn.addEventListener("click", () => startSession(SESSION_MODES.OFFICIAL_30));
allModeBtn.addEventListener("click", () => startSession(SESSION_MODES.ALL_QUESTIONS));
mistakeModeBtn.addEventListener("click", () => startSession(SESSION_MODES.MISTAKE_REVIEW));
resetProgressBtn.addEventListener("click", resetProgress);
confirmBtn.addEventListener("click", confirmAnswer);
nextBtn.addEventListener("click", nextQuestion);
restartBtn.addEventListener("click", () => startSession(SESSION_MODES.OFFICIAL_30));
postSessionReviewBtn.addEventListener("click", showPostSessionReview);
backToResultsBtn.addEventListener("click", showResult);
reviewNewSessionBtn.addEventListener("click", () => startSession(SESSION_MODES.OFFICIAL_30));

loadQuestions();
