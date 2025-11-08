// Extension background script
console.log('Web2EPUB extension loaded');

// Handle browser action click
browser.browserAction.onClicked.addListener(async (tab) => {
  try {
    // Send message to content script to extract article
    const response = await browser.tabs.sendMessage(tab.id, {
      action: 'extractArticle'
    });

    if (response && response.article) {
      console.log('Article extracted:', response.article.title);

      // Generate EPUB
      const epub = await generateEPUB(response.article);

      // Send to server
      await sendToServer(epub, response.article.title);

      // Show success notification
      browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('icons/icon-48.png'),
        title: '✅ EPUB prêt !',
        message: `"${response.article.title}" a été sauvegardé avec succès`
      });

      // Show alert on the page
      browser.tabs.executeScript(tab.id, {
        code: `
          const alertDiv = document.createElement('div');
          alertDiv.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 16px;
            font-weight: bold;
            animation: slideIn 0.3s ease-out;
          \`;
          alertDiv.innerHTML = \`
            <div style="display: flex; align-items: center; gap: 15px;">
              <span style="font-size: 32px;">✅</span>
              <div>
                <div style="font-size: 18px; margin-bottom: 5px;">EPUB prêt !</div>
                <div style="font-size: 14px; opacity: 0.9; font-weight: normal;">Article sauvegardé avec succès</div>
              </div>
            </div>
          \`;

          const style = document.createElement('style');
          style.textContent = \`
            @keyframes slideIn {
              from { transform: translateX(400px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
              from { transform: translateX(0); opacity: 1; }
              to { transform: translateX(400px); opacity: 0; }
            }
          \`;
          document.head.appendChild(style);
          document.body.appendChild(alertDiv);

          setTimeout(() => {
            alertDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => alertDiv.remove(), 300);
          }, 4000);
        `
      });
    } else {
      throw new Error('Impossible d\'extraire l\'article');
    }
  } catch (error) {
    console.error('Error:', error);
    browser.notifications.create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('icons/icon-48.png'),
      title: '❌ Erreur',
      message: error.message
    });

    // Show error alert on the page
    browser.tabs.executeScript(tab.id, {
      code: `
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = \`
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
          color: white;
          padding: 20px 30px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 16px;
          font-weight: bold;
          animation: slideIn 0.3s ease-out;
        \`;
        alertDiv.innerHTML = \`
          <div style="display: flex; align-items: center; gap: 15px;">
            <span style="font-size: 32px;">❌</span>
            <div>
              <div style="font-size: 18px; margin-bottom: 5px;">Erreur</div>
              <div style="font-size: 14px; opacity: 0.9; font-weight: normal;">${error.message}</div>
            </div>
          </div>
        \`;

        const style = document.createElement('style');
        style.textContent = \`
          @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
          }
        \`;
        document.head.appendChild(style);
        document.body.appendChild(alertDiv);

        setTimeout(() => {
          alertDiv.style.animation = 'slideOut 0.3s ease-out';
          setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
      `
    }).catch(() => {
      // Si on ne peut pas injecter le script, tant pis
      console.log('Could not inject alert script');
    });
  }
});

// Generate EPUB from article data
async function generateEPUB(article) {
  // JSZip is loaded globally via manifest background scripts
  const zip = new JSZip();

  // EPUB structure
  zip.file('mimetype', 'application/epub+zip');

  // META-INF/container.xml
  zip.folder('META-INF').file('container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  const oebps = zip.folder('OEBPS');

  // content.opf
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(article.title)}</dc:title>
    <dc:creator>${escapeXml(article.author || 'Unknown')}</dc:creator>
    <dc:language>fr</dc:language>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    <dc:identifier id="bookid">${generateUUID()}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`;
  oebps.file('content.opf', contentOpf);

  // toc.ncx
  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${generateUUID()}"/>
  </head>
  <docTitle>
    <text>${escapeXml(article.title)}</text>
  </docTitle>
  <navMap>
    <navPoint id="content">
      <navLabel>
        <text>${escapeXml(article.title)}</text>
      </navLabel>
      <content src="content.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;
  oebps.file('toc.ncx', tocNcx);

  // content.xhtml
  const contentXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(article.title)}</title>
  <meta charset="UTF-8"/>
</head>
<body>
  <h1>${escapeXml(article.title)}</h1>
  ${article.author ? `<p><em>Par ${escapeXml(article.author)}</em></p>` : ''}
  ${article.date ? `<p><em>${escapeXml(article.date)}</em></p>` : ''}
  <hr/>
  ${article.content}
</body>
</html>`;
  oebps.file('content.xhtml', contentXhtml);

  // Generate EPUB blob
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  return blob;
}

// Send EPUB to server
async function sendToServer(epubBlob, title) {
  const settings = await browser.storage.sync.get({
    serverUrl: 'http://localhost:3000'
  });

  const formData = new FormData();
  const filename = sanitizeFilename(title) + '.epub';
  formData.append('epub', epubBlob, filename);
  formData.append('title', title);
  formData.append('timestamp', new Date().toISOString());

  const response = await fetch(`${settings.serverUrl}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Erreur lors de l\'envoi au serveur');
  }

  return await response.json();
}

// Utility functions
function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
    .substring(0, 100);
}
