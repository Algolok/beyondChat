require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');
const SerpApi = require('serpapi');

const API_BASE = 'http://localhost:3001/api';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const serpapi = new SerpApi.GoogleSearch({
  api_key: process.env.SERPAPI_API_KEY,
});

async function searchGoogle(query) {
  try {
    const response = await serpapi.json({
      q: query,
      num: 10, // Get more results
    });

    const organicResults = response.organic_results || [];
    const blogLinks = [];

    for (const result of organicResults) {
      const link = result.link;
      // Check if it's a blog or article
      if (link && (link.includes('blog') || link.includes('article') || link.includes('post'))) {
        blogLinks.push(link);
        if (blogLinks.length >= 2) break;
      }
    }

    return blogLinks;
  } catch (error) {
    console.error('Error searching Google:', error.message);
    return [];
  }
}

async function scrapeContent(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    // Remove scripts, styles, etc.
    $('script, style, nav, header, footer, aside').remove();
    const content = $('body').text().trim();
    return content.substring(0, 5000); // Limit content
  } catch (error) {
    console.error('Error scraping content:', error.message);
    return '';
  }
}

async function enhanceArticle(originalArticle, referenceContents) {
  try {
    const prompt = `
    You are an expert content writer. I have an original article and two reference articles from top Google search results.
    Please rewrite the original article to match the formatting, style, and content quality of the reference articles.
    Make it more engaging, professional, and similar in structure.

    Original Article:
    Title: ${originalArticle.title}
    Content: ${originalArticle.content}

    Reference Article 1:
    ${referenceContents[0]}

    Reference Article 2:
    ${referenceContents[1]}

    Please provide the rewritten article with improved formatting and content. At the end, cite the references.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });

    const enhancedContent = completion.choices[0].message.content;

    return enhancedContent + '\n\nReferences:\n1. ' + referenceContents[0].substring(0, 100) + '...\n2. ' + referenceContents[1].substring(0, 100) + '...';
  } catch (error) {
    console.error('Error enhancing article:', error.message);
    return originalArticle.content;
  }
}

async function processArticles() {
  try {
    // Fetch articles
    const response = await axios.get(`${API_BASE}/articles`);
    const articles = response.data;

    for (const article of articles) {
      if (article.updated_content) continue; // Already updated

      console.log('Processing:', article.title);

      // Search Google
      const query = article.title;
      const links = await searchGoogle(query);

      if (links.length < 2) {
        console.log('Not enough links found for', article.title);
        continue;
      }

      // Scrape contents
      const contents = [];
      for (const link of links) {
        const content = await scrapeContent(link);
        contents.push(content);
      }

      // Enhance
      const enhancedContent = await enhanceArticle(article, contents);

      // Update via API
      await axios.put(`${API_BASE}/articles/${article.id}`, {
        title: article.title,
        content: article.content,
        updated_content: enhancedContent,
      });

      console.log('Updated:', article.title);
    }
  } catch (error) {
    console.error('Error processing articles:', error.message);
  }
}

processArticles();