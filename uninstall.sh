#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Check if image tag is provided as an argument
if [ $# -lt 1 ]; then
  echo "Usage: $0 <image-tag>"
  exit 1
fi

# Assign arguments to variables
IMAGE_TAG=$1

export IMAGE_TAG

# Define image tags and registry
BACKEND_IMAGE_TAG="iec104-simulator-backend-$IMAGE_TAG"
FRONTEND_IMAGE_TAG="iec104-simulator-frontend-$IMAGE_TAG"
REGISTRY="10.14.73.59/scada"

echo "Deleting Kubernetes resources..."

# Delete Kubernetes resources directly
envsubst < ./frontend/k8s/deployment.yaml | kubectl delete -f - || echo "Frontend deployment not found."
envsubst < ./frontend/k8s/configmap.yaml | kubectl delete -f - || echo "Frontend configmap not found."
envsubst < ./backend/k8s/deployment.yaml | kubectl delete -f - || echo "Backend deployment not found."
envsubst < ./backend/k8s/configmap.yaml | kubectl delete -f - || echo "Backend configmap not found."

echo "Removing Docker images..."
docker rmi $REGISTRY/$BACKEND_IMAGE_TAG || echo "Backend image not found."
docker rmi $REGISTRY/$FRONTEND_IMAGE_TAG || echo "Frontend image not found."
docker rmi $BACKEND_IMAGE_TAG || echo "Local backend image not found."
docker rmi $FRONTEND_IMAGE_TAG || echo "Local frontend image not found."

echo "Uninstallation completed successfully!"