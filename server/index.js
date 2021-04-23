const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const {
  getAllUsers,
  upsertUser,
  deleteUser,
  getAllTeams,
  upsertTeam,
  deleteTeam,
} = require("./db");

const namesspaces = [
  {
    namespace: "users",
    get: getAllUsers,
    create: upsertUser,
    update: upsertUser,
    del: deleteUser,
  },
  {
    namespace: "teams",
    get: getAllTeams,
    create: upsertTeam,
    update: upsertTeam,
    del: deleteTeam,
  },
];

io.on("connection", (client) => {
  namesspaces.forEach(({ namespace, get, create, update, del }) => {
    client.on(`${namespace}:fetch`, () => {
      client.emit(`${namespace}`, {
        origin: null,
        data: get(),
      });
    });
    client.on(`${namespace}:create`, (item) => {
      client.broadcast.emit(`${namespace}:create`, {
        origin: client.id,
        data: create(item),
      });
    });
    client.on(`${namespace}:update`, (item) => {
      client.broadcast.emit(`${namespace}:update`, {
        origin: client.id,
        data: update(item),
      });
    });
    client.on(`${namespace}:delete`, (itemId) => {
      del(itemId);
      client.broadcast.emit(`${namespace}:delete`, {
        origin: client.id,
        data: itemId,
      });
    });
  });
});

server.listen(4001, () => console.log("Server up"));
