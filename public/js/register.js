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

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const message = await response.text();

    if (response.status === 200) {
      showPopup("✅ " + message, "success");
      document.getElementById("otpSection").style.display = "block";
    } else if (response.status === 409) {
      showPopup("⚠️ " + message, "error");
    } else {
      showPopup("❌ Something went wrong. Try again.", "error");
    }
  } catch (err) {
    console.error("Register error:", err);
    showPopup("❌ Server error. Try later.", "error");
  }
});

async function verifyOTP() {
  const email = document.getElementById("email").value;
  const otp = document.getElementById("otp").value;

  try {
    const response = await fetch("/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    if (response.ok) {
      showPopup("🎉 Email verified! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1500);
    } else {
      showPopup("❌ Invalid OTP", "error");
    }
  } catch (err) {
    console.error("OTP error:", err);
    showPopup("⚠️ Error verifying OTP", "error");
  }
}
