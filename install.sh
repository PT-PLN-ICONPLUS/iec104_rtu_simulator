#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Check if all required arguments are provided
if [ $# -lt 8 ]; then
  echo "Usage: $0 <image-tag> <fastapi-port> <iec104-port> <fastapi-nodeport> <iec104-nodeport> <react-port> <react-nodeport> <fastapi-host>"
  exit 1
fi

# Assign arguments to variables
IMAGE_TAG=$1
FASTAPI_PORT=$2
IEC104_PORT=$3
FASTAPI_NODEPORT=$4
IEC104_NODEPORT=$5
REACT_PORT=$6
REACT_NODEPORT=$7
FASTAPI_HOST=$8

BACKEND_IMAGE_TAG="iec104-simulator-backend-$IMAGE_TAG"
FRONTEND_IMAGE_TAG="iec104-simulator-frontend-$IMAGE_TAG"
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

echo "Applying Kubernetes configurations with the following parameters:"
echo "  IMAGE_TAG: $IMAGE_TAG"
echo "  FASTAPI_PORT: $FASTAPI_PORT"
echo "  IEC104_PORT: $IEC104_PORT"
echo "  FASTAPI_NODEPORT: $FASTAPI_NODEPORT"
echo "  IEC104_NODEPORT: $IEC104_NODEPORT"
echo "  REACT_PORT: $REACT_PORT"
echo "  REACT_NODEPORT: $REACT_NODEPORT"
echo "  FASTAPI_HOST: $FASTAPI_HOST"

# Export variables for envsubst
export IMAGE_TAG FASTAPI_PORT IEC104_PORT FASTAPI_NODEPORT IEC104_NODEPORT REACT_PORT REACT_NODEPORT FASTAPI_HOST

# Create temporary files with substituted values
BACKEND_CONFIGMAP_TMP=$(mktemp)
BACKEND_DEPLOYMENT_TMP=$(mktemp)
FRONTEND_CONFIGMAP_TMP=$(mktemp)
FRONTEND_DEPLOYMENT_TMP=$(mktemp)

# Substitute environment variables in YAML files
envsubst < ./backend/k8s/configmap.yaml > $BACKEND_CONFIGMAP_TMP
envsubst < ./backend/k8s/deployment.yaml > $BACKEND_DEPLOYMENT_TMP
envsubst < ./frontend/k8s/configmap.yaml > $FRONTEND_CONFIGMAP_TMP
envsubst < ./frontend/k8s/deployment.yaml > $FRONTEND_DEPLOYMENT_TMP

# Apply configurations using the temporary files
kubectl apply -f $BACKEND_CONFIGMAP_TMP
kubectl apply -f $BACKEND_DEPLOYMENT_TMP
kubectl apply -f $FRONTEND_CONFIGMAP_TMP
kubectl apply -f $FRONTEND_DEPLOYMENT_TMP

# Clean up temporary files
rm $BACKEND_CONFIGMAP_TMP $BACKEND_DEPLOYMENT_TMP $FRONTEND_CONFIGMAP_TMP $FRONTEND_DEPLOYMENT_TMP

echo "Installation completed successfully!"