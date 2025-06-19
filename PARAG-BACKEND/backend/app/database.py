from pymilvus import MilvusClient

def initialize_database(db_path):
    """Connect to Milvus Lite using an existing database."""
    client = MilvusClient(db_path)
    return client

def query_database(client, collection_name, query_text, top_k=5):
    """Query the vector database and return top results."""
    results = client.search(collection_name, data=query_text, limit=top_k)
    return results
