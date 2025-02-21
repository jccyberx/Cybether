#!/bin/bash

echo "Starting application..."

# Wait for database to be ready
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "db" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>/dev/null; do
  echo "Waiting for database connection..."
  sleep 5
done

echo "Database is ready. Initializing..."
python init_db.py

echo "Starting Flask application..."
python -m flask run --host=0.0.0.0