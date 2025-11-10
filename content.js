// Content script for extracting article content
console.log('Web2EPUB content script loaded');

// Listen for messages from background script
browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
  } else if (domain.includes('liberation.fr')) {
    article = extractLiberation();
  } else {
    article = extractGeneric();
  }

  // Fallback to generic if site-specific failed
  if ((!article || !article.content) && domain.includes('lemonde.fr')) {
    console.log('Le Monde extractor failed, trying generic...');
    article = extractGeneric();
  }

  if ((!article || !article.content) && domain.includes('liberation.fr')) {
    console.log('Liberation extractor failed, trying generic...');
    article = extractGeneric();
  }

  if (!article || !article.content) {
    throw new Error('Impossible d\'extraire le contenu de l\'article');
  }

  // Ensure we have a title
  if (!article.title || article.title.trim() === '') {
    article.title = document.querySelector('title')?.textContent.trim() || 'Sans titre';
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

  // Title - try multiple selectors
  const titleSelectors = [
    'h1.article__title',
    'h1[itemprop="headline"]',
    'article h1',
    'h1',
    'meta[property="og:title"]'
  ];

  for (const selector of titleSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      article.title = el.content || el.textContent.trim();
      if (article.title) break;
    }
  }

  // Author
  const authorSelectors = [
    '.meta__author',
    '[itemprop="author"]',
    '.author',
    'meta[name="author"]'
  ];

  for (const selector of authorSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      article.author = el.content || el.textContent.trim();
      if (article.author) break;
    }
  }

  // Date
  const dateSelectors = [
    '.meta__date',
    'time[datetime]',
    '[itemprop="datePublished"]',
    'meta[property="article:published_time"]'
  ];

  for (const selector of dateSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      article.date = el.getAttribute('datetime') || el.content || el.textContent.trim();
      if (article.date) break;
    }
  }

  // Content
  const contentSelectors = [
    '.article__content',
    'article .article__paragraph',
    '[itemprop="articleBody"]',
    'article'
  ];

  for (const selector of contentSelectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent.trim().length > 200) {
      article.content = cleanContent(el);
      break;
    }
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

// Liberation specific extractor
function extractLiberation() {
  const article = {
    title: '',
    author: '',
    date: '',
    content: ''
  };

  // Title - try multiple selectors
  const titleSelectors = [
    'h1[itemprop="headline"]',
    'article h1',
    'h1.article-title',
    'h1',
    'meta[property="og:title"]'
  ];

  for (const selector of titleSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      article.title = el.content || el.textContent.trim();
      if (article.title) break;
    }
  }

  // Author
  const authorSelectors = [
    '[itemprop="author"]',
    '.author',
    '.article-author',
    'meta[name="author"]'
  ];

  for (const selector of authorSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      article.author = el.content || el.textContent.trim();
      if (article.author) break;
    }
  }

  // Date
  const dateSelectors = [
    'time[datetime]',
    '[itemprop="datePublished"]',
    'meta[property="article:published_time"]',
    '.article-date'
  ];

  for (const selector of dateSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      article.date = el.getAttribute('datetime') || el.content || el.textContent.trim();
      if (article.date) break;
    }
  }

  // Content - Liberation uses specific class names
  const contentSelectors = [
    '[itemprop="articleBody"]',
    'article .article-body',
    '.article-content',
    'article'
  ];

  for (const selector of contentSelectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent.trim().length > 200) {
      article.content = cleanContent(el);
      break;
    }
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

  // Try to find main content using layered heuristics
  let contentEl = selectBestContentElement();

  // Last resort: fall back to previous paragraph-density approach
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
    const originalSrc =
      img.getAttribute('src') ||
      img.getAttribute('data-src') ||
      img.getAttribute('data-original') ||
      img.getAttribute('data-lazy-src') ||
      img.getAttribute('data-srcset') ||
      img.getAttribute('data-src-retina') ||
      img.getAttribute('data-lazy');

    if (originalSrc) {
      // Handle srcset format (take first URL if multiple)
      const cleanSrc = originalSrc.split(',')[0].split(' ')[0].trim();
      img.setAttribute('src', resolveUrl(cleanSrc));
    }

    // Remove lazy loading attributes and srcset which often breaks EPUB readers
    img.removeAttribute('loading');
    img.removeAttribute('data-src');
    img.removeAttribute('data-original');
    img.removeAttribute('data-lazy-src');
    img.removeAttribute('data-srcset');
    img.removeAttribute('data-src-retina');
    img.removeAttribute('data-lazy');
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
  });

  // Ensure links have absolute URLs
  const links = tempDiv.querySelectorAll('a');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      link.setAttribute('href', resolveUrl(href));
    }
  });

  return tempDiv.innerHTML;
}

