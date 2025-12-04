#!/bin/bash

# Start Celery worker for background task processing
# Usage: ./start_worker.sh

echo "Starting Celery worker..."
echo "Make sure Redis is running on localhost:6379"

celery -A core.celery_app worker --loglevel=info --reload

