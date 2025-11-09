// Popup script for draft management
document.addEventListener('DOMContentLoaded', init);

let currentDraft = null;

async function init() {
  await loadDraft();

  document.getElementById('add-to-draft-btn').addEventListener('click', addCurrentArticleToDraft);
  document.getElementById('export-btn').addEventListener('click', exportDraft);
  document.getElementById('clear-btn').addEventListener('click', clearDraft);
  document.getElementById('single-btn').addEventListener('click', saveSingleArticle);
}

async function loadDraft() {
  try {
    const result = await browser.storage.local.get('draftEpub');
    currentDraft = result.draftEpub || null;
    console.log('Draft loaded:', currentDraft);
    updateUI();
  } catch (error) {
    console.error('Error loading draft:', error);
    currentDraft = null;
    updateUI();
  }
}

function updateUI() {
  const statusDiv = document.getElementById('draft-status');
  const exportBtn = document.getElementById('export-btn');
  const clearBtn = document.getElementById('clear-btn');

  if (!currentDraft || currentDraft.articles.length === 0) {
    statusDiv.innerHTML = '<div class="status-empty">Aucun article dans la compilation</div>';
    exportBtn.disabled = true;
    clearBtn.disabled = true;
  } else {
    const count = currentDraft.articles.length;
    let html = `<div style="margin-bottom: 10px;">
      <span class="count">${count} article${count > 1 ? 's' : ''}</span>
    </div>`;

    html += '<div class="article-list">';
    currentDraft.articles.forEach((article, index) => {
      const domain = article.domain ? ` - ${article.domain}` : '';
      html += `
        <div class="article-item">
          <span class="article-title">${index + 1}. ${escapeHtml(article.title)}</span>
          <span class="article-meta">${domain}</span>
        </div>
      `;
    });
    html += '</div>';

    statusDiv.innerHTML = html;
    exportBtn.disabled = false;
    clearBtn.disabled = false;
  }
}

async function exportDraft() {
  if (!currentDraft || currentDraft.articles.length === 0) {
    showMessage('Aucun article à exporter', 'error');
    return;
  }

  try {
    const exportBtn = document.getElementById('export-btn');
    exportBtn.disabled = true;
    exportBtn.textContent = 'Export en cours...';

    // Send message to background script to handle export
    const response = await browser.runtime.sendMessage({
      action: 'exportDraft',
      draft: currentDraft
    });

    if (response && response.success) {
      // Clear draft
      await browser.storage.local.remove('draftEpub');
      currentDraft = null;

      showMessage('EPUB exporté et envoyé avec succès !', 'success');
      updateUI();

      // Close popup after 2 seconds
      setTimeout(() => window.close(), 2000);
    } else {
      throw new Error(response?.error || 'Erreur lors de l\'export');
    }
  } catch (error) {
    console.error('Error exporting:', error);
    showMessage('Erreur: ' + error.message, 'error');

    const exportBtn = document.getElementById('export-btn');
    exportBtn.disabled = false;
    exportBtn.textContent = 'Exporter et envoyer au serveur';
  }
}

async function clearDraft() {
  if (!confirm('Vider la compilation ? Cette action est irréversible.')) {
    return;
  }

  await browser.storage.local.remove('draftEpub');
  currentDraft = null;

  showMessage('Compilation vidée', 'success');
  updateUI();
}

async function addCurrentArticleToDraft() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    // Send message to background script to add article to draft
    const response = await browser.runtime.sendMessage({
      action: 'addToDraft',
      tabId: tab.id
    });

    if (response && response.success) {
      showMessage(`Article ajouté ! (${response.count} article(s))`, 'success');

      // Reload draft and update UI
      await loadDraft();
    } else {
      throw new Error(response?.error || 'Impossible d\'extraire l\'article');
    }
  } catch (error) {
    console.error('Error adding to draft:', error);
    showMessage('Erreur: ' + error.message, 'error');
  }
}

async function saveSingleArticle() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    // Send message to background script to handle single article save
    const response = await browser.runtime.sendMessage({
      action: 'saveSingleArticle',
      tabId: tab.id
    });

    if (response && response.success) {
      showMessage('Article enregistré avec succès !', 'success');

      // Close popup after 2 seconds
      setTimeout(() => window.close(), 2000);
    } else {
      throw new Error(response?.error || 'Impossible d\'extraire l\'article');
    }
  } catch (error) {
    console.error('Error saving single article:', error);
    showMessage('Erreur: ' + error.message, 'error');
  }
}

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;

  if (type === 'success') {
    setTimeout(() => {
      messageDiv.className = 'message';
    }, 3000);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
