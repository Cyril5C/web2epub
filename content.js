// Content script for extracting article content
console.log('Web2EPUB content script loaded');

// Listen for messages from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractArticle') {
    try {
      const article = extractArticle();
      sendResponse({ article });
    } catch (error) {
      console.error('Error extracting article:', error);
      sendResponse({ error: error.message });
    }
  }
  return true; // Keep message channel open for async response
});

// Main extraction function
function extractArticle() {
  const url = window.location.href;
  const domain = window.location.hostname;

  console.log('Extracting article from:', domain);

  // Try site-specific extractors first
  let article = null;

  if (domain.includes('lemonde.fr')) {
    article = extractLeMonde();
  } else if (domain.includes('mediapart.fr')) {
    article = extractMediapart();
  } else {
    // Fallback to generic extraction
    article = extractGeneric();
  }

  if (!article || !article.content) {
    throw new Error('Impossible d\'extraire le contenu de l\'article');
  }

  article.url = url;
  article.domain = domain;
  article.extractedAt = new Date().toISOString();

  return article;
}

// Le Monde specific extractor
function extractLeMonde() {
  const article = {
    title: '',
    author: '',
    date: '',
    content: ''
  };

  // Title
  const titleEl = document.querySelector('h1.article__title');
  if (titleEl) {
    article.title = titleEl.textContent.trim();
  }

  // Author
  const authorEl = document.querySelector('.meta__author');
  if (authorEl) {
    article.author = authorEl.textContent.trim();
  }

  // Date
  const dateEl = document.querySelector('.meta__date');
  if (dateEl) {
    article.date = dateEl.textContent.trim();
  }

  // Content
  const contentEl = document.querySelector('.article__content');
  if (contentEl) {
    article.content = cleanContent(contentEl);
  }

  return article;
}

// Mediapart specific extractor
function extractMediapart() {
  const article = {
    title: '',
    author: '',
    date: '',
    content: ''
  };

  // Title
  const titleEl = document.querySelector('h1.title');
  if (titleEl) {
    article.title = titleEl.textContent.trim();
  }

  // Author
  const authorEl = document.querySelector('.author');
  if (authorEl) {
    article.author = authorEl.textContent.trim();
  }

  // Date
  const dateEl = document.querySelector('.published');
  if (dateEl) {
    article.date = dateEl.textContent.trim();
  }

  // Content
  const contentEl = document.querySelector('.content-article');
  if (contentEl) {
    article.content = cleanContent(contentEl);
  }

  return article;
}

// Generic extractor using common patterns
function extractGeneric() {
  const article = {
    title: '',
    author: '',
    date: '',
    content: ''
  };

  // Try to find title
  article.title =
    document.querySelector('h1')?.textContent.trim() ||
    document.querySelector('meta[property="og:title"]')?.content ||
    document.querySelector('title')?.textContent.trim() ||
    'Sans titre';

  // Try to find author
  const authorSelectors = [
    'meta[name="author"]',
    'meta[property="article:author"]',
    '.author',
    '.byline',
    '[itemprop="author"]'
  ];

  for (const selector of authorSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      article.author = el.content || el.textContent.trim();
      if (article.author) break;
    }
  }

  // Try to find date
  const dateSelectors = [
    'meta[property="article:published_time"]',
    'time[datetime]',
    '.date',
    '.published',
    '[itemprop="datePublished"]'
  ];

  for (const selector of dateSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      article.date = el.getAttribute('datetime') || el.content || el.textContent.trim();
      if (article.date) break;
    }
  }

  // Try to find main content using Readability-style logic
  const contentSelectors = [
    'article',
    'main',
    '.article-content',
    '.post-content',
    '.entry-content',
    '#content',
    '.content'
  ];

  let contentEl = null;
  for (const selector of contentSelectors) {
    contentEl = document.querySelector(selector);
    if (contentEl && contentEl.textContent.trim().length > 200) {
      break;
    }
  }

  // Fallback: find the element with the most paragraph text
  if (!contentEl || contentEl.textContent.trim().length < 200) {
    contentEl = findMainContent();
  }

  if (contentEl) {
    article.content = cleanContent(contentEl);
  }

  return article;
}

// Find main content by analyzing paragraph density
function findMainContent() {
  const candidates = document.querySelectorAll('div, article, section');
  let bestCandidate = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const paragraphs = candidate.querySelectorAll('p');
    const textLength = Array.from(paragraphs)
      .map(p => p.textContent.trim().length)
      .reduce((sum, len) => sum + len, 0);

    // Score based on text length and number of paragraphs
    const score = textLength + (paragraphs.length * 100);

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

// Clean and sanitize content
function cleanContent(element) {
  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true);

  // Remove unwanted elements
  const unwantedSelectors = [
    'script',
    'style',
    'iframe',
    'nav',
    'header',
    'footer',
    'aside',
    '.ad',
    '.advertisement',
    '.social-share',
    '.comments',
    '.related-articles',
    '[class*="sidebar"]',
    '[id*="sidebar"]'
  ];

  for (const selector of unwantedSelectors) {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  }

  // Convert to HTML string
  let html = clone.innerHTML;

  // Clean up excessive whitespace
  html = html.replace(/\s+/g, ' ').trim();

  // Ensure images have absolute URLs
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const images = tempDiv.querySelectorAll('img');
  images.forEach(img => {
    if (img.src) {
      img.src = new URL(img.src, window.location.href).href;
    }
    // Remove lazy loading attributes
    img.removeAttribute('loading');
    img.removeAttribute('data-src');
  });

  // Ensure links have absolute URLs
  const links = tempDiv.querySelectorAll('a');
  links.forEach(link => {
    if (link.href) {
      link.href = new URL(link.href, window.location.href).href;
    }
  });

  return tempDiv.innerHTML;
}
