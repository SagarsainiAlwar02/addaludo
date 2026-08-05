let io = null;

export const initSocket = (socketIO) => {
  io = socketIO;

  io.on("connection", (socket) => {
    socket.on("join-open-contests", () => {
      socket.join("open-contests");
    });

    socket.on("join-contest", (contestId) => {
      if (contestId) {
        socket.join(`contest:${contestId}`);
      }
    });

    socket.on("disconnect", () => {});
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

export const emitContestUpdate = (event, data) => {
  if (!io) return;
  io.to("open-contests").emit(event, data);
  if (data?.contestId) {
    io.to(`contest:${data.contestId}`).emit(event, data);
  }
};
