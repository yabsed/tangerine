FROM python:3.11-slim

LABEL org.opencontainers.image.source="https://github.com/yabsed/tangerine"

WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server/carrot ./carrot
COPY server/alembic.ini ./
COPY infra/backup.py ./infra/backup.py

RUN useradd --create-home app
USER app
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "carrot.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*", \
     "--no-access-log", \
     "--ws-max-size", "16384"]
