# Stage 1: Build
FROM python:3.12-slim as builder

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy shared packages
COPY packages /app/packages
RUN pip install --no-cache-dir --prefix=/install setuptools \
    /app/packages/sc_events \
    /app/packages/sc_db \
    /app/packages/sc_auth \
    /app/packages/sc_schemas \
    /app/packages/sc_observability

# Copy service requirements
COPY services/forecasting-service/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Runtime
FROM python:3.12-slim

WORKDIR /app
COPY --from=builder /install /usr/local
COPY packages /app/packages
COPY services/forecasting-service .

# Security
RUN addgroup --system appgroup && adduser --system --group appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8002
CMD ["python", "src/main.py"]
