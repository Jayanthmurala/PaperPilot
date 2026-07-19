FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Tesseract is a SYSTEM binary, not a pip package. OCR is a core feature here,
# so the image is broken without it (pytesseract just shells out to this).
RUN apt-get update && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Deps first so this layer caches across code changes
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Local default; Render injects its own $PORT and we must bind to it.
ENV PORT=8000
EXPOSE 8000

# Single worker: the free tiers are memory-tight and OCR/LLM calls are I/O-bound
# (async), so concurrency comes from the event loop, not processes.
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000} --timeout-keep-alive 120 --limit-max-body-size 104857600 --limit-max-line-size 16384"]
