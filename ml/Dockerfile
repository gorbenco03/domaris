FROM python:3.11-slim

LABEL maintainer="Chiril Gorbenco <chiril.gorbenco.em@gmail.com>"
LABEL description="Riva-AVM v1 — Automated Valuation Model pentru piata imobiliara Moldova"

# Directorul de lucru
WORKDIR /app

# Copiem requirements si instalam dependente (layer separat pentru cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiem codul sursa
COPY src/ ./src/
COPY service/ ./service/
COPY models/ ./models/

# Port expus
EXPOSE 8001

# Variabila de mediu pentru directorul modelelor
ENV MODELS_DIR=/app/models

# Pornim serviciul FastAPI
CMD ["uvicorn", "service.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
