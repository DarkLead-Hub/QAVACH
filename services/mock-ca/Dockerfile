FROM python:3.11-slim

WORKDIR /app

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Railway provides PORT env variable)
ENV PORT=8001
EXPOSE $PORT

# Command to run Mock CA
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
