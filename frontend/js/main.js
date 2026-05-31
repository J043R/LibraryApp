document.addEventListener('DOMContentLoaded', () => {
  if (getRole() === 'guest') return;

  const button = document.getElementById('checkApiBtn');
  if (!button) return;

  button.addEventListener('click', async () => {
    try {
      const data = await apiRequest('');
      printResult('apiResult', data);
    } catch (error) {
      showError('apiResult', error);
    }
  });
});
