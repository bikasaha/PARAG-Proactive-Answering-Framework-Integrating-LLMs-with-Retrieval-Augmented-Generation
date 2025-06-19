from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pymilvus import DataType
from app.database import initialize_database, query_database
from app.processing import extract_text_from_pdf, split_text
from app.embedding import generate_embeddings
from app.agent import QueryAgent

load_dotenv()

app = FastAPI()

# Correct CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Initialize Milvus Lite client with existing database
DB_PATH = "Organization_1.db"
COLLECTION_NAME = "Organization_1"
client = initialize_database(DB_PATH)
agent = QueryAgent()

@app.get("/")
async def root():
    return {"message": "Welcome to the RAG-powered PDF search API!"}

@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF, extract text, and store vectors in Milvus."""
    try:
        text = extract_text_from_pdf(file.file)
        if not text:
            return {"error": "Failed to extract text from PDF."}
        
        text_chunks = split_text(text)
        if not text_chunks:
            return {"error": "No text chunks generated from PDF."}
            
        embeddings = generate_embeddings(text_chunks)
        
        from datetime import datetime
        timestamp = datetime.now().isoformat()
        
        # Check if collection exists, create if needed
        collections = client.list_collections()
        collection_created = False
        
        if COLLECTION_NAME not in collections:
            print(f"Collection {COLLECTION_NAME} doesn't exist. Creating it...")
            client.create_collection(
                collection_name=COLLECTION_NAME,
                dimension=384
            )
            collection_created = True
            print(f"Collection {COLLECTION_NAME} created successfully")
        
        # Get next available ID
        try:
            existing_results = client.query(
                collection_name=COLLECTION_NAME,
                filter="",
                output_fields=["id"],
                limit=10000
            )
            existing_ids = [result["id"] for result in existing_results] if existing_results else []
            next_id = max(existing_ids) + 1 if existing_ids else 0
        except:
            next_id = 0
        
        # Prepare data
        data = []
        for i, chunk in enumerate(text_chunks):
            data.append({
                "id": next_id + i,
                "vector": embeddings[i].tolist(),
                "chunk_text": chunk,
                "filename": file.filename,
                "upload_timestamp": timestamp
            })
        
        print(f"Inserting {len(data)} chunks for {file.filename}")
        result = client.insert(collection_name=COLLECTION_NAME, data=data)
        print(f"Insert result: {result}")
        
        # Create index with proper parameters
        try:
            print("Creating vector index...")
            
            # Prepare index parameters properly
            index_params = client.prepare_index_params()
            index_params.add_index(
                field_name="vector",
                index_type="AUTOINDEX"
            )
            
            client.create_index(
                collection_name=COLLECTION_NAME,
                index_params=index_params
            )
            print("Index created successfully")
            
        except Exception as index_error:
            print(f"Index creation failed: {index_error}")
            # Try alternative simpler approach
            try:
                print("Trying alternative index creation...")
                index_params = client.prepare_index_params()
                index_params.add_index(
                    field_name="vector",
                    index_type="IVF_FLAT",
                    metric_type="L2",
                    params={"nlist": 128}
                )
                
                client.create_index(
                    collection_name=COLLECTION_NAME,
                    index_params=index_params
                )
                print("Alternative index created successfully")
                
            except Exception as alt_error:
                print(f"Alternative index failed: {alt_error}")
                return {"error": f"Failed to create search index: {str(alt_error)}"}
        
        # Test if search works now
        try:
            print("Testing search functionality...")
            test_embedding = embeddings[0].tolist()
            test_search = client.search(
                collection_name=COLLECTION_NAME,
                data=[test_embedding],
                limit=1,
                output_fields=["chunk_text"]
            )
            print("Search test passed - RAG is ready!")
        except Exception as search_error:
            print(f"Search test failed: {search_error}")
            return {"error": f"Upload successful but search failed: {str(search_error)}"}
        
        return {
            "message": f"{file.filename} processed and stored successfully. RAG is ready!",
            "chunks_stored": len(text_chunks),
            "timestamp": timestamp,
            "filename": file.filename,
            "starting_id": next_id,
            "ending_id": next_id + len(text_chunks) - 1,
            "search_ready": True
        }
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return {"error": f"Upload failed: {str(e)}"}

@app.get("/search/")
async def search(query: str):
    """Search the vector database and return relevant text chunks."""
    results = query_database(client, COLLECTION_NAME, query)
    return {"query": query, "results": results}

@app.get("/database/info/")
async def get_database_info():
    """Get information about the database contents."""
    try:
        # Get collection info - for Milvus Lite, this returns a list of strings
        collections = client.list_collections()
        
        # Check if our collection exists
        if COLLECTION_NAME in collections:
            try:
                # Try to get some sample documents
                results = client.query(
                    collection_name=COLLECTION_NAME,
                    filter="",
                    output_fields=["chunk_text"],  # Start with just chunk_text
                    limit=5
                )
                
                return {
                    "collections": collections,
                    "collection_name": COLLECTION_NAME,
                    "total_documents_sampled": len(results),
                    "sample_documents": results
                }
            except Exception as query_error:
                # If query fails, try a simpler approach
                return {
                    "collections": collections,
                    "collection_name": COLLECTION_NAME,
                    "status": "Collection exists but query failed",
                    "query_error": str(query_error)
                }
        else:
            return {
                "collections": collections,
                "error": f"Collection {COLLECTION_NAME} not found"
            }
    except Exception as e:
        return {"error": f"Failed to get database info: {str(e)}"}

@app.get("/database/all-docs/")
async def get_all_documents():
    """Get all documents with their metadata."""
    try:
        # Get ALL documents without limit restrictions
        results = client.query(
            collection_name=COLLECTION_NAME,
            filter="",
            output_fields=["id", "chunk_text", "filename", "upload_timestamp"],
            limit=1000  # Increase this significantly
        )
        
        print(f"Total documents found: {len(results)}")  # Debug log
        
        # Group by filename
        files_info = {}
        for doc in results:
            filename = doc.get("filename", "unknown_file")
            if filename not in files_info:
                files_info[filename] = {
                    "filename": filename,
                    "upload_timestamp": doc.get("upload_timestamp", "unknown"),
                    "chunks": [],
                    "chunk_count": 0,
                    "id_range": {"min": float('inf'), "max": -1}
                }
            
            doc_id = doc.get("id", -1)
            files_info[filename]["chunks"].append({
                "id": doc_id,
                "text_preview": doc.get("chunk_text", "")[:200] + "..." if doc.get("chunk_text", "") else "No text"
            })
            files_info[filename]["chunk_count"] += 1
            
            # Track ID range
            if doc_id != -1:
                files_info[filename]["id_range"]["min"] = min(files_info[filename]["id_range"]["min"], doc_id)
                files_info[filename]["id_range"]["max"] = max(files_info[filename]["id_range"]["max"], doc_id)
        
        # Clean up id_range for display
        for file_info in files_info.values():
            if file_info["id_range"]["min"] == float('inf'):
                file_info["id_range"] = "unknown"
            else:
                file_info["id_range"] = f"{file_info['id_range']['min']}-{file_info['id_range']['max']}"
        
        return {
            "total_documents": len(results),
            "files": list(files_info.values()),
            "all_document_ids": sorted([doc.get("id", -1) for doc in results])  # Show all IDs
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/database/files/")
async def list_uploaded_files():
    """List all uploaded files in the database."""
    try:
        results = client.query(
            collection_name=COLLECTION_NAME,
            filter="",
            output_fields=["filename", "upload_timestamp"],
            limit=1000
        )
        
        # Get unique filenames
        files = {}
        for result in results:
            filename = result.get("filename", "unknown")
            timestamp = result.get("upload_timestamp", "unknown")
            if filename not in files:
                files[filename] = {
                    "filename": filename,
                    "upload_timestamp": timestamp,
                    "chunk_count": 0
                }
            files[filename]["chunk_count"] += 1
        
        return {"files": list(files.values())}
    except Exception as e:
        return {"error": str(e)}

@app.delete("/database/clear/")
async def clear_database():
    """Clear all data from the database."""
    try:
        client.drop_collection(COLLECTION_NAME)
        return {"message": f"Collection {COLLECTION_NAME} cleared successfully"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/rag/")
async def rag_query(query: str):
    """Run a RAG-based query."""
    context, answer = agent.generate_reply(query, COLLECTION_NAME)
    return {"query": query, "context": context, "answer": answer}
