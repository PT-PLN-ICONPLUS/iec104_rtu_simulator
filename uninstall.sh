#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Check if image tag is provided as an argument
if [ $# -lt 1 ]; then
  echo "Usage: $0 <image-tag> [<fastapi-port> <iec104-port> <fastapi-nodeport> <iec104-nodeport> <react-port> <react-nodeport> <fastapi-host>]"
  echo "Note: Additional parameters are optional for uninstallation but required for proper cleanup"
  exit 1
fi

# Assign arguments to variables
IMAGE_TAG=$1

# Optional parameters - used only for environment variable substitution in files if provided
if [ $# -ge 8 ]; then
  FASTAPI_PORT=$2
  IEC104_PORT=$3
  FASTAPI_NODEPORT=$4
  IEC104_NODEPORT=$5
  REACT_PORT=$6
  REACT_NODEPORT=$7
  FASTAPI_HOST=$8
  
  # Export variables for envsubst
  export IMAGE_TAG FASTAPI_PORT IEC104_PORT FASTAPI_NODEPORT IEC104_NODEPORT REACT_PORT REACT_NODEPORT FASTAPI_HOST
else
  # If not all parameters are provided, just export IMAGE_TAG
  export IMAGE_TAG
fi

BACKEND_IMAGE_TAG="iec104-simulator-backend:$IMAGE_TAG"
FRONTEND_IMAGE_TAG="iec104-simulator-frontend:$IMAGE_TAG"
REGISTRY="10.14.73.59/scada"

echo "Deleting Kubernetes resources..."

# Create temporary files with substituted values if parameters are provided
if [ $# -ge 8 ]; then
  BACKEND_CONFIGMAP_TMP=$(mktemp)
  BACKEND_DEPLOYMENT_TMP=$(mktemp)
  FRONTEND_CONFIGMAP_TMP=$(mktemp)
  FRONTEND_DEPLOYMENT_TMP=$(mktemp)

  # Substitute environment variables in YAML files
  envsubst < ./backend/k8s/configmap.yaml > $BACKEND_CONFIGMAP_TMP
  envsubst < ./backend/k8s/deployment.yaml > $BACKEND_DEPLOYMENT_TMP
  envsubst < ./frontend/k8s/configmap.yaml > $FRONTEND_CONFIGMAP_TMP
  envsubst < ./frontend/k8s/deployment.yaml > $FRONTEND_DEPLOYMENT_TMP

  # Delete using temporary files
  kubectl delete -f $FRONTEND_DEPLOYMENT_TMP || echo "Frontend deployment not found."
  kubectl delete -f $FRONTEND_CONFIGMAP_TMP || echo "Frontend configmap not found."
  kubectl delete -f $BACKEND_DEPLOYMENT_TMP || echo "Backend deployment not found."
  kubectl delete -f $BACKEND_CONFIGMAP_TMP || echo "Backend configmap not found."

  # Clean up temporary files
  rm $BACKEND_CONFIGMAP_TMP $BACKEND_DEPLOYMENT_TMP $FRONTEND_CONFIGMAP_TMP $FRONTEND_DEPLOYMENT_TMP
else
  # Try to delete directly with environment substitution
  envsubst < ./frontend/k8s/deployment.yaml | kubectl delete -f - || echo "Frontend deployment not found."
  envsubst < ./frontend/k8s/configmap.yaml | kubectl delete -f - || echo "Frontend configmap not found."
  envsubst < ./backend/k8s/deployment.yaml | kubectl delete -f - || echo "Backend deployment not found."
  envsubst < ./backend/k8s/configmap.yaml | kubectl delete -f - || echo "Backend configmap not found."
fi

echo "Removing Docker images..."
docker rmi $REGISTRY/$BACKEND_IMAGE_TAG || echo "Backend image not found."
docker rmi $REGISTRY/$FRONTEND_IMAGE_TAG || echo "Frontend image not found."
docker rmi $BACKEND_IMAGE_TAG || echo "Local backend image not found."
docker rmi $FRONTEND_IMAGE_TAG || echo "Local frontend image not found."

echo "Uninstallation completed successfully!"