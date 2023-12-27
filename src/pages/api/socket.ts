import { NextApiResponseServerIo } from "@/lib/types";
import { NextApiRequest } from "next";
import { Server as NetServer } from "http";
import { Server as SocketIoServer } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    const path = `/api/socket`;
    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketIoServer(httpServer, {
      path,
      addTrailingSlash: false,
    });
    io.on("connection", (socket) => {
      socket.on("create-room", (fileId) => {
        socket.join(fileId);
      });
      socket.on("send-changes", (deltas, fileId) => {
        socket.to(fileId).emit("receive-changes", deltas, fileId);
      });
      socket.on("send-cursor-move", (range, fileId, cursorId) => {
        socket.to(fileId).emit("receive-cursor-move", range, fileId, cursorId);
      });
    });
    res.socket.server.io = io;
  }
  res.end();
};

export default ioHandler;
