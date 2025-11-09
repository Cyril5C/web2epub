// Extension background script
console.log('Web2EPUB extension loaded');

// ===== DRAFT EPUB MANAGEMENT =====

// Get current draft from storage
async function getDraftEpub() {
  const result = await browser.storage.local.get('draftEpub');
  return result.draftEpub || null;
}

// Save draft to storage
async function saveDraftEpub(draft) {
  await browser.storage.local.set({ draftEpub: draft });
}

// Clear draft from storage
async function clearDraftEpub() {
  await browser.storage.local.remove('draftEpub');
}

// Add article to draft
async function addArticleToDraft(article) {
  let draft = await getDraftEpub();

  if (!draft) {
    // Create new draft
    draft = {
      articles: [],
      createdAt: new Date().toISOString()
    };
  }

  // Add article to draft
  draft.articles.push({
    title: article.title,
    author: article.author,
    date: article.date,
    content: article.content,
    url: article.url,
    domain: article.domain,
    addedAt: new Date().toISOString()
  });

  await saveDraftEpub(draft);
  return draft;
}

// Get article count in draft
async function getDraftArticleCount() {
  const draft = await getDraftEpub();
  return draft ? draft.articles.length : 0;
}

// Create context menu
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: 'add-to-epub',
    title: 'Ajouter à la compilation EPUB',
    contexts: ['page']
  });
});

// Handle context menu click
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'add-to-epub') {
    try {
      // Extract article
      const response = await browser.tabs.sendMessage(tab.id, {
        action: 'extractArticle'
      });

      if (response && response.article) {
        // Add to draft
        const draft = await addArticleToDraft(response.article);

        // Show success notification
        browser.notifications.create({
          type: 'basic',
          iconUrl: browser.runtime.getURL('icons/icon-48.png'),
          title: '✅ Article ajouté',
          message: `"${response.article.title}" ajouté à la compilation (${draft.articles.length} article(s))`
        });

        // Show alert on page
        browser.tabs.executeScript(tab.id, {
          code: `
            const alertDiv = document.createElement('div');
            alertDiv.style.cssText = \`
              position: fixed !important;
              top: 20px !important;
              right: 20px !important;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
              color: white !important;
              padding: 20px 30px !important;
              border-radius: 10px !important;
              box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
              z-index: 2147483647 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              font-size: 16px !important;
              font-weight: bold !important;
              animation: slideIn 0.3s ease-out !important;
              pointer-events: none !important;
            \`;
            alertDiv.innerHTML = \`
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 32px;">✅</span>
                <div>
                  <div style="font-size: 18px; margin-bottom: 5px;">Article ajouté</div>
                  <div style="font-size: 14px; opacity: 0.9; font-weight: normal;">${draft.articles.length} article(s) dans la compilation</div>
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
            }, 3000);
          `
        });
      }
    } catch (error) {
      console.error('Error adding to draft:', error);
      browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('icons/icon-48.png'),
        title: '❌ Erreur',
        message: error.message
      });
    }
  }
});

// Handle keyboard command (Ctrl+Shift+E / Command+Shift+E)
browser.commands.onCommand.addListener(async (command) => {
  if (command === 'add-and-show') {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    try {
      // Extract article
      const response = await browser.tabs.sendMessage(tab.id, {
        action: 'extractArticle'
      });

      if (response && response.article) {
        // Add to draft
        const draft = await addArticleToDraft(response.article);

        // Show success notification
        browser.notifications.create({
          type: 'basic',
          iconUrl: browser.runtime.getURL('icons/icon-48.png'),
          title: '✅ Article ajouté',
          message: `"${response.article.title}" ajouté à la compilation (${draft.articles.length} article(s))`
        });

        // Show alert on page
        browser.tabs.executeScript(tab.id, {
          code: `
            const alertDiv = document.createElement('div');
            alertDiv.style.cssText = \`
              position: fixed !important;
              top: 20px !important;
              right: 20px !important;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
              color: white !important;
              padding: 20px 30px !important;
              border-radius: 10px !important;
              box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
              z-index: 2147483647 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              font-size: 16px !important;
              font-weight: bold !important;
              animation: slideIn 0.3s ease-out !important;
              pointer-events: none !important;
            \`;
            alertDiv.innerHTML = \`
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 32px;">✅</span>
                <div>
                  <div style="font-size: 18px; margin-bottom: 5px;">Article ajouté</div>
                  <div style="font-size: 14px; opacity: 0.9; font-weight: normal;">${draft.articles.length} article(s) dans la compilation</div>
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
            }, 3000);
          `
        });

        // Note: Cannot open popup from keyboard shortcut in Firefox
        // User will see notification and can click extension icon to see compilation
      }
    } catch (error) {
      console.error('Error in add-and-show command:', error);
      browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('icons/icon-48.png'),
        title: '❌ Erreur',
        message: error.message
      });
    }
  }
});

