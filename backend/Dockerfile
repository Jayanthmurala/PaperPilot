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

CMD ["python", "start_server.py"]
