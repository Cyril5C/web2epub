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
      await sendToServer(epub, response.article.title, response.article.url);

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
  const imagesFolder = oebps.folder('images');

  // Download and embed images
  const images = [];
  const imageManifestItems = [];

  // Extract image URLs from content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = article.content;
  const imgElements = tempDiv.querySelectorAll('img');

  for (let i = 0; i < imgElements.length; i++) {
    const img = imgElements[i];
    const src = img.getAttribute('src');

    if (src) {
      try {
        // Convert relative URLs to absolute
        const imageUrl = new URL(src, article.url || window.location.href).href;

        // Download image
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // Determine image format and extension
        const mimeType = blob.type || 'image/jpeg';
        const ext = mimeType.split('/')[1] || 'jpg';
        const filename = `image_${i + 1}.${ext}`;

        // Add image to EPUB
        imagesFolder.file(filename, blob);

        // Update img src in content
        img.setAttribute('src', `images/${filename}`);

        // Track for manifest
        images.push({
          id: `img_${i + 1}`,
          filename: `images/${filename}`,
          mimeType: mimeType
        });

        imageManifestItems.push(`    <item id="img_${i + 1}" href="images/${filename}" media-type="${mimeType}"/>`);
      } catch (error) {
        console.warn(`Failed to download image: ${src}`, error);
        // Remove broken image from content
        img.remove();
      }
    }
  }

  // Get updated content with corrected image paths using XMLSerializer
  // This ensures proper XHTML formatting
  const serializer = new XMLSerializer();
  let contentWithImages = '';

  // Serialize each child node
  Array.from(tempDiv.childNodes).forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      contentWithImages += serializer.serializeToString(node);
    } else if (node.nodeType === Node.TEXT_NODE) {
      contentWithImages += node.textContent;
    }
  });

  // Clean up xmlns attributes
  contentWithImages = contentWithImages.replace(/\s+xmlns="[^"]*"/g, '');

  // content.opf with image manifest items
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
${imageManifestItems.join('\n')}
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

  // Clean HTML entities in content
  const cleanedContent = cleanHtmlEntities(contentWithImages);
  const xhtmlSafeContent = enforceXhtmlVoidElements(cleanedContent);

  // content.xhtml
  const contentXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(article.title)}</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
</head>
<body>
  <h1>${escapeXml(article.title)}</h1>
  ${article.author ? `<p><em>Par ${escapeXml(article.author)}</em></p>` : ''}
  ${article.date ? `<p><em>${escapeXml(article.date)}</em></p>` : ''}
  <hr/>
  ${xhtmlSafeContent}
