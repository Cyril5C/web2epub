// Extension background script
console.log('Web2EPUB extension loaded');

// ===== ERROR HANDLING =====

/**
 * Wrapper to handle errors in async event listeners
 * @param {Function} handler - Async function to wrap
 * @param {string} context - Context name for error logging
 * @returns {Function} Wrapped handler with error handling
 */
function withErrorHandling(handler, context = 'Unknown') {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`Error in ${context}:`, error);

      // Show user notification
      browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('icons/icon-48.png'),
        title: '❌ Erreur Web2EPUB',
        message: error.message || 'Une erreur inattendue s\'est produite'
      });

      // If there's a sendResponse callback, use it
      const sendResponse = args[args.length - 1];
      if (typeof sendResponse === 'function') {
        sendResponse({ success: false, error: error.message });
      }

      throw error; // Re-throw for debugging
    }
  };
}

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

// Show success alert on page
async function showSuccessAlert(tabId, articleCount) {
  await browser.tabs.executeScript(tabId, {
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
            <div style="font-size: 14px; opacity: 0.9; font-weight: normal;">${articleCount} article(s) dans la compilation</div>
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

// Create context menu
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: 'add-to-epub',
    title: 'Ajouter à la compilation EPUB',
    contexts: ['page']
  });
});

// Handle context menu click
browser.contextMenus.onClicked.addListener(withErrorHandling(async (info, tab) => {
  if (info.menuItemId === 'add-to-epub') {
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
      await showSuccessAlert(tab.id, draft.articles.length);
    }
  }
}, 'Context Menu Click'));

// Handle keyboard command (Ctrl+Shift+E / Command+Shift+E)
browser.commands.onCommand.addListener(withErrorHandling(async (command) => {
  if (command === 'add-and-show') {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

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
      await showSuccessAlert(tab.id, draft.articles.length);

      // Note: Cannot open popup from keyboard shortcut in Firefox
      // User will see notification and can click extension icon to see compilation
    }
  }
}, 'Keyboard Command'));

// Handle messages from popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Create async handler
  const handleMessage = withErrorHandling(async () => {
    switch (message.action) {
      case 'exportDraft':
        await handleExportDraft(message.draft);
        return { success: true };

      case 'saveSingleArticle':
        await handleSaveSingleArticle(message.tabId);
        return { success: true };

      case 'addToDraft':
        const count = await handleAddToDraft(message.tabId);
        return { success: true, count };

      default:
        throw new Error(`Unknown action: ${message.action}`);
    }
  }, `Message Handler: ${message.action}`);

  // Execute and send response
  handleMessage().then(sendResponse).catch(error => {
    sendResponse({ success: false, error: error.message });
  });

  return true; // Keep channel open for async response
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

// ===== EPUB GENERATION HELPERS =====

/**
 * Extract the best image source URL from an img element
 * Handles lazy-loading attributes and srcset formats
 * @param {HTMLImageElement} img - The image element
 * @returns {string|null} The best image URL or null
 */
function extractImageSource(img) {
  let src = img.getAttribute('src');

  // Check for lazy-loaded images or placeholder src
  if (!src || src.startsWith('data:')) {
    src = img.getAttribute('data-src') ||
          img.getAttribute('data-lazy-src') ||
          img.getAttribute('data-original') ||
          img.getAttribute('data-srcset') ||
          img.getAttribute('data-src-retina') ||
          img.getAttribute('data-lazy') ||
          img.getAttribute('srcset');  // Also check regular srcset
  }

  // Parse srcset format if present (format: "url1 320w, url2 640w, url3 1024w")
  if (src && (src.includes(',') || src.includes(' '))) {
    // Split by comma to get individual entries
    const entries = src.split(',').map(entry => entry.trim());

    // Parse each entry to extract URL and width descriptor
    const parsed = entries.map(entry => {
      const parts = entry.split(/\s+/);
      return {
        url: parts[0],
        width: parts[1] ? parseInt(parts[1]) : 0
      };
    });

    // Sort by width descending to get the largest image
    parsed.sort((a, b) => b.width - a.width);

    // Take the largest image (or first if no width specified)
    src = parsed[0].url;
  }

  return src;
}

/**
 * Download and process a single image for EPUB
 */
