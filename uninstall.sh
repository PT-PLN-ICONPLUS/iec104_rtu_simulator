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

echo "Deleting Kubernetes resources..."
kubectl delete -f ./frontend/k8s/deployment.yaml || echo "Frontend deployment not found."
kubectl delete -f ./frontend/k8s/configmap.yaml || echo "Frontend configmap not found."
kubectl delete -f ./backend/k8s/deployment.yaml || echo "Backend deployment not found."
kubectl delete -f ./backend/k8s/configmap.yaml || echo "Backend configmap not found."

echo "Removing Docker images..."
docker rmi $REGISTRY/$BACKEND_IMAGE_TAG || echo "Backend image not found."
docker rmi $REGISTRY/$FRONTEND_IMAGE_TAG || echo "Frontend image not found."

echo "Uninstallation completed successfully!"