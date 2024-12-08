#!/bin/bash

echo "Starting application..."
python init_db.py
exec flask run --host=0.0.0.0