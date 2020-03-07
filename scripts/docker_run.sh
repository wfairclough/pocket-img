#!/bin/bash

set -e

export GCP_CREDENTIALS_B64=`cat keys/will-does-dev-pocket-img-server-3d3a3ee8e732.json | base64`
export GCP_PROJECT_ID="will-does-dev"
export GCP_BUCKET="pocket-images"
export GCP_BUCKET_REGION="northamerica-northeast1"
export PORT="3000"

docker run -it \
  -p $PORT:$PORT \
  -e GCP_CREDENTIALS_B64=$GCP_CREDENTIALS_B64 \
  -e GCP_PROJECT_ID=$GCP_PROJECT_ID \
  -e GCP_BUCKET=$GCP_BUCKET \
  -e GCP_BUCKET_REGION=$GCP_BUCKET_REGION \
  -e PORT=$PORT \
  pocket-img:latest