async function downloadImage(img, baseUrl, imagesFolder, imageIndex, imageCount, currentIndex) {
  const src = extractImageSource(img);

  if (!src || src.startsWith('data:')) {
    console.warn(`  ⊘ [${currentIndex}/${imageCount}] Skipped (no valid src)`);
    img.remove();
    return null;
  }

  // Validate URL for security
  if (!isValidUrl(src)) {
    console.error(`  ✗ [${currentIndex}/${imageCount}] Blocked dangerous URL: ${src}`);
    img.remove();
    return null;
  }

  try {
    const imageUrl = new URL(src, baseUrl).href;

    // Double-check the resolved URL
    if (!isValidUrl(imageUrl)) {
      throw new Error('Resolved URL failed security validation');
    }

    console.log(`  [${currentIndex}/${imageCount}] Downloading: ${imageUrl}`);

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('Empty image (0 bytes)');
    }

    const mimeType = blob.type || 'image/jpeg';
    const ext = mimeType.split('/')[1] || 'jpg';
    const filename = `image_${imageIndex}.${ext}`;

    imagesFolder.file(filename, blob);
    img.setAttribute('src', `images/${filename}`);

    console.log(`  ✓ [${currentIndex}/${imageCount}] Saved as ${filename} (${mimeType}, ${(blob.size / 1024).toFixed(1)}KB)`);

    return {
      filename,
      manifestItem: `    <item id="img_${imageIndex}" href="images/${filename}" media-type="${mimeType}"/>`
    };
  } catch (error) {
    console.error(`  ✗ [${currentIndex}/${imageCount}] Failed: ${src}`);
    console.error(`     Reason: ${error.message}`);

    // Remove the entire parent element to avoid empty spaces
    const parent = img.parentElement;
    if (parent && parent.tagName !== 'BODY') {
      parent.remove();
    } else {
      img.remove();
    }

    return null;
  }
}

/**
 * Process all images in an article
 */
async function processArticleImages(article, articleIndex, imagesFolder, startImageIndex) {
  const tempDiv = document.createElement('div');
  // Use sanitizeHtml to prevent XSS when parsing article content
  const sanitizedContent = sanitizeHtml(article.content);
  tempDiv.innerHTML = sanitizedContent;
  const imgElements = tempDiv.querySelectorAll('img');

  console.log(`Processing article ${articleIndex + 1}: "${article.title}" - Found ${imgElements.length} images`);

  const imageManifestItems = [];
  let imageCounter = startImageIndex;
  let failedImages = 0;

  for (let i = 0; i < imgElements.length; i++) {
    const result = await downloadImage(
      imgElements[i],
      article.url || window.location.href,
      imagesFolder,
      imageCounter + 1,
      imgElements.length,
      i + 1
    );

    if (result) {
      imageManifestItems.push(result.manifestItem);
      imageCounter++;
    } else {
      failedImages++;
    }
  }

  // Log summary
  const successCount = imageCounter - startImageIndex;
  if (failedImages > 0) {
    console.warn(`  ⚠ Article ${articleIndex + 1}: ${successCount}/${imgElements.length} images downloaded successfully, ${failedImages} failed`);
  }

  return {
    processedContent: tempDiv.innerHTML,
    imageManifestItems,
    imageCount: imageCounter - startImageIndex,
    failedCount: failedImages,
    totalCount: imgElements.length
  };
}

/**
 * Build chapter XHTML content
 */
