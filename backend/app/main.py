from fastapi import FastAPI

app = FastAPI(
    title="VisionInspect AI",
    description="AI-powered manufacturing quality inspection platform",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "VisionInspect AI API is running"
    }