import { Socket } from 'socket.io';

export interface JwtSocketPayload {
  sub: number | string;
  email: string;
}

export interface AuthenticatedSocket extends Socket {
  data: {
    user: JwtSocketPayload;
    /** Alert IDs of rooms this socket has joined via subscribe:alert */
    alertRooms?: number[];
  };
}
