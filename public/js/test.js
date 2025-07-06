let questions = [];
let currentIndex = 0;
let score = 0;
let timeLeft = 30;
let timer;

const subject = new URLSearchParams(window.location.search).get("subject");
document.getElementById("subject-title").innerText = subject;

// Start test
document.getElementById("startBtn").addEventListener("click", async () => {
  const startScreen = document.getElementById("start-screen");
  const testScreen = document.getElementById("test-screen");

  if (document.documentElement.requestFullscreen) {
    await document.documentElement.requestFullscreen();
  }

  startScreen.classList.add("hidden");
  testScreen.classList.remove("hidden");

  const saved = localStorage.getItem("testState");
  if (saved) {
    const state = JSON.parse(saved);
    currentIndex = state.currentIndex;
    score = state.score;
    questions = state.questions;
    timeLeft = state.timeLeft;
    loadQuestion();
  } else {
    fetchQuestions();
  }
});

async function fetchQuestions() {
  try {
    const res = await fetch(`/questions/${encodeURIComponent(subject)}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    const filtered = data.filter(q => q.question && q.options && q.correctAnswer);

    if (filtered.length === 0) {
      document.getElementById("question-container").innerHTML = `
        <h3>No questions available for the subject: ${subject}</h3>
      `;
      return;
    }

    questions = filtered.sort(() => Math.random() - 0.5).slice(0, 10); // Max 10
    currentIndex = 0;
    score = 0;
    timeLeft = 30;
    localStorage.removeItem("resultSent");
    loadQuestion();
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    document.getElementById("question-container").innerHTML = `
      <h3>Error loading questions. Please try again later.</h3>
    `;
  }
}

function loadQuestion() {
  if (currentIndex >= questions.length) {
    document.getElementById("submit-container").classList.remove("hidden");
    document.getElementById("question-container").innerHTML = `<h3>All questions completed. Click submit to finish the test.</h3>`;
    clearInterval(timer);
    return;
  }

  const q = questions[currentIndex];
  document.getElementById("submit-container").classList.add("hidden");

  document.getElementById("question-container").innerHTML = `
    <div class="question-box">
      <h3>Q${currentIndex + 1}. ${q.question}</h3>
      ${q.options.map(opt =>
        `<div class="option" onclick="selectOption('${opt}', '${q.correctAnswer}')">${opt}</div>`
      ).join("")}
    </div>
  `;

  localStorage.setItem("testState", JSON.stringify({ currentIndex, score, questions, timeLeft }));

  document.getElementById("time").innerText = timeLeft;
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("time").innerText = timeLeft;

    if (timeLeft <= 0) {
      currentIndex++;
      timeLeft = 30;
      loadQuestion();
    }

    localStorage.setItem("testState", JSON.stringify({ currentIndex, score, questions, timeLeft }));
  }, 1000);
}

function selectOption(selected, correct) {
  if (selected === correct) score++;
  currentIndex++;
  timeLeft = 30;
  loadQuestion();
}

async function showResult() {
  clearInterval(timer);
  localStorage.removeItem("testState");

  const email = localStorage.getItem("email");

  if (!localStorage.getItem("resultSent") && email) {
    try {
      const res = await fetch("/submit-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subject, score, total: questions.length })
      });

      console.log("Result submitted:", await res.text());
      localStorage.setItem("resultSent", "true");
    } catch (err) {
      console.error("Error sending result:", err);
    }
  }

document.body.innerHTML = `
  <div class="container fade-in" style="text-align: center; padding: 2rem;">
    <h2>Thank you for taking the test!</h2>
    <p>Your result will be sent to your email.</p>
    <button id="backBtn" style="
      background-color:rgb(38, 75, 155);
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 1rem;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 20px;
    ">
      ← Back to Dashboard
    </button>
  </div>
`;

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "/dashboard.html";
});

}

// Exit fullscreen = auto terminate
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    window.onbeforeunload = null;

    const modal = document.createElement("div");
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      ">
        <div style="
          background: #23232c;
          padding: 2rem;
          border-radius: 10px;
          text-align: center;
          max-width: 400px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
        ">
          <h3 style="color: #d00000;">🚫 Test Ended</h3>
          <p>You exited fullscreen. The test is now ended.</p>
          <button id="modalRedirectBtn" style="
            margin-top: 1rem;
            background-color:rgb(66, 35, 114);
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 1rem;
            border-radius: 5px;
            cursor: pointer;
          ">
            Go to Dashboard
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Wait until button is clicked to clear localStorage
    document.getElementById("modalRedirectBtn").addEventListener("click", () => {
      localStorage.removeItem("testState");
      localStorage.removeItem("resultSent");
      window.location.href = "/dashboard.html";
    });
  }
});


// Leave warning
window.onbeforeunload = () => {
  return "Test is in progress. Are you sure you want to leave?";
};
