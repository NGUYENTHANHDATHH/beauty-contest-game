
import { io, Socket } from 'socket.io-client';

// IMPORTANT: Replace with your server's public URL when deploying
const SERVER_URL = 'http://localhost:4000';

class SocketService {
  public socket: Socket;

  constructor() {
    this.socket = io(SERVER_URL, {
        transports: ['websocket'],
        autoConnect: false,
    });
  }
}

const socket = new SocketService().socket;
export default socket;
