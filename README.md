# BeyondChats Article Scraper and Enhancer

This project implements a full-stack application to scrape, store, enhance, and display blog articles from BeyondChats.

## Project Structure

- `backend/` - Node.js Express server with SQLite database for article storage and CRUD APIs
- `script/` - Node.js script for enhancing articles using Google search and LLM
- `frontend/` - React.js application for displaying articles

## Features

### Phase 1: Article Scraping and Storage
- Scrapes the 5 oldest articles from the last page of https://beyondchats.com/blogs/
- Stores articles in SQLite database
- Provides CRUD REST APIs for articles

### Phase 2: Article Enhancement
- Fetches articles from the API
- Searches article titles on Google using SerpApi
- Scrapes content from the first two blog/article links
- Uses OpenAI GPT-4 to rewrite articles in the style of the top-ranking content
- Updates articles via the API with enhanced content and references

### Phase 3: Frontend Display
- Responsive React application
- Displays both original and enhanced article versions
- Professional UI with clean styling

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm

### API Keys Required
- OpenAI API Key (for article enhancement)
- SerpApi Key (for Google search)

Create a `.env` file in the `script/` directory:
```
OPENAI_API_KEY=your_openai_api_key
SERPAPI_API_KEY=your_serpapi_api_key
```

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install script dependencies:
   ```bash
   cd ../script
   npm install
   ```
4. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```
   The server will run on http://localhost:3001 and automatically scrape articles on startup.

2. Run the enhancement script (after setting up API keys):
   ```bash
   cd script
   npm start
   ```

3. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```
   The frontend will be available at http://localhost:3000

## API Endpoints

- `GET /api/articles` - Get all articles
- `GET /api/articles/:id` - Get a specific article
- `POST /api/articles` - Create a new article
- `PUT /api/articles/:id` - Update an article
- `DELETE /api/articles/:id` - Delete an article

## Architecture Diagram

```
[Frontend (React)] <-> [Backend (Express)] <-> [SQLite Database]
                              ^
                              |
                       [Enhancement Script]
                              |
                    [Google Search API + OpenAI API]
```

## Data Flow

1. Backend scrapes articles from BeyondChats and stores in database
2. Enhancement script fetches articles, searches Google, scrapes references, uses LLM to enhance content
3. Enhanced articles are updated in the database
4. Frontend fetches and displays both original and enhanced versions

## Technologies Used

- **Backend**: Node.js, Express.js, SQLite3, Axios, Cheerio
- **Script**: Node.js, SerpApi, OpenAI API, Cheerio
- **Frontend**: React.js, Axios

## Live Link

**Repository**: https://github.com/Algolok/beyondChat  
**Frontend Demo**: [Deploy to Vercel/Netlify for live demo - see deployment instructions below]

## Notes

- The scraping functionality depends on the structure of the BeyondChats website
- API keys are required for the enhancement script to work
- The application uses SQLite for simplicity; can be upgraded to PostgreSQL/MySQL for production