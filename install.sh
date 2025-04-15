#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Check if an image tag is provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <image-tag>"
  exit 1
fi

IMAGE_TAG=$1
BACKEND_IMAGE_TAG="iec104-simulator-backend:$IMAGE_TAG"
FRONTEND_IMAGE_TAG="iec104-simulator-frontend:$IMAGE_TAG"
REGISTRY="10.14.73.59/scada"

echo "Building Docker images..."
docker build -t $BACKEND_IMAGE_TAG ./backend/
docker build -t $FRONTEND_IMAGE_TAG ./frontend/

echo "Tagging Docker images..."
docker tag $BACKEND_IMAGE_TAG $REGISTRY/$BACKEND_IMAGE_TAG
docker tag $FRONTEND_IMAGE_TAG $REGISTRY/$FRONTEND_IMAGE_TAG

echo "Pushing Docker images to the registry..."
docker push $REGISTRY/$BACKEND_IMAGE_TAG
docker push $REGISTRY/$FRONTEND_IMAGE_TAG

echo "Applying Kubernetes configurations..."
kubectl apply -f ./backend/k8s/configmap.yaml
kubectl apply -f ./backend/k8s/deployment.yaml
kubectl apply -f ./frontend/k8s/configmap.yaml
kubectl apply -f ./frontend/k8s/deployment.yaml

echo "Installation completed successfully!"