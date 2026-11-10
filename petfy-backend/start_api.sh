#!/bin/bash
cd /home/petfycom/backend
source /home/petfycom/virtualenv/backend/3.10/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000