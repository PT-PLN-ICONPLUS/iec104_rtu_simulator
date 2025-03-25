import { io } from 'socket.io-client';

// Get backend host and port from environment variables or use defaults
const backendHost = process.env.FASTAPI_HOST || 'localhost';
const backendPort = process.env.FASTAPI_PORT || '7001';
const socketUrl = `http://${backendHost}:${backendPort}`;

console.log(`Creating socket connection to: ${socketUrl}`);
const socket = io(socketUrl);

socket.on('connect', () => {
  console.log(`Connected to backend socket.io server with ID: ${socket.id}`);
});

socket.on('disconnect', (reason) => {
  console.log(`Disconnected from socket server. Reason: ${reason}`);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

export default socket;