// Options page script
document.addEventListener('DOMContentLoaded', loadOptions);
document.getElementById('save').addEventListener('click', saveOptions);

async function loadOptions() {
  const settings = await browser.storage.sync.get({
    serverUrl: 'http://localhost:3000',
    apiKey: 'web2epub-secret-key-change-me'
  });

  document.getElementById('serverUrl').value = settings.serverUrl;
  document.getElementById('apiKey').value = settings.apiKey;
}

async function saveOptions() {
  const serverUrl = document.getElementById('serverUrl').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();

  // Validate URL
  try {
    new URL(serverUrl);
  } catch (e) {
    showStatus('URL invalide', 'error');
    return;
  }

  // Validate API key
  if (!apiKey) {
    showStatus('Clé API requise', 'error');
    return;
  }

  await browser.storage.sync.set({
    serverUrl: serverUrl,
    apiKey: apiKey
  });

  showStatus('Paramètres enregistrés avec succès', 'success');
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;

  setTimeout(() => {
    status.className = 'status';
  }, 3000);
}
