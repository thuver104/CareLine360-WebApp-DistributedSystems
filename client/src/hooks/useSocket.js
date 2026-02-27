import { connectSocket, getSocket } from "../socket/socketClient";

export default function useSocket() {
  if (!getSocket()) connectSocket();
  return getSocket();
}
