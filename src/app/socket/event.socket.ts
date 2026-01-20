/* eslint-disable @typescript-eslint/no-explicit-any */
export const SocketEvents = (socket: any) => {
  // User joins group room
  socket.on('join-group', (groupId: string) => {
    groupId.split(',').forEach((id: string) => {
      socket.join(id.trim());
    });
  });

  // User leaves group room
  socket.on('leave-group', (groupId: string) => {
    socket.leave(groupId.trim());
  });
};