function resolveUrl(url) {
  try {
    return new URL(url, window.location.href).href;
  } catch (e) {
    return url;
  }
}
// Choose the most plausible article container using multiple signals
function selectBestContentElement() {
  const prioritySelectors = [
    '[itemprop="articleBody"]',
    '[role="main"] article',
    'article',
    'main article',
    '.article-body',
    '.article__content',
    '.article-content',
    '.post-content',
    '.post__content',
    '.entry-content',
    '.story-body',
    '.content__article-body',
    '#articleBody',
    '#main-content'
  ];

  for (const selector of prioritySelectors) {
    const candidate = document.querySelector(selector);
    if (isValidContentCandidate(candidate)) {
      return candidate;
    }
  }

  const structuralSelectors = ['article', 'section', 'div', 'main'];
  const structuralCandidates = [];

  structuralSelectors.forEach(selector => {
    structuralCandidates.push(
      ...Array.from(document.body.querySelectorAll(selector))
        .filter(isValidContentCandidate)
        .map(element => ({
          element,
          score: scoreContentCandidate(element)
        }))
    );
  });

  structuralCandidates.sort((a, b) => b.score - a.score);
  return structuralCandidates.length ? structuralCandidates[0].element : null;
}

function isValidContentCandidate(element) {
  if (!element) return false;

  const text = element.textContent || '';
  if (text.trim().length < 400) return false;

  if (element.closest('header, footer, nav, aside, form, [role="banner"], [role="contentinfo"]')) {
    return false;
  }

  const className = typeof element.className === 'string' ? element.className : '';
  const classAndId = `${className} ${element.id || ''}`.toLowerCase();
  if (/(comment|promo|related|footer|header|sidebar|subscribe|share|widget)/.test(classAndId)) {
    return false;
  }

  return true;
}

function scoreContentCandidate(element) {
  const textLength = element.textContent.trim().length;
  const paragraphCount = element.querySelectorAll('p').length;
  const headingCount = element.querySelectorAll('h1, h2').length;
  const mediaCount = element.querySelectorAll('img, figure, video').length;
  const linkDensity = getLinkDensity(element);

  let score = textLength * 0.9 + paragraphCount * 120 + headingCount * 40 + mediaCount * 20;
  score += weightFromClassAndId(element);

  if (linkDensity > 0.5) {
    score *= 0.5;
  } else if (linkDensity > 0.25) {
    score *= 0.8;
  }

  return score;
}

function getLinkDensity(element) {
  const textLength = element.textContent.trim().length || 1;
  const linkLength = Array.from(element.querySelectorAll('a'))
    .map(a => a.textContent.trim().length)
    .reduce((sum, len) => sum + len, 0);
  return linkLength / textLength;
}

function weightFromClassAndId(element) {
  const className = typeof element.className === 'string' ? element.className : '';
  const classAndId = `${className} ${element.id || ''}`.toLowerCase();

  const positiveMatches = [
    'article',
    'body',
    'content',
    'entry',
    'main',
    'post',
    'story',
    'text'
  ];

  const negativeMatches = [
    'ad',
    'aside',
    'comment',
    'combx',
    'contact',
    'foot',
    'footer',
    'form',
    'header',
    'menu',
    'nav',
    'promo',
    'related',
    'scroll',
    'share',
    'shopping',
    'sidebar',
    'sponsor',
    'subscribe',
    'tool',
    'widget'
  ];

  let weight = 0;

  positiveMatches.forEach(match => {
    if (classAndId.includes(match)) {
      weight += 200;
    }
  });

  negativeMatches.forEach(match => {
    if (classAndId.includes(match)) {
      weight -= 200;
    }
  });

  return weight;
}