// Handle messages from popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'exportDraft') {
    handleExportDraft(message.draft)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (message.action === 'saveSingleArticle') {
    handleSaveSingleArticle(message.tabId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (message.action === 'addToDraft') {
    handleAddToDraft(message.tabId)
      .then(count => sendResponse({ success: true, count: count }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Handle export draft from popup
async function handleExportDraft(draft) {
  // Generate multi-article EPUB
  const epub = await generateMultiArticleEPUB(draft);

  // Get first article domain for metadata
  const firstDomain = draft.articles[0].domain || '';

  // Create title for compilation
  const title = `Compilation ${draft.articles.length} articles - ${new Date().toLocaleDateString('fr-FR')}`;

  // Send to server
  await sendToServer(epub, title, '', firstDomain);
}

// Handle save single article from popup
async function handleSaveSingleArticle(tabId) {
  // Extract article from tab
  const response = await browser.tabs.sendMessage(tabId, {
    action: 'extractArticle'
  });

  if (!response || !response.article) {
    throw new Error('Impossible d\'extraire l\'article');
  }

  // Generate single EPUB
  const epub = await generateEPUB(response.article);

  // Send to server
  await sendToServer(epub, response.article.title, response.article.url, response.article.domain);
}

// Handle add to draft from popup
async function handleAddToDraft(tabId) {
  // Extract article from tab
  const response = await browser.tabs.sendMessage(tabId, {
    action: 'extractArticle'
  });

  if (!response || !response.article) {
    throw new Error('Impossible d\'extraire l\'article');
  }

  // Add to draft
  const draft = await addArticleToDraft(response.article);

  return draft.articles.length;
}

// Generate multi-article EPUB from draft
async function generateMultiArticleEPUB(draft) {
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

  // Track all images and their manifest items
  const allImages = [];
  const imageManifestItems = [];
  let globalImageCounter = 0;

  // Process all articles
  const processedArticles = [];

  for (let articleIndex = 0; articleIndex < draft.articles.length; articleIndex++) {
    const article = draft.articles[articleIndex];

    // Download and embed images for this article
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = article.content;
    const imgElements = tempDiv.querySelectorAll('img');

    console.log(`Processing article ${articleIndex + 1}: "${article.title}" - Found ${imgElements.length} images`);

    for (let i = 0; i < imgElements.length; i++) {
      const img = imgElements[i];
      let src = img.getAttribute('src');

      // Check for lazy-loaded images
      if (!src || src.startsWith('data:')) {
        src = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original');
      }

      if (src && !src.startsWith('data:')) {
        try {
          // Convert relative URLs to absolute
          const imageUrl = new URL(src, article.url || window.location.href).href;

          console.log(`  [${i + 1}/${imgElements.length}] Downloading: ${imageUrl}`);

          // Download image
          const response = await fetch(imageUrl);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
          }

          const blob = await response.blob();

          // Validate blob size
          if (blob.size === 0) {
            throw new Error('Empty image (0 bytes)');
          }

          // Determine image format and extension
          const mimeType = blob.type || 'image/jpeg';
          const ext = mimeType.split('/')[1] || 'jpg';
          globalImageCounter++;
          const filename = `image_${globalImageCounter}.${ext}`;

          // Add image to EPUB
          imagesFolder.file(filename, blob);

          // Update img src in content
          img.setAttribute('src', `images/${filename}`);

          console.log(`  ✓ [${i + 1}/${imgElements.length}] Saved as ${filename} (${mimeType}, ${(blob.size / 1024).toFixed(1)}KB)`);

          // Track for manifest
          imageManifestItems.push(`    <item id="img_${globalImageCounter}" href="images/${filename}" media-type="${mimeType}"/>`);
        } catch (error) {
          console.error(`  ✗ [${i + 1}/${imgElements.length}] Failed: ${src}`);
          console.error(`     Reason: ${error.message}`);
          // Remove the entire parent element to avoid empty spaces
          const parent = img.parentElement;
          if (parent && parent.tagName !== 'BODY' && parent !== tempDiv) {
            parent.remove();
          } else {
            img.remove();
          }
        }
      } else {
        console.warn(`  ⊘ [${i + 1}/${imgElements.length}] Skipped (no valid src): ${img.outerHTML.substring(0, 100)}`);
        img.remove();
      }
    }

    // Get updated content with corrected image paths
    let contentWithImages = tempDiv.innerHTML;

    // Debug: Check if image paths are in the content
    const imagePathMatches = contentWithImages.match(/src="images\/[^"]+"/g);
    if (imagePathMatches) {
      console.log(`  → Found ${imagePathMatches.length} image references in HTML:`, imagePathMatches);
    }

    // Process content
    const cleanedContent = cleanHtmlEntities(contentWithImages);
    const xhtmlSafeContent = enforceXhtmlVoidElements(cleanedContent);

    // Debug: Check final XHTML image tags
    const xhtmlImageMatches = xhtmlSafeContent.match(/<img[^>]*>/gi);
    if (xhtmlImageMatches) {
      console.log(`  → Final XHTML img tags (${xhtmlImageMatches.length}):`, xhtmlImageMatches.slice(0, 2));
    }

    processedArticles.push({
      ...article,
      processedContent: xhtmlSafeContent,
      chapterId: `chapter_${articleIndex + 1}`
    });
  }

  // Generate cover image with mosaic of article images
  console.log(`Creating cover with ${globalImageCounter} images`);
  let hasCover = false;
  if (globalImageCounter > 0) {
    try {
      const coverBlob = await createMosaicCover(imagesFolder, globalImageCounter);
      imagesFolder.file('cover.jpg', coverBlob);
      imageManifestItems.push('    <item id="cover-image" href="images/cover.jpg" media-type="image/jpeg"/>');
      hasCover = true;
      console.log('✓ Cover image created');
    } catch (error) {
      console.warn('Failed to create cover:', error);
    }
  }

  // Generate cover page XHTML if we have a cover
  if (hasCover) {
    const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Couverture</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      text-align: center;
    }
    img {
      max-width: 100%;
      max-height: 100%;
    }
  </style>
</head>
<body>
  <img src="images/cover.jpg" alt="Couverture"/>
</body>
</html>`;
    oebps.file('cover.xhtml', coverXhtml);
  }

  // Generate table of contents XHTML
  let tocHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Sommaire</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
</head>
<body>
  <h1>Sommaire</h1>
  <ul>`;

  processedArticles.forEach((article) => {
    tocHtml += `
    <li><a href="${article.chapterId}.xhtml">${escapeXml(article.title)}</a></li>`;
  });

  tocHtml += `
  </ul>
</body>
</html>`;

  oebps.file('toc.xhtml', tocHtml);

  // Generate individual chapter files
  processedArticles.forEach(article => {
    // Build XHTML parts separately to avoid template literal issues with content
    var chapterParts = [];
    chapterParts.push('<?xml version="1.0" encoding="UTF-8"?>');
    chapterParts.push('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">');
    chapterParts.push('<html xmlns="http://www.w3.org/1999/xhtml">');
    chapterParts.push('<head>');
    chapterParts.push('  <title>' + escapeXml(article.title) + '</title>');
    chapterParts.push('  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>');
    chapterParts.push('  <style type="text/css">');
    chapterParts.push('    img {');
    chapterParts.push('      display: block;');
    chapterParts.push('      width: 100% !important;');
    chapterParts.push('      max-width: 100% !important;');
    chapterParts.push('      height: auto;');
    chapterParts.push('      margin: 1em 0;');
    chapterParts.push('      clear: both;');
    chapterParts.push('    }');
    chapterParts.push('  </style>');
    chapterParts.push('</head>');
    chapterParts.push('<body>');
    chapterParts.push('  <h1>' + escapeXml(article.title) + '</h1>');
    if (article.author) {
      chapterParts.push('  <p><em>Par ' + escapeXml(article.author) + '</em></p>');
    }
    if (article.date) {
      chapterParts.push('  <p><em>' + escapeXml(article.date) + '</em></p>');
    }
    chapterParts.push('  <hr/>');
    chapterParts.push('  ' + article.processedContent);
    chapterParts.push('</body>');
    chapterParts.push('</html>');

    var chapterXhtml = chapterParts.join('\n');
    oebps.file(article.chapterId + '.xhtml', chapterXhtml);
  });

  // Generate content.opf with all chapters
  const manifestItems = [];
  const spineItems = [];

  // Add cover page first if it exists
  if (hasCover) {
    manifestItems.push(`    <item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"/>`);
    spineItems.push(`    <itemref idref="cover-page"/>`);
  }

  // Add table of contents
  manifestItems.push(`    <item id="toc-page" href="toc.xhtml" media-type="application/xhtml+xml"/>`);
  spineItems.push(`    <itemref idref="toc-page"/>`);

  // Add all chapter pages
  processedArticles.forEach(article => {
    manifestItems.push(`    <item id="${article.chapterId}" href="${article.chapterId}.xhtml" media-type="application/xhtml+xml"/>`);
    spineItems.push(`    <itemref idref="${article.chapterId}"/>`);
  });

  const title = `Compilation ${draft.articles.length} articles`;

  // Add cover metadata if cover exists
  const coverMetadata = globalImageCounter > 0 ? '\n    <meta name="cover" content="cover-image"/>' : '';

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>Web2EPUB</dc:creator>
    <dc:language>fr</dc:language>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    <dc:identifier id="bookid">${generateUUID()}</dc:identifier>${coverMetadata}
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${manifestItems.join('\n')}
${imageManifestItems.join('\n')}
  </manifest>
  <spine toc="ncx">
${spineItems.join('\n')}
  </spine>
</package>`;
  oebps.file('content.opf', contentOpf);

  // Generate NCX table of contents
  let ncxNavPoints = '';
  processedArticles.forEach((article, index) => {
    ncxNavPoints += `
    <navPoint id="nav-${index + 1}" playOrder="${index + 1}">
      <navLabel>
        <text>${escapeXml(article.title)}</text>
      </navLabel>
      <content src="${article.chapterId}.xhtml"/>
    </navPoint>`;
  });

  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${generateUUID()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(title)}</text>
  </docTitle>
  <navMap>${ncxNavPoints}
  </navMap>
</ncx>`;
  oebps.file('toc.ncx', tocNcx);

  // Generate EPUB blob
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  return blob;
}

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
  <style type="text/css">
    img {
      display: block;
      width: 100% !important;
      max-width: 100% !important;
      height: auto;
      margin: 1em 0;
      clear: both;
    }
  </style>
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
async function sendToServer(epubBlob, title, url, domain) {
  const settings = await browser.storage.sync.get({
    serverUrl: 'https://web2epub-production.up.railway.app',
    apiKey: 'web2epub-secret-key-change-me'
  });

  const formData = new FormData();
  const filename = sanitizeFilename(title) + '.epub';
  formData.append('epub', epubBlob, filename);
  formData.append('title', title);
  formData.append('timestamp', new Date().toISOString());
  formData.append('url', url || '');
  formData.append('domain', domain || '');

  const response = await fetch(`${settings.serverUrl}/upload`, {
    method: 'POST',
    headers: {
      'X-API-Key': settings.apiKey
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erreur lors de l\'envoi au serveur');
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

// Create mosaic cover image from downloaded images
async function createMosaicCover(imagesFolder, imageCount) {
  // Portrait cover size
  const coverWidth = 600;
  const coverHeight = 800;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = coverWidth;
  canvas.height = coverHeight;
  const ctx = canvas.getContext('2d');

  // Background color
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(0, 0, coverWidth, coverHeight);

  // Calculate grid layout (2 columns for portrait)
  const cols = 2;
  const maxImages = Math.min(imageCount, 8); // Max 8 images (4 rows x 2 cols)
  const rows = Math.ceil(maxImages / cols);

  const cellWidth = coverWidth / cols;
  const cellHeight = coverHeight / rows;

  // Load and draw images
  const loadImage = (blob) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // Draw images in grid
  for (let i = 0; i < maxImages; i++) {
    try {
      const filename = `image_${i + 1}.jpeg`;
      const file = imagesFolder.file(filename) || imagesFolder.file(`image_${i + 1}.jpg`) || imagesFolder.file(`image_${i + 1}.png`);

      if (!file) continue;

      const blob = await file.async('blob');
      const img = await loadImage(blob);

      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * cellWidth;
      const y = row * cellHeight;

      // Calculate scaling to cover cell while maintaining aspect ratio
      const scale = Math.max(cellWidth / img.width, cellHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Center image in cell
      const offsetX = x + (cellWidth - scaledWidth) / 2;
      const offsetY = y + (cellHeight - scaledHeight) / 2;

      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
    } catch (error) {
      console.warn(`Could not load image ${i + 1} for cover:`, error);
    }
  }

  // Add title overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, coverHeight - 100, coverWidth, 100);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Compilation', coverWidth / 2, coverHeight - 60);
  ctx.font = '18px Arial';
  ctx.fillText(`${imageCount} images`, coverWidth / 2, coverHeight - 30);

  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.85);
  });
}
