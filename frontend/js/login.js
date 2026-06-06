document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');

  if (loginForm) {
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(loginForm).entries());

      try {
        const user = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        saveSession(user);
        location.href = '/books.html';
      } catch (error) {
        loginMessage.innerHTML = `<div class="alert">${error.message}</div>`;
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  const registerMessage = document.getElementById('registerMessage');

  if (registerForm) {
    registerForm.addEventListener('submit', async event => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(registerForm).entries());
      if (!payload.age) delete payload.age;

      try {
        const user = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        saveSession(user);
        location.href = '/books.html';
      } catch (error) {
        registerMessage.innerHTML = `<div class="alert">${error.message}</div>`;
      }
    });
  }
});
