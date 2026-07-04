FROM python:3.11-slim

LABEL maintainer="Chiril Gorbenco <chiril.gorbenco.em@gmail.com>"
LABEL description="Riva-AVM v1 — Automated Valuation Model pentru piata imobiliara Moldova"

# Directorul de lucru
WORKDIR /app

# libgomp1 = runtime OpenMP cerut de LightGBM (altfel: libgomp.so.1 not found)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copiem requirements si instalam dependente (layer separat pentru cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiem codul sursa
COPY src/ ./src/
COPY service/ ./service/
COPY models/ ./models/

# Variabila de mediu pentru directorul modelelor
ENV MODELS_DIR=/app/models

# Pornim serviciul FastAPI — Railway injectează $PORT
CMD ["sh", "-c", "uvicorn service.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
