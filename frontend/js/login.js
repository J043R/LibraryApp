document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const message = document.getElementById('loginMessage');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const user = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      saveSession(user);
      location.href = '/books.html';
    } catch (error) {
      message.innerHTML = `<div class="alert">${error.message}</div>`;
    }
  });
});
