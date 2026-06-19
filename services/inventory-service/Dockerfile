FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install setuptools first
RUN pip install --no-cache-dir setuptools

# Copy shared packages
COPY packages /app/packages
RUN pip install --no-cache-dir \
    /app/packages/sc_events \
    /app/packages/sc_db \
    /app/packages/sc_auth \
    /app/packages/sc_schemas \
    /app/packages/sc_observability

# Copy service requirements
COPY services/inventory-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service source
COPY services/inventory-service .

# Security
RUN addgroup --system appgroup && adduser --system --group appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8001
CMD ["python", "src/main.py"]
