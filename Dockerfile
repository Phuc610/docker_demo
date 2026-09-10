FROM python:3.12-slim

RUN mkdir /home/app

WORKDIR /home/app

COPY /app/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY ./app /home/app

ENV MONGO_URI="mongodb://mongodb:27017"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]