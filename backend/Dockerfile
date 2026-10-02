FROM docker:27.5.1-cli AS docker_cli

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY --from=docker_cli /usr/local/bin/docker /usr/local/bin/docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && groupadd --system app \
    && useradd --system --gid app --home-dir /app app

COPY app ./app
COPY run.py ./run.py
USER app
EXPOSE 5000
CMD ["gunicorn", "--bind=0.0.0.0:5000", "--workers=2", "--timeout=90", "run:app"]