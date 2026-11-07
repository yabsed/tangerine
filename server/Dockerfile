FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY carrot ./carrot
COPY alembic.ini ./
COPY infra/backup.py ./infra/backup.py

RUN useradd --create-home app
USER app
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "carrot.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--proxy-headers", "--forwarded-allow-ips", "*", "--no-access-log", "--ws-max-size", "16384"]