function buildChapterXhtml(article) {
  const parts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">',
    '<html xmlns="http://www.w3.org/1999/xhtml">',
    '<head>',
    `  <title>${escapeXml(article.title)}</title>`,
    '  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>',
    '  <style type="text/css">',
    '    img {',
    '      display: block;',
    '      width: 100% !important;',
    '      max-width: 100% !important;',
    '      height: auto;',
    '      margin: 1em 0;',
    '      clear: both;',
    '    }',
    '  </style>',
    '</head>',
    '<body>',
    `  <h1>${escapeXml(article.title)}</h1>`
  ];

  if (article.author) {
    parts.push(`  <p><em>Par ${escapeXml(article.author)}</em></p>`);
  }
  if (article.date) {
    parts.push(`  <p><em>${escapeXml(article.date)}</em></p>`);
  }

  parts.push('  <hr/>', `  ${article.processedContent}`, '</body>', '</html>');

  return parts.join('\n');
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
  const imageManifestItems = [];
  let globalImageCounter = 0;
  let totalFailedImages = 0;
  let totalProcessedImages = 0;

  // Process all articles
  const processedArticles = [];

  for (let articleIndex = 0; articleIndex < draft.articles.length; articleIndex++) {
    const article = draft.articles[articleIndex];

    // Download and embed images for this article
    const imageResult = await processArticleImages(article, articleIndex, imagesFolder, globalImageCounter);

    imageManifestItems.push(...imageResult.imageManifestItems);
    globalImageCounter += imageResult.imageCount;
    totalFailedImages += imageResult.failedCount;
    totalProcessedImages += imageResult.totalCount;

    // Process content
    const cleanedContent = cleanHtmlEntities(imageResult.processedContent);
    const xhtmlSafeContent = enforceXhtmlVoidElements(cleanedContent);

    processedArticles.push({
      ...article,
      processedContent: xhtmlSafeContent,
      chapterId: `chapter_${articleIndex + 1}`
    });
  }

  // Notify user if images failed
  if (totalFailedImages > 0) {
    console.warn(`⚠ EPUB Generation: ${totalFailedImages}/${totalProcessedImages} images failed to download`);
    browser.notifications.create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('icons/icon-48.png'),
      title: '⚠ Attention',
      message: `${totalFailedImages}/${totalProcessedImages} image(s) n'ont pas pu être téléchargée(s). L'EPUB sera généré sans ces images.`
    });
  }

  // Generate cover image with mosaic of article images
  console.log(`Creating cover with ${globalImageCounter} images`);
  let hasCover = false;
  if (globalImageCounter > 0) {
    try {
      const coverBlob = await createMosaicCover(imagesFolder, globalImageCounter, draft.articles);
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
    }
    img {
      width: 100% !important;
      height: auto;
      display: block;
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
    const chapterXhtml = buildChapterXhtml(article);
    oebps.file(`${article.chapterId}.xhtml`, chapterXhtml);
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

  // Extract image URLs from content (sanitize to prevent XSS)
  const tempDiv = document.createElement('div');
  const sanitizedContent = sanitizeHtml(article.content);
  tempDiv.innerHTML = sanitizedContent;
  const imgElements = tempDiv.querySelectorAll('img');

  for (let i = 0; i < imgElements.length; i++) {
    const img = imgElements[i];
    const src = img.getAttribute('src');

    if (src) {
      // Validate URL for security
      if (!isValidUrl(src)) {
        console.warn(`Skipping dangerous URL in article: ${src}`);
        continue;
      }

      try {
        // Convert relative URLs to absolute
        const imageUrl = new URL(src, article.url || window.location.href).href;

        // Double-check resolved URL
        if (!isValidUrl(imageUrl)) {
          console.warn(`Skipping invalid resolved URL: ${imageUrl}`);
          continue;
        }

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

/**
 * Escape XML special characters
 */
function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sanitize HTML content to prevent XSS
 * Strips dangerous tags and attributes while preserving safe content
 */
function sanitizeHtml(html) {
  if (!html) return '';

  const tempDiv = document.createElement('div');
  tempDiv.textContent = ''; // Clear any content first

  // Create a DOM parser for safer HTML parsing
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove dangerous tags
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'link', 'style', 'form', 'input', 'button'];
  dangerousTags.forEach(tag => {
    const elements = doc.querySelectorAll(tag);
    elements.forEach(el => el.remove());
  });

  // Remove dangerous attributes from all elements
  const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'];
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    dangerousAttrs.forEach(attr => {
      if (el.hasAttribute(attr)) {
        el.removeAttribute(attr);
      }
    });
  });

  return doc.body.innerHTML;
}

/**
 * Validate URL to prevent dangerous protocols
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is safe
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;

  // Trim whitespace
  url = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  const lowerUrl = url.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn(`Blocked dangerous URL protocol: ${protocol}`);
      return false;
    }
  }

  // Only allow http, https, and relative URLs
  if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://') || lowerUrl.startsWith('/') || lowerUrl.startsWith('./')) {
    return true;
  }

  // For relative URLs without protocol
  if (!lowerUrl.includes(':')) {
    return true;
  }

  console.warn(`Blocked invalid URL: ${url}`);
  return false;
}

/**
 * Safely set HTML content using textContent when possible
 * @param {HTMLElement} element - Element to set content on
 * @param {string} html - HTML content (will be sanitized)
 */
function safeSetHtml(element, html) {
  const sanitized = sanitizeHtml(html);
  element.innerHTML = sanitized;
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

  // Remove hyperlinks - convert <a> tags to plain text
  const links = cleanDiv.querySelectorAll('a');
  links.forEach(link => {
    const textNode = document.createTextNode(link.textContent);
    link.parentNode.replaceChild(textNode, link);
  });

  // Remove elements containing "Lire aussi", "À lire aussi", "Sur le même sujet", etc.
  const textsToRemove = [
    'article réservé à nos abonnés',
    'lire plus tard',
    'le monde guides d\'achat',
    'le monde jeux'
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
    '.catcher__content',
    '.article-related',
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

  // Remove "Lire aussi |" patterns with following text/links
  // This handles cases like "Lire aussi | Article Title" or "Lire aussi | <link>"
  const allTextNodes = [];
  const walker = document.createTreeWalker(cleanDiv, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while (node = walker.nextNode()) {
    allTextNodes.push(node);
  }

  allTextNodes.forEach(textNode => {
    const text = textNode.textContent;
    // Match "Lire aussi |" or "Lire aussi:" followed by anything
    if (/lire\s+aussi\s*[|:]/i.test(text)) {
      // Remove the entire parent element containing this pattern
      let parent = textNode.parentElement;
      if (parent && parent !== cleanDiv) {
        parent.remove();
      }
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
async function createMosaicCover(imagesFolder, imageCount, articles) {
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

      // Calculate scaling to fit image inside cell (contain mode)
      const scale = Math.min(cellWidth / img.width, cellHeight / img.height);
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

  // Extract unique sources from articles
  var uniqueDomains = {};
  for (var i = 0; i < articles.length; i++) {
    var domain = articles[i].domain || '';
    if (domain) {
      uniqueDomains[domain] = true;
    }
  }

  // Map domains to readable names (same logic as index.html)
  function getSourceName(domain) {
    if (domain.indexOf('lemonde.fr') !== -1) return 'Le Monde';
    if (domain.indexOf('mediapart.fr') !== -1) return 'Mediapart';
    if (domain.indexOf('liberation.fr') !== -1) return 'Libération';
    if (domain.indexOf('lefigaro.fr') !== -1) return 'Le Figaro';
    if (domain.indexOf('leparisien.fr') !== -1) return 'Le Parisien';
    if (domain.indexOf('lexpress.fr') !== -1) return 'L\'Express';
    if (domain.indexOf('nouvelobs.com') !== -1) return 'L\'Obs';
    if (domain.indexOf('slate.fr') !== -1) return 'Slate';
    if (domain.indexOf('huffingtonpost.fr') !== -1) return 'HuffPost';
    if (domain.indexOf('courrierinternational.com') !== -1) return 'Courrier International';
    if (domain.indexOf('francetvinfo.fr') !== -1) return 'France Info';
    if (domain.indexOf('rfi.fr') !== -1) return 'RFI';
    return domain.replace('www.', '');
  }

  var sourcesList = [];
  for (var domain in uniqueDomains) {
    if (uniqueDomains.hasOwnProperty(domain)) {
      sourcesList.push(getSourceName(domain));
    }
  }

  // Generate French date with capitalized day
  var now = new Date();
  var dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  var monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  var dayName = dayNames[now.getDay()];
  var day = now.getDate();
  var monthName = monthNames[now.getMonth()];
  var year = now.getFullYear();

  var frenchDate = dayName + ' ' + day + ' ' + monthName + ' ' + year;

  // Create overlay text - just the source names
  var sourcesText = sourcesList.length > 0 ? sourcesList.join(', ') : 'Articles';

  // Add title overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, coverHeight - 100, coverWidth, 100);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(sourcesText, coverWidth / 2, coverHeight - 60);
  ctx.font = '18px Arial';
  ctx.fillText(frenchDate, coverWidth / 2, coverHeight - 30);

  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.85);
  });
}
