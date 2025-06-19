
# 🔍 PARAG Backend

## 🧾 Overview

The **RAG PDF Search Backend** is a FastAPI-powered backend application that enables **Retrieval-Augmented Generation (RAG)** over security policy PDF documents. Users can upload security policy PDF files, index their content into a vector database, and perform **semantic, intelligent queries** powered by advanced language models and embeddings.

---

## ✨ Features

- 📄 **PDF Upload & Indexing**  
  Extract and index text content from uploaded PDFs.

- 🔍 **Semantic Search**  
  Perform context-aware searches using vector similarity.

- 🤖 **RAG-Powered Querying**  
  Combine retrieval and generation for high-quality responses.

- 🧠 **Advanced Retrieval Logic**  
  Leverages sentence embeddings and LangChain workflows.

- 🔐 **CORS Support**  
  Built-in support for cross-origin resource sharing.

---

## 🧱 Technology Stack

| Component            | Technology                         |
|----------------------|-------------------------------------|
| Framework            | FastAPI                            |
| Vector Database      | Milvus Lite                        |
| Embedding Model      | Sentence Transformers (`all-MiniLM-L6-v2`) |
| Language Model       | OpenAI (`gpt-4o`)                  |
| Retrieval Framework  | LangChain                          |
| Embedding Generator  | Sentence Transformers              |

---

## ⚙️ Prerequisites

- Python 3.10+
- `pip` (Python package manager)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/bikasaha/PARAG-Proactive-Answering-Framework-Integrating-LLMs-with-Retrieval-Augmented-Generation
cd PARAG-Proactive-Answering-Framework-Integrating-LLMs-with-Retrieval-Augmented-Generation/backend
```

### 2. Create a Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
```

### 3. Install Dependencies

```bash
pip install fastapi uvicorn pymilvus sentence-transformers pypdf2 \
            python-multipart python-dotenv langchain openai \
            langgraph langchain_openai
```

---

## 🔐 Configuration

Create a `.env` file in the project root with your OpenAI API key:

```
OPENAI_API_KEY=your-openai-api-key
```


---

## ▶️ Running the Application

Start the backend using:

```bash
uvicorn app.main:app --reload
```

This will launch the API at `http://localhost:8000`.
