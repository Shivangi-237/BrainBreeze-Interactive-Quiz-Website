const startButton = document.getElementById('start-btn');
const nextButton = document.getElementById('next-btn');
const restartButton = document.getElementById('restart-btn');
const playAgainButton = document.getElementById('play-again-btn');
const quitButton = document.getElementById('quit-btn');
const questionContainerElement = document.getElementById('question-container');
const questionElement = document.getElementById('question');
const answerButtonsElement = document.getElementById('answer-buttons');
const timerElement = document.getElementById('time');
const resultElement = document.getElementById('result');
const categoryElement = document.getElementById('category');
const currentQuestionElement = document.getElementById('current-question');
const totalQuestionsElement = document.getElementById('total-questions');

let shuffledQuestions, currentQuestionIndex;
let score = 0;
let timer;
let timeLeft;

const questions = [];

// Fetch questions from the Open Trivia Database API
async function fetchQuestions() {
  try {
    const category = categoryElement.value;
    const difficulty = document.getElementById('difficulty').value;
    const response = await fetch(`https://opentdb.com/api.php?amount=10&category=${category}&difficulty=${difficulty}&type=multiple`);

    if (!response.ok) {
      throw new Error(`Failed to fetch questions. Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.response_code !== 0 || !data.results) {
      throw new Error("No questions found or invalid API response.");
    }

    questions.length = 0; // Clear previous questions
    questions.push(...data.results.map(q => ({
      question: q.question,
      answers: [
        { text: q.correct_answer, correct: true },
        ...q.incorrect_answers.map(a => ({ text: a, correct: false }))
      ].sort(() => Math.random() - 0.5) // Shuffle answers
    })));

    console.log("Questions fetched successfully:", questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    alert("Failed to load questions. Please try again later.");
  }
}

function startGame() {
  startButton.classList.add('hide'); // Hide "Start Quiz" button
  document.getElementById('category-selection').classList.add('hide'); // Hide category dropdown
  document.getElementById('difficulty-selection').classList.add('hide'); // Hide difficulty dropdown
  shuffledQuestions = questions.sort(() => Math.random() - 0.5); // Shuffle questions
  currentQuestionIndex = 0;
  questionContainerElement.classList.remove('hide'); // Show question container
  score = 0;

  // Set background image based on category
  const category = document.getElementById('category').value;
  setBackgroundImage(category);

  // Show the question count
  document.getElementById('question-count').classList.add('show');

  // Update total questions count
  totalQuestionsElement.innerText = shuffledQuestions.length;
  currentQuestionElement.innerText = 0;

  // Show the controls container and pause button
  document.getElementById('controls-container').classList.remove('hide');
  document.getElementById('pause-btn').classList.remove('hide');

  // Adjust timer based on difficulty
  const difficulty = document.getElementById('difficulty').value;
  if (difficulty === 'easy') {
    timeLeft = shuffledQuestions.length * 8; // 8 seconds per question
  } else if (difficulty === 'medium') {
    timeLeft = shuffledQuestions.length * 6; // 6 seconds per question
  } else if (difficulty === 'hard') {
    timeLeft = shuffledQuestions.length * 4; // 4 seconds per question
  }

  // Update the timer display with the calculated time
  timerElement.innerText = timeLeft;

  // Clear any existing timer interval
  clearInterval(timer);

  // Start the timer
  startTimer();
  setNextQuestion();
}

let isPaused = false;

function startTimer() {
  timer = setInterval(() => {
    if (!isPaused) {
      timeLeft--;
      console.log("Time left:", timeLeft); // Debugging
      timerElement.innerText = timeLeft; // Update the timer display

      // Show warning when time is low
      if (timeLeft === 10) {
        document.getElementById('timer-warning').classList.add('show');
      }

      if (timeLeft <= 0) {
        clearInterval(timer);
        endGame();
      }
    }
  }, 1000);
}

// Pause/Resume Button Logic
document.getElementById('pause-btn').addEventListener('click', () => {
  isPaused = !isPaused;
  if (isPaused) {
    document.getElementById('pause-btn').innerText = "Resume";
  } else {
    document.getElementById('pause-btn').innerText = "Pause";
  }
});

// Set the next question
function setNextQuestion() {
  resetState();
  showQuestion(shuffledQuestions[currentQuestionIndex]);
  updateProgressBar();
  updateQuestionCount();
}

// Display the current question and answers
function showQuestion(question) {
  console.log("Displaying question:", question.question); // Debugging
  questionElement.innerText = question.question;
  question.answers.forEach(answer => {
    const button = document.createElement('button');
    button.innerText = answer.text;
    button.classList.add('btn');
    if (answer.correct) {
      button.dataset.correct = answer.correct;
    }
    button.addEventListener('click', selectAnswer);
    answerButtonsElement.appendChild(button);
  });
}

// Reset the state of the answer buttons
function resetState() {
  nextButton.classList.add('hide');
  while (answerButtonsElement.firstChild) {
    answerButtonsElement.removeChild(answerButtonsElement.firstChild);
  }
}

// Handle answer selection
function selectAnswer(e) {
  const selectedButton = e.target;
  const correct = selectedButton.dataset.correct;
  playSound(correct);
  if (correct) {
    score++;
  }
  Array.from(answerButtonsElement.children).forEach(button => {
    setStatusClass(button, button.dataset.correct);
  });
  if (shuffledQuestions.length > currentQuestionIndex + 1) {
    nextButton.classList.remove('hide');
  } else {
    endGame();
  }
}

// Set status class for correct/wrong answers
function setStatusClass(element, correct) {
  clearStatusClass(element);
  if (correct) {
    element.classList.add('correct');
  } else {
    element.classList.add('wrong');
  }
}

// Clear status classes
function clearStatusClass(element) {
  element.classList.remove('correct');
  element.classList.remove('wrong');
}

// Update the progress bar
function updateProgressBar() {
  const progress = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;
  document.getElementById('progress').style.width = `${progress}%`;
}

// Update the question count
function updateQuestionCount() {
  console.log("Updating question count:", currentQuestionIndex + 1); // Debugging
  currentQuestionElement.innerText = currentQuestionIndex + 1;
}

// Play sound for correct/wrong answers
function playSound(isCorrect) {
  try {
    const sound = new Audio(isCorrect ? 'sounds/correct.mp3' : 'sounds/wrong.mp3');
    sound.play();
  } catch (error) {
    console.error("Error playing sound:", error);
  }
}

// End the game
function endGame() {
  clearInterval(timer);
  questionContainerElement.classList.add('hide');
  resultElement.innerHTML = `Your score: ${score}/${shuffledQuestions.length}`;
  resultElement.classList.remove('hide');
  restartButton.classList.remove('hide');
  playAgainButton.classList.remove('hide');
  quitButton.classList.remove('hide');
  document.getElementById('controls-container').classList.add('hide');
  document.getElementById('pause-btn').classList.add('hide'); // Hide pause button
}

function restartGame() {
  resultElement.classList.add('hide');
  restartButton.classList.add('hide');
  playAgainButton.classList.add('hide');
  quitButton.classList.add('hide');
  document.getElementById('pause-btn').innerText = "Pause";
  startGame();
}

function playAgain() {
  resultElement.classList.add('hide');
  restartButton.classList.add('hide');
  playAgainButton.classList.add('hide');
  quitButton.classList.add('hide');
  document.getElementById('category-selection').classList.remove('hide');
  document.getElementById('difficulty-selection').classList.remove('hide');
  startButton.classList.remove('hide');
  document.getElementById('pause-btn').innerText = "Pause";
  document.getElementById('pause-btn').classList.add('hide'); // Hide pause button

  // Reset background to default
  const backgroundContainer = document.getElementById('background-container');
  backgroundContainer.style.backgroundImage = 'url(images/default.jpg)';

  // Hide the question count
  document.getElementById('question-count').classList.remove('show');

  // Reset the timer
  clearInterval(timer);
  timerElement.innerText = "--";
  document.getElementById('timer-warning').classList.remove('show');

  // Reset the timeLeft variable
  timeLeft = 0;
}

// Quit the game
function quitGame() {
  alert("Thank you for playing!");
}

// Event listeners
startButton.addEventListener('click', async () => {
  await fetchQuestions();
  startGame();
});

nextButton.addEventListener('click', () => {
  currentQuestionIndex++;
  setNextQuestion();
});

restartButton.addEventListener('click', restartGame);
playAgainButton.addEventListener('click', playAgain);
quitButton.addEventListener('click', quitGame);

// Ensure only the "Start Quiz" button is visible initially
document.addEventListener("DOMContentLoaded", function () {
    startButton.classList.remove('hide');
    document.getElementById('controls-container').classList.add('hide'); // Hide Pause and Next buttons
    nextButton.classList.add('hide');
    restartButton.classList.add('hide');
    playAgainButton.classList.add('hide');
    quitButton.classList.add('hide');
  });

// Set background image based on category
function setBackgroundImage(category) {
  const backgroundContainer = document.getElementById('background-container');
  let backgroundImage = '';

  switch (category) {
    case '9': // General Knowledge
      backgroundImage = 'url(images/general-knowledge.jpg)';
      break;
    case '22': // Geography
      backgroundImage = 'url(images/Geography.jpg)';
      break;
    case '21': // Sports
      backgroundImage = 'url(images/sports.jpg)';
      break;
    case '20': // History
      backgroundImage = 'url(images/history.jpg)';
      break;
    default:
      backgroundImage = 'url(images/default.jpg)'; // Default background
  }

  console.log("Setting background image:", backgroundImage); // Debugging
  backgroundContainer.style.backgroundImage = backgroundImage;
}