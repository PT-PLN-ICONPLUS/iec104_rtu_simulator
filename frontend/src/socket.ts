import { io } from 'socket.io-client';

const backendHost =
  import.meta.env.VITE_FASTAPI_HOST || window.location.hostname;

const backendPort =
  import.meta.env.VITE_FASTAPI_PORT || 
  (window.location.port ? window.location.port : '30606');
    
const socketUrl = `http://${backendHost}:${backendPort}`;

console.log(`Creating socket connection to: ${socketUrl}`);
const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
  forceNew: true,
  extraHeaders: {
    "Access-Control-Allow-Origin": "*"
  }
});

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