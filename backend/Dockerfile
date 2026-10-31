FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libatomic1 openssl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir pip --upgrade

COPY pyproject.toml .
RUN pip install --no-cache-dir ".[dev]"

COPY . .

EXPOSE 5000

CMD ["python", "run.py"]
