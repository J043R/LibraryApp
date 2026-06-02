const API_URL = '/api';

async function apiRequest(path, options = {}) {
  const response = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getToken() ? `Bearer ${getToken()}` : '',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message.join('; ') : data.message;
    throw new Error(message || 'Ошибка запроса');
  }
  return data;
}

function printResult(elementId, data) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = JSON.stringify(data, null, 2);
}

function showError(elementId, error) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = error.message;
}
