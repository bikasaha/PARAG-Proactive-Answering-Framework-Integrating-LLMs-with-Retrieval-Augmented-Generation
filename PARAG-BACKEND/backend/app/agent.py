from app.retrieval import RetrievalAgent
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv
from types import SimpleNamespace

load_dotenv() 
class QueryAgent:
    def __init__(self):
        """Initialize hybrid agent with OpenAI model."""
        self.settings = SimpleNamespace(**{
            "model_name": "gpt-4o-mini-2024-07-18",
            "embedding_model": "all-MiniLM-L6-v2",
            "db_storage": "milvus_lite",
            "db_path": "Organization_1.db",
            "template_main": """ You are a knowledgeable assistant for organization's cybersecurity policies.
      Use the following pieces of retrieved context to answer the question.
      If you don't know the answer, just say that you don't know.
      Question: {question}
      Context: {context}
      Answer: """
        })

        self.language_model = ChatOpenAI(
            model_name=self.settings.model_name,
            temperature=1,
            api_key=os.getenv("OPENAI_API_KEY", "your-openai-api-key")
        )

        self.retriever = RetrievalAgent(llm=self.language_model, config=self.settings)
        self.dialogue_log = []

    def generate_reply(self, user_input, source_collection, custom_template=None):
        """Generate response using retrieval-augmented generation."""
        response_data = self.retriever.run_graph_retrieval(
            user_input,
            source_collection,
            custom_template if custom_template else self.settings.template_main
        )
        self.dialogue_log.append({
            "query": user_input,
            "context": response_data["context"],
            "response": response_data["answer"]
        })
        return response_data["context"], response_data["answer"]
