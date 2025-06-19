from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter

def extract_text_from_pdf(pdf_file):
    """Extract text from PDF file."""
    try:
        reader = PdfReader(pdf_file)
        text = " ".join([page.extract_text() for page in reader.pages if page.extract_text()])
        return text.strip()
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None

def split_text(text, chunk_size=512, chunk_overlap=50):
    """Split text into smaller chunks for embedding."""
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return text_splitter.split_text(text)
