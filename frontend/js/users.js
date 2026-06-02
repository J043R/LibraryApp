function userRoleName(role) {
  return roleNames[role] || role;
}

function escapeUserValue(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function renderUsers(users) {
  const tbody = document.getElementById('usersTable');
  const canDelete = getRole() === 'admin';

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${escapeUserValue(user.id)}</td>
      <td>${escapeUserValue(user.name)}</td>
      <td>${escapeUserValue(user.email)}</td>
      <td>${escapeUserValue(user.age ?? 'Не указан')}</td>
      <td>${escapeUserValue(userRoleName(user.role))}</td>
      <td>${canDelete
        ? `<div class="table-actions">
             <button data-edit-id="${escapeUserValue(user.id)}">Изменить</button>
             <button class="danger" data-delete-id="${escapeUserValue(user.id)}">Удалить</button>
           </div>`
        : 'Просмотр'}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-edit-id]').forEach(button => {
    button.addEventListener('click', () => editUser(button.dataset.editId));
  });
  tbody.querySelectorAll('[data-delete-id]').forEach(button => {
    button.addEventListener('click', () => deleteUser(button.dataset.deleteId));
  });
}

async function loadUsers() {
  try {
    const search = document.getElementById('searchInput').value.trim();
    const users = await apiRequest('/users' + (search ? `?search=${encodeURIComponent(search)}` : ''));
    renderUsers(users);
    document.getElementById('message').textContent = '';
  } catch (error) {
    document.getElementById('message').innerHTML =
      `<div class="alert">${escapeUserValue(error.message)}</div>`;
  }
}

async function deleteUser(id) {
  if (!confirm('Удалить учетную запись?')) return;

  try {
    await apiRequest(`/users/${id}`, { method: 'DELETE' });
    await loadUsers();
  } catch (error) {
    alert(error.message);
  }
}

async function editUser(id) {
  try {
    const user = await apiRequest(`/users/${id}`);
    const form = document.getElementById('userForm');
    form.dataset.userId = user.id;
    form.elements.name.value = user.name;
    form.elements.email.value = user.email;
    form.elements.age.value = user.age ?? '';
    form.elements.role.value = user.role;
    document.getElementById('userFormTitle').textContent = 'Редактирование учетной записи';
    document.getElementById('userSubmitBtn').textContent = 'Сохранить';
    document.getElementById('userCancelBtn').classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    alert(error.message);
  }
}

function resetUserForm(form) {
  form.reset();
  delete form.dataset.userId;
  document.getElementById('userFormTitle').textContent = 'Новая учетная запись';
  document.getElementById('userSubmitBtn').textContent = 'Создать';
  document.getElementById('userCancelBtn').classList.add('hidden');
}

function setupForm() {
  if (getRole() !== 'admin') return;

  const form = document.getElementById('userForm');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    if (!payload.age) delete payload.age;
    const userId = form.dataset.userId;

    try {
      await apiRequest(userId ? `/users/${userId}` : '/users', {
        method: userId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      resetUserForm(form);
      await loadUsers();
    } catch (error) {
      alert(error.message);
    }
  });

  document.getElementById('userCancelBtn').addEventListener('click', () => resetUserForm(form));
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireRole(['admin', 'librarian'])) return;

  setupForm();
  document.getElementById('searchBtn').addEventListener('click', loadUsers);
  document.getElementById('reloadBtn').addEventListener('click', loadUsers);
  loadUsers();
});
