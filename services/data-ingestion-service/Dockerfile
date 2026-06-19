FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY services/data-ingestion-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared packages
COPY packages /app/packages
RUN pip install -e /app/packages/sc_db
RUN pip install -e /app/packages/sc_events
RUN pip install -e /app/packages/sc_schemas
RUN pip install -e /app/packages/sc_observability

COPY services/data-ingestion-service/src /app/src

ENV PYTHONPATH=/app/src:/app/packages/sc_db:/app/packages/sc_events:/app/packages/sc_schemas:/app/packages/sc_observability

CMD ["python", "src/main.py"]
