function escapeLogValue(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function formatLogDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ru-RU');
}

function renderLogs(logs) {
  const result = document.getElementById('logsResult');
  if (!logs.length) {
    result.className = 'profile-empty';
    result.textContent = 'В журнале пока нет событий';
    return;
  }

  result.className = 'table-wrap';
  result.innerHTML = `
    <table>
      <thead>
        <tr><th>Дата</th><th>Роль</th><th>Действие</th><th>Детали</th></tr>
      </thead>
      <tbody>
        ${logs.map(log => `
          <tr>
            <td>${escapeLogValue(formatLogDate(log.createdAt))}</td>
            <td>${escapeLogValue(roleNames[log.role] || log.role)}</td>
            <td>${escapeLogValue(log.action)}</td>
            <td>${escapeLogValue(log.details || '-')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadLogs() {
  const result = document.getElementById('logsResult');
  const button = document.getElementById('loadLogsBtn');
  const updatedAt = document.getElementById('logsUpdatedAt');
  button.disabled = true;
  button.textContent = 'Обновление...';

  try {
    renderLogs(await apiRequest(`/logs?time=${Date.now()}`));
    updatedAt.textContent = `Обновлено: ${new Date().toLocaleTimeString('ru-RU')}`;
  } catch (error) {
    result.className = 'profile-empty profile-error';
    result.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = 'Обновить журнал';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireRole(['admin'])) return;
  document.getElementById('loadLogsBtn').addEventListener('click', loadLogs);
  loadLogs();
});
