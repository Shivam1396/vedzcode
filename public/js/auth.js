document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("#loginForm");
  const signupForm = document.querySelector("#signupForm");
  const message = document.querySelector("#message");

  async function submitForm(form, endpoint) {
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');

      message.textContent = "Please wait…";
      button.disabled = true;

      const payload = Object.fromEntries(new FormData(form).entries());

      try {
        const result = await window.api(`/api/auth/${endpoint}`, {
          method: "POST",
          body: JSON.stringify(payload)
        });

        message.textContent = result.message || "Success.";
        window.location.href =
          result.user?.role === "admin" ? "/admin.html" : "/menu.html";
      } catch (error) {
        message.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
  }

  submitForm(loginForm, "login");
  submitForm(signupForm, "register");
});