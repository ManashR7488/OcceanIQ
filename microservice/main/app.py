from fastapi import FastAPI
from datetime import datetime

app = FastAPI()

@app.get("/")
async def greet():
    return {"message": "Hello! Welcome to the FastAPI microservice."}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "FastAPI Microservice"
    }