const roleNames = {
  admin: 'Администратор',
  librarian: 'Библиотекарь',
  reader: 'Читатель',
  guest: 'Гость'
};

function getRole() {
  return localStorage.getItem('libraryRole') || 'guest';
}

function getCurrentUserId() {
  return localStorage.getItem('libraryUserId') || '';
}

function getCurrentUserName() {
  return localStorage.getItem('libraryUserName') || '';
}

function getToken() {
  return localStorage.getItem('libraryToken') || '';
}

function saveSession(user) {
  localStorage.setItem('libraryUserId', user.id);
  localStorage.setItem('libraryUserName', user.name);
  localStorage.setItem('libraryRole', user.role);
  localStorage.setItem('libraryToken', user.token);
}

function logout() {
  localStorage.removeItem('libraryUserId');
  localStorage.removeItem('libraryUserName');
  localStorage.removeItem('libraryToken');
  localStorage.setItem('libraryRole', 'guest');
  location.href = '/';
}

function applyRoleVisibility() {
  const role = getRole();
  document.querySelectorAll('[data-role]').forEach(element => {
    const roles = element.dataset.role.split(',');
    element.classList.toggle('hidden', !roles.includes(role));
  });

  const roleLabel = document.getElementById('currentRoleText');
  if (roleLabel) roleLabel.textContent = roleNames[role] || role;

  const userLabel = document.getElementById('currentUserText');
  if (userLabel) userLabel.textContent = getCurrentUserName() || 'не выполнен вход';
}

function requireRole(allowedRoles) {
  const role = getRole();
  if (allowedRoles.includes(role)) return true;

  document.querySelector('main').innerHTML = `
    <section class="card">
      <h2>Доступ закрыт</h2>
      <p>Для этого раздела недостаточно прав. Выполните вход под подходящей категорией пользователя.</p>
    </section>
  `;
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('logoutBtn');
  if (button) button.addEventListener('click', logout);
  applyRoleVisibility();
});