</body>
</html>`;
  oebps.file('content.xhtml', contentXhtml);

  // Generate EPUB blob
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  return blob;
}

// Send EPUB to server
async function sendToServer(epubBlob, title, url) {
  const settings = await browser.storage.sync.get({
    serverUrl: 'https://web2epub-production.up.railway.app'
  });

  const formData = new FormData();
  const filename = sanitizeFilename(title) + '.epub';
  formData.append('epub', epubBlob, filename);
  formData.append('title', title);
  formData.append('timestamp', new Date().toISOString());
  formData.append('url', url || '');

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

function cleanHtmlEntities(html) {
  if (!html) return '';

  // Create a temporary element to decode HTML entities
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Get the decoded text content which converts entities to actual characters
  let cleaned = tempDiv.innerHTML;

  // Common HTML entities to numeric character references for XHTML compatibility
  const entityMap = {
    '&nbsp;': '&#160;',
    '&iexcl;': '&#161;',
    '&cent;': '&#162;',
    '&pound;': '&#163;',
    '&curren;': '&#164;',
    '&yen;': '&#165;',
    '&brvbar;': '&#166;',
    '&sect;': '&#167;',
    '&uml;': '&#168;',
    '&copy;': '&#169;',
    '&ordf;': '&#170;',
    '&laquo;': '&#171;',
    '&not;': '&#172;',
    '&shy;': '&#173;',
    '&reg;': '&#174;',
    '&macr;': '&#175;',
    '&deg;': '&#176;',
    '&plusmn;': '&#177;',
    '&sup2;': '&#178;',
    '&sup3;': '&#179;',
    '&acute;': '&#180;',
    '&micro;': '&#181;',
    '&para;': '&#182;',
    '&middot;': '&#183;',
    '&cedil;': '&#184;',
    '&sup1;': '&#185;',
    '&ordm;': '&#186;',
    '&raquo;': '&#187;',
    '&frac14;': '&#188;',
    '&frac12;': '&#189;',
    '&frac34;': '&#190;',
    '&iquest;': '&#191;',
    '&ndash;': '&#8211;',
    '&mdash;': '&#8212;',
    '&lsquo;': '&#8216;',
    '&rsquo;': '&#8217;',
    '&sbquo;': '&#8218;',
    '&ldquo;': '&#8220;',
    '&rdquo;': '&#8221;',
    '&bdquo;': '&#8222;',
    '&dagger;': '&#8224;',
    '&Dagger;': '&#8225;',
    '&bull;': '&#8226;',
    '&hellip;': '&#8230;',
    '&permil;': '&#8240;',
    '&prime;': '&#8242;',
    '&Prime;': '&#8243;',
    '&lsaquo;': '&#8249;',
    '&rsaquo;': '&#8250;',
    '&oline;': '&#8254;',
    '&frasl;': '&#8260;',
    '&euro;': '&#8364;',
    '&trade;': '&#8482;',
    '&larr;': '&#8592;',
    '&uarr;': '&#8593;',
    '&rarr;': '&#8594;',
    '&darr;': '&#8595;',
    '&harr;': '&#8596;',
    '&lArr;': '&#8656;',
    '&uArr;': '&#8657;',
    '&rArr;': '&#8658;',
    '&dArr;': '&#8659;',
    '&hArr;': '&#8660;'
  };

  // Replace each entity with its numeric equivalent
  for (const [entity, numeric] of Object.entries(entityMap)) {
    cleaned = cleaned.replace(new RegExp(entity, 'g'), numeric);
  }

  // Use DOMParser to properly parse and reconstruct HTML
  // This ensures all tags are properly closed and nested
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${cleaned}</div>`, 'text/html');

  // Use XMLSerializer to create proper XHTML
  const serializer = new XMLSerializer();
  const firstChild = doc.body.firstChild;

  if (firstChild) {
    // Serialize to XML/XHTML format
    cleaned = serializer.serializeToString(firstChild);

    // Remove the outer <div> wrapper tags
    cleaned = cleaned.replace(/^<div[^>]*>/, '').replace(/<\/div>$/, '');

    // Clean up xmlns attributes that XMLSerializer adds
    cleaned = cleaned.replace(/\s+xmlns="[^"]*"/g, '');
  }

  // Remove problematic tags that often cause issues in EPUB
  // Remove script and noscript tags completely
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

  // Remove iframe tags
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Remove style tags (keep inline styles but remove style blocks)
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove onclick, onload, and other event handlers
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove "Lire aussi" and related sections
  // Create a temporary DOM to manipulate
  const cleanDiv = document.createElement('div');
  cleanDiv.innerHTML = cleaned;

  // Remove elements containing "Lire aussi", "À lire aussi", "Sur le même sujet", etc.
  const textsToRemove = [
    'lire aussi',
    'à lire aussi',
    'lire également',
    'sur le même sujet',
    'dans la même rubrique',
    'à voir aussi',
    'voir aussi',
    'nos articles',
    'articles liés',
    'articles recommandés',
    'contenus sponsorisés',
    'publicité',
    'partager',
    'newsletter',
    's\'abonner',
    'abonnez-vous'
  ];

  // Find and remove elements
  const allElements = cleanDiv.querySelectorAll('*');
  allElements.forEach(el => {
    const text = el.textContent.toLowerCase().trim();

    // Check if element contains any of the texts to remove
    const elClassName = typeof el.className === 'string' ? el.className.toLowerCase() : '';
    const elId = typeof el.id === 'string' ? el.id.toLowerCase() : '';

    for (const removeText of textsToRemove) {
      if (text === removeText ||
          (text.length < 50 && text.includes(removeText)) ||
          elClassName.includes(removeText.replace(/\s+/g, '-')) ||
          elClassName.includes(removeText.replace(/\s+/g, '_')) ||
          elId.includes(removeText.replace(/\s+/g, '-'))) {
        el.remove();
        break;
      }
    }
  });

  // Remove common class-based elements
  const selectorsToRemove = [
    '.related-articles',
    '.article-related',
    '.read-also',
    '.lire-aussi',
    '.recommended',
    '.recommendations',
    '.sidebar',
    '.social-share',
    '.share-buttons',
    '.newsletter-signup',
    '.advertisement',
    '.ad-container',
    '.sponsor',
    '.promoted-content',
    '[class*="related"]',
    '[class*="recommend"]',
    '[class*="share"]',
    '[class*="social"]',
    '[class*="newsletter"]',
    '[class*="ad-"]',
    '[class*="pub"]',
    '[class*="promo"]'
  ];

  selectorsToRemove.forEach(selector => {
    try {
      const elements = cleanDiv.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    } catch (e) {
      // Ignore invalid selectors
    }
  });

  cleaned = cleanDiv.innerHTML;

  return cleaned;
}

function enforceXhtmlVoidElements(html) {
  if (!html) return '';

  const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  const voidPattern = new RegExp(`<(${voidTags.join('|')})([^>]*)>`, 'gi');

  return html.replace(voidPattern, (match, tag, attrs) => {
    const trimmed = match.trim();
    if (trimmed.endsWith('/>')) {
      return match;
    }
    return `<${tag}${attrs} />`;
  });
}
