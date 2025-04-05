# Chatbot with Document Upload and Semantic Search

A React-based chatbot application that allows users to upload documents, processes them in a FastAPI backend, and enables semantic search over the content using embeddings stored in Supabase. The processed text is chunked, embedded with Mistral-Embed, and queried via a chatbot interface.

## Features
- **Document Upload**: Users can upload documents (PDFs, text files, etc.) via a "Feed Me" button.
- **Backend Processing**: FastAPI backend converts documents to text using Docling and preprocesses them with an LLM.
- **Text Chunking**: LLM splits the text into manageable chunks.
- **Embedding Generation**: Mistral-Embed generates embeddings for the chunks.
- **Storage**: Embeddings and text chunks are stored in Supabase.
- **Semantic Search**: User queries trigger semantic searches over the embeddings in Supabase.
- **Streaming Response**: Search results are streamed back to the React frontend for a chatbot-like experience.

## Tech Stack
- **Frontend**: React
- **Backend**: FastAPI
- **Document Processing**: Docling
- **LLM**: Custom LLM for preprocessing and chunking
- **Embedding Model**: Mistral-Embed
- **Database**: Supabase (for storing embeddings and text chunks)

## Prerequisites
- Node.js (v16 or higher)
- Python (v3.9 or higher)
- Supabase account and project setup
- Mistral-Embed API access (or local deployment)

## Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/chatbot-document-search.git
cd chatbot-document-search
```
### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```
The frontend will run on http://localhost:3000.

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
The backend will run on http://localhost:8000.

### 4. Environment Variables
Create a `.env` file in the `backend` directory with the following variables:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
General_LLM_API_KEY=your_general_llm_api_key
MISTRAL_API_KEY=your_mistral_api_key
```
### 5. Supabase Setup
Create a table in Supabase (e.g., documents) with columns:
- id (auto-incrementing)
- text (text)
- embedding (vector type(1024), if supported, or JSON)

### Usage
1. Open your browser and navigate to http://localhost:3000.
2. Click the "Feed Me" button to upload a document (e.g., PDF, text file).
3. Wait for the backend to process the document and store the embeddings in Supabase.
4. Enter a query in the chatbot interface to search the document content.
5. View the response streamed from the backend in real-time.
