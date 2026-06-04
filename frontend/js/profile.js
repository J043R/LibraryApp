function profileRoleName(role) {
  return roleNames[role] || role || 'Не указана';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function renderProfile(user) {
  const result = document.getElementById('profileResult');
  const name = escapeHtml(user.name);
  const role = escapeHtml(profileRoleName(user.role));
  const id = escapeHtml(user.id);

  result.className = 'profile-card';
  result.innerHTML = `
    <div class="profile-avatar">${name.slice(0, 1).toUpperCase()}</div>
    <div class="profile-main">
      <div class="profile-title-row">
        <div>
          <h3>${name}</h3>
          <p>${role}</p>
        </div>
        <span class="profile-id">ID ${id}</span>
      </div>
      <dl class="profile-details">
        <div><dt>Email</dt><dd>${escapeHtml(user.email)}</dd></div>
        <div><dt>Возраст</dt><dd>${escapeHtml(user.age ?? 'Не указан')}</dd></div>
        <div><dt>Роль</dt><dd>${role}</dd></div>
        <div><dt>Идентификатор</dt><dd>${id}</dd></div>
      </dl>
    </div>
  `;
}

function renderProfileMessage(message, isError = false) {
  const result = document.getElementById('profileResult');
  result.className = isError ? 'profile-empty profile-error' : 'profile-empty';
  result.textContent = message;
}

async function loadProfile(input) {
  const id = input.value.trim();
  if (!id) {
    renderProfileMessage('Введите ID пользователя', true);
    return;
  }

  renderProfileMessage('Загрузка карточки пользователя...');
  try {
    renderProfile(await apiRequest(`/users/${encodeURIComponent(id)}`));
  } catch (error) {
    renderProfileMessage(error.message, true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireRole(['admin', 'librarian', 'reader'])) return;

  const input = document.getElementById('profileId');
  const button = document.getElementById('profileBtn');

  if (getRole() === 'reader') {
    input.value = getCurrentUserId();
    input.disabled = true;
  }

  button.addEventListener('click', () => loadProfile(input));
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') loadProfile(input);
  });

  loadProfile(input);
});
