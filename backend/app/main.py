from fastapi import FastAPI

app = FastAPI(title="CareerMatch AI")


@app.get("/")
def home():
    return {"message": "CareerMatch AI backend is running"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
