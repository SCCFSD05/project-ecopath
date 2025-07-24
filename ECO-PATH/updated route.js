document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault(); // Stop form from reloading page

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const userType = document.getElementById("userType").value;

  const messageEl = document.getElementById("message");
  messageEl.textContent = "Logging in...";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, userType }),
    });

    const data = await res.json();

    if (res.ok) {
      messageEl.textContent = "Login successful!";
      // Redirect to dashboard or homepage
      window.location.href = `/${userType}/dashboard.html`; // Customize as needed
    } else {
      messageEl.textContent = data.message || "Login failed";
    }
  } catch (err) {
    console.error("Login error:", err);
    messageEl.textContent = "Something went wrong. Try again.";
  }
});
