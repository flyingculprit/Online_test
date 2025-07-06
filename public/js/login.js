const showPopup = (text, type = "info") => {
  const popup = document.getElementById("popupMessage");
  popup.textContent = text;
  popup.className = `popup-message ${type}`;
  popup.style.display = "block";

  setTimeout(() => {
    popup.classList.add("show");
  }, 50);

  setTimeout(() => {
    popup.classList.remove("show");
    setTimeout(() => popup.style.display = "none", 300);
  }, 3000);
};

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const message = await response.text();

    if (response.status === 200) {
      showPopup("Login successful!", "success");

      localStorage.setItem("email", email);

      setTimeout(() => {
        window.location.href = "/dashboard.html";
      }, 1000);
    } else {
      showPopup(message, "error");
    }
  } catch (err) {
    console.error("Login error:", err);
    showPopup("⚠️ Something went wrong. Please try again.", "error");
  }
});
