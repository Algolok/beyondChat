import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${apiUrl}/api/articles`);
      setArticles(response.data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>BeyondChats Articles</h1>
      </header>
      <main>
        {articles.map(article => (
          <article key={article.id} className="article">
            <h2>{article.title}</h2>
            <div className="content">
              <h3>Original Content:</h3>
              <p>{article.original_content}</p>
              {article.updated_content && (
                <>
                  <h3>Updated Content:</h3>
                  <p>{article.updated_content}</p>
                </>
              )}
            </div>
            <a href={article.url} target="_blank" rel="noopener noreferrer">Read Original</a>
          </article>
        ))}
      </main>
    </div>
  );
}

export default App;