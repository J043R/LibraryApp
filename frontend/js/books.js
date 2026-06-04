function escapeValue(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function formatDate(value) {
  if (!value) return '-';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
}

function renderBooks(books) {
  const role = getRole();
  const userId = getCurrentUserId();
  const canManage = ['admin', 'librarian'].includes(role);

  document.getElementById('booksTable').innerHTML = books.map(book => {
    let actions = '';
    if (canManage) {
      actions = book.available
        ? `<button onclick="issueBook('${book.id}')">Выдать</button>`
        : `<button class="secondary" onclick="returnBook('${book.id}')">Принять</button>`;
      if (role === 'admin') actions += ` <button class="danger" onclick="deleteBook('${book.id}')">Удалить</button>`;
    } else if (book.available) {
      actions = `<button onclick="issueBook('${book.id}')">Взять</button>`;
    } else if (String(book.readerId) === String(userId)) {
      actions = `<button class="secondary" onclick="returnBook('${book.id}')">Вернуть</button>`;
    } else {
      actions = '<span class="muted">Занята</span>';
    }

    return `
      <tr>
        <td>${escapeValue(book.id)}</td>
        <td>${escapeValue(book.title)}</td>
        <td>${escapeValue(book.author)}</td>
        <td>${escapeValue(book.year ?? '-')}</td>
        <td class="${book.available ? 'status-ok' : 'status-bad'}">${book.available ? 'В фонде' : 'На руках'}</td>
        <td>${escapeValue(book.readerId ?? '-')}</td>
        <td>${escapeValue(formatDate(book.returnDate))}</td>
        <td>${actions}</td>
      </tr>`;
  }).join('');
}

async function loadBooks() {
  try {
    const search = document.getElementById('bookSearch').value;
    renderBooks(await apiRequest('/books' + (search ? `?search=${encodeURIComponent(search)}` : '')));
    document.getElementById('message').textContent = '';
  } catch (error) {
    document.getElementById('message').innerHTML = `<div class="alert">${escapeValue(error.message)}</div>`;
  }
}

async function issueBook(id) {
  const body = getRole() === 'reader'
    ? {}
    : { readerId: Number(prompt('ID читателя', '3')) };
  if (getRole() !== 'reader' && !body.readerId) return;

  try {
    await apiRequest(`/books/${id}/issue`, { method: 'POST', body: JSON.stringify(body) });
    await loadBooks();
  } catch (error) {
    alert(error.message);
  }
}

async function returnBook(id) {
  try {
    await apiRequest(`/books/${id}/return`, { method: 'POST' });
    await loadBooks();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteBook(id) {
  if (!confirm('Удалить книгу из фонда?')) return;
  try {
    await apiRequest(`/books/${id}`, { method: 'DELETE' });
    await loadBooks();
  } catch (error) {
    alert(error.message);
  }
}

function setupBookForm() {
  const form = document.getElementById('bookForm');
  if (!form || !['admin', 'librarian'].includes(getRole())) return;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await apiRequest('/books', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      });
      form.reset();
      await loadBooks();
    } catch (error) {
      alert(error.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireRole(['admin', 'librarian', 'reader'])) return;
  setupBookForm();
  document.getElementById('bookSearchBtn').addEventListener('click', loadBooks);
  document.getElementById('bookReloadBtn').addEventListener('click', loadBooks);
  loadBooks();
});
