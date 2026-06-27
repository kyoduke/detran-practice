const DATA_URL = "detran_rj_exams.json";

const progressEl = document.getElementById("progress");
const questionCard = document.getElementById("question-card");
const resultCard = document.getElementById("result-card");
const questionTextEl = document.getElementById("question-text");
const answersEl = document.getElementById("answers");
const confirmBtn = document.getElementById("confirm-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const scoreEl = document.getElementById("score");
const errorEl = document.getElementById("error");
const imageWrap = document.getElementById("image-wrap");
const questionImage = document.getElementById("question-image");

let questions = [];
let currentIndex = 0;
let selectedAnswerId = null;
let answered = false;
let score = 0;

async function loadQuestions() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Could not load ${DATA_URL}`);
    }

    const data = await response.json();
    questions = shuffle(readQuestions(data)).filter((question) => {
      return question.question && Array.isArray(question.alternatives) && question.alternatives.length > 0;
    });

    if (questions.length === 0) {
      throw new Error("The JSON file does not contain any questions.");
    }

    questionCard.hidden = false;
    renderQuestion();
  } catch (error) {
    progressEl.textContent = "Erro ao carregar.";
    errorEl.textContent = error.message;
    errorEl.hidden = false;
  }
}

function readQuestions(data) {
  if (Array.isArray(data.questions)) {
    return data.questions;
  }

  const byQuestion = new Map();
  Object.values(data.exam_versions || {}).forEach((exam) => {
    (exam.questions || []).forEach((question) => {
      const key = [question.question, question.image_code, question.correct_answer_text].join("|");
      if (!byQuestion.has(key)) {
        byQuestion.set(key, convertOldQuestion(question));
      }
    });
  });
  return [...byQuestion.values()];
}

function convertOldQuestion(question) {
  return {
    question: question.question,
    image_code: question.image_code,
    image_url: question.image_url,
    alternatives: Object.entries(question.alternatives || {}).map(([id, text]) => ({
      id,
      text,
      is_correct: id === question.correct_answer,
    })),
  };
}

function renderQuestion() {
  const question = questions[currentIndex];
  selectedAnswerId = null;
  answered = false;

  progressEl.textContent = `Questão ${currentIndex + 1} de ${questions.length}`;
  questionTextEl.textContent = question.question;
  answersEl.innerHTML = "";
  confirmBtn.disabled = true;
  confirmBtn.hidden = false;
  nextBtn.hidden = true;

  if (question.image_url) {
    questionImage.src = question.image_url;
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

  const question = questions[currentIndex];
  const selected = question.alternatives.find((answer) => answer.id === selectedAnswerId);
  answered = true;

  if (selected && selected.is_correct) {
    score += 1;
  }

  document.querySelectorAll(".answer").forEach((button) => {
    const answer = question.alternatives.find((item) => item.id === button.dataset.answerId);
    button.disabled = true;

    if (answer && answer.is_correct) {
      button.classList.add("correct");
    } else if (button.dataset.answerId === selectedAnswerId) {
      button.classList.add("incorrect");
    }
  });

  confirmBtn.hidden = true;
  nextBtn.hidden = false;
  nextBtn.textContent = currentIndex + 1 === questions.length ? "Finish" : "Next";
}

function nextQuestion() {
  currentIndex += 1;

  if (currentIndex >= questions.length) {
    showResult();
    return;
  }

  renderQuestion();
}

function showResult() {
  questionCard.hidden = true;
  resultCard.hidden = false;
  progressEl.textContent = "Finalizado";
  scoreEl.textContent = `Você acertou ${score} de ${questions.length} questões.`;
}

function restartExam() {
  questions = shuffle(questions);
  currentIndex = 0;
  selectedAnswerId = null;
  answered = false;
  score = 0;
  resultCard.hidden = true;
  questionCard.hidden = false;
  renderQuestion();
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

confirmBtn.addEventListener("click", confirmAnswer);
nextBtn.addEventListener("click", nextQuestion);
restartBtn.addEventListener("click", restartExam);

loadQuestions();
