from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, SecretStr
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from docling.document_converter import DocumentConverter
from langchain_google_genai.chat_models import ChatGoogleGenerativeAI
from langchain_mistralai.embeddings import MistralAIEmbeddings
from langchain.prompts import ChatPromptTemplate
from tempfile import NamedTemporaryFile
from supabase import create_client

# Initialize FastAPI application
app = FastAPI()
load_dotenv()

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_client = create_client(os.environ.get('Supabase-Url'), os.environ.get('Supabase_Service_Key'))

# Define prompt templates
TEXT_PREPROCESSING_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     '''You are a text preprocessor for an embeddings model. Your task is to convert markdown-formatted text into plain text by removing all markdown syntax and formatting, such as headers, emphasis, lists, tables, and code blocks, emojis. For headers, include the header text as plain text. For links, keep both the link text and the URL as plain text. For images, keep the alt text. For code blocks, include the code as plain text. Ensure that all original textual content, including URLs, is preserved in the output and is free of any markdown-specific characters or structures, so that the embeddings model can generate high-quality embeddings without noise.'''),
    ("user", "Convert the following markdown to plain text: {text}"),
])

DOCUMENT_CHUNKING_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     '''
     You are a text preprocessor for a document chunking model. 
     Your task is to split a long text into chunks of approximately 100 words each and each chunk
     must be separated by a single comma no headings nothing at all just chunks even though last chunk must 
     also have single comma at the end and each chunk must be end with this "]*" 
     except last chunk like last chunk do not has comma and "]*" at end. 
     Ensure that each chunk is a coherent piece of text that makes sense on its own. Do not split 
     sentences or paragraphs in the middle. If a chunk ends in the middle of a sentence or paragraph, 
     include the entire sentence or paragraph in that chunk. 
     You can split the text at natural breaks, such as headings, 
     lists, or sections, but avoid splitting the text in the middle of a list or a section. 
     Your goal is to create chunks that are informative and easy to read, 
     so that the document chunking model can generate high-quality chunks 
     without losing important information and must sure that chunks should not be duplicate at all. 
     These chunks will be used to create embeddings and they will store them in vector database separately. So, you
     have to create chunks in such a way that they can be used to create embeddings 
     without semantic loss. Because user will ask for questions and everytime the question will
     be looked through these chunks to get the answer, so that is why we have to keep chunks in that
     format that every question can be answered from these chunks.
     '''),
    ("user", "Split the following text into chunks: {text}"),
])

QUERY_ANSWERING_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     '''You are professional question answering model.
     Your task is to answer the question based on the context provided.
     But if you do not find the context relevant to the question
     then you will always respond with "Feed me more documents to answer this question."
     Here is context: {context} and make sure that you always return your response in proper
     markdown format and you do not have to say based on context we do 
     not want to tell user that you are answering on context basis.
     '''),
    ("user", "Answer the following question: {question}"),
])


# Function to convert document to markdown
def convert_document_to_markdown(document_path):
    converter = DocumentConverter()
    result = converter.convert(document_path)
    markdown_text = result.document.export_to_text()
    return markdown_text


# Initialize embeddings and generative models
embeddings_model = MistralAIEmbeddings(
    model='mistral-embed',
    mistral_api_key= SecretStr(os.environ.get('Mistral_Api_Key')),
)

generative_model = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro-exp-03-25",
    google_api_key=SecretStr(os.environ.get('Google_Api_Key')),
)


# Endpoint to upload and process documents
@app.post("/upload_documents")
async def upload_documents(file: UploadFile = File(...)):
    with NamedTemporaryFile(delete=True) as temp_file:
        temp_file.write(await file.read())
        temp_file_path = temp_file.name
        markdown_text = convert_document_to_markdown(temp_file_path)

    # Preprocess text for embeddings
    preprocessing_prompt = TEXT_PREPROCESSING_PROMPT.invoke({"text": markdown_text})
    try:
        plain_text = generative_model.invoke(preprocessing_prompt)
    except:
        raise HTTPException(
            status_code=403,
            detail={"msg": "You have reached your limit."}
        )

    # Split text into chunks
    chunking_prompt = DOCUMENT_CHUNKING_PROMPT.invoke({"text": plain_text.content})
    try:
        chunks_string = generative_model.invoke(chunking_prompt)
    except:
        raise HTTPException(
            status_code=403,
            detail={"msg": "You have reached your limit."}
        )

    # Store chunks and embeddings in Supabase
    for chunk in chunks_string.content.split("]*,"):
        chunk_embedding = embeddings_model.embed_query(chunk)
        supabase_client.table('documents').insert({'text': chunk, 'embeddings': chunk_embedding}).execute()


# Define query request model
class QueryRequest(BaseModel):
    query: str


# Endpoint to handle user queries
@app.post("/query")
async def handle_query(request: QueryRequest):
    query_embedding = embeddings_model.embed_query(request.query)
    response = supabase_client.rpc('match_documents', {'query_embedding': query_embedding}).execute()

    # Generate response based on query
    answering_prompt = QUERY_ANSWERING_PROMPT.invoke({"context": response.data[0]['text'], "question": request.query})
    response_stream = generative_model.stream(answering_prompt)

    # Stream the response
    async def stream_response():
        for chunk in response_stream:
            yield chunk.content

    return StreamingResponse(stream_response(), media_type="text/event-stream")


