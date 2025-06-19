from app.database import initialize_database
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain_core.documents import Document
from typing_extensions import List, TypedDict
from langgraph.graph import START, StateGraph
from sentence_transformers import SentenceTransformer

class SessionState(TypedDict):
    query: str
    retrieved_docs: List[Document]
    response: str

class RetrievalWrapper:
    def __init__(self) -> None:
        self.searcher = None
        self.reducer = None
        self.compressed_retriever = None
        self.collection_name = None
        self.prompt_text = None
        self.prompt_template = None

class RetrievalAgent:
    def __init__(self, llm=None, config={}):
        self.llm = llm
        self.config = config
        self.embedder = SentenceTransformer(self.config.embedding_model)
        self.db_handler = self._initialize_storage(self.config.db_storage, self.config.db_path)
        self.workflow_graph = StateGraph(SessionState).add_sequence([self.retrieve_data, self.generate_response])
        self.workflow_graph.add_edge(START, "retrieve_data")
        self.compiled_graph = self.workflow_graph.compile()
        self.wrapper = RetrievalWrapper()

    def _initialize_storage(self, backend, path):
        if backend == "milvus_lite":
            return initialize_database(path)
        elif backend == "milvus":
            from app.database import MilvusDB
            return MilvusDB()
        else:
            raise ValueError("Invalid backend selected.")

    def _set_collection(self, name: str):
        if not name:
            raise ValueError("Collection name is required.")
        if not self.db_handler.has_collection(name):
            raise ValueError(f"Collection '{name}' not found.")
        self.wrapper.collection_name = name

    def _define_prompt(self, prompt_str: str = None):
        if not prompt_str:
            raise ValueError("Prompt definition missing.")
        self.wrapper.prompt_text = prompt_str
        self.wrapper.prompt_template = ChatPromptTemplate.from_template(self.wrapper.prompt_text)

    def _semantic_search(self, query_text):
        if not self.wrapper.collection_name:
            raise ValueError("Collection not set.")
        query_vector = self.embedder.encode([query_text], convert_to_numpy=True)[0]
        results = self.db_handler.search(
            collection_name=self.wrapper.collection_name,
            data=[query_vector],
            limit=5,
            output_fields=["filename", "chunk_text"]
        )
        processed = []
        try:
            for group in results:
                for hit in group:
                    if hit['entity']:
                        chunk = hit['entity'].get("chunk_text")
                        if chunk:
                            processed.append(chunk)
        except Exception as e:
            print(f"Search result processing error: {e}")
        return processed

    def retrieve_data(self, state: SessionState):
        docs = self._semantic_search(state["query"])
        return {"retrieved_docs": docs}

    def generate_response(self, state: SessionState):
        if isinstance(state["retrieved_docs"], list) and all(isinstance(doc, str) for doc in state["retrieved_docs"]):
            context_block = "\n\n".join(state["retrieved_docs"])
        else:
            context_block = "\n\n".join(doc.page_content for doc in state["retrieved_docs"])
        prompt = self.wrapper.prompt_template.invoke({"question": state["query"], "context": context_block})
        answer = self.llm.invoke(prompt)
        return {"response": answer.content}

    def run_graph_retrieval(self, user_query, target_collection, prompt_template):
        self._set_collection(name=target_collection)
        self._define_prompt(prompt_str=prompt_template)
        result = self.compiled_graph.invoke({"query": user_query})
        return {"context": result["retrieved_docs"], "answer": result["response"]}
