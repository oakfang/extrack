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
  getCombatState,
  updateAllUsersProperty,
  patchCombatState,
  startNewRound,
  getNextAvailableTick,
} = require("./db");

function usersNamespace() {
  return {
    namespace: "users",
    get: getAllUsers,
    create: upsertUser,
    update: upsertUser,
    del: deleteUser,
  };
}

function teamsNamespace(_client, namespaces) {
  function deleteTeamAndBroadcastUsers(teamId) {
    const shouldFetch = deleteTeam(teamId);
    const users = namespaces.get(usersNamespace);
    io.emit(`${users.namespace}`, {
      origin: null,
      data: users.get(),
    });
    return shouldFetch;
  }
  return {
    namespace: "teams",
    get: getAllTeams,
    create: upsertTeam,
    update: upsertTeam,
    del: deleteTeamAndBroadcastUsers,
  };
}

function combatStateNamespace(client, namespaces) {
  function clearCombatState() {
    updateAllUsersProperty("onslaught", 0);
    const users = namespaces.get(usersNamespace);
    io.emit(`${users.namespace}`, {
      origin: null,
      data: users.get(),
    });
  }

  function startNewCombatRound() {
    updateAllUsersProperty("acted", false);
    const users = namespaces.get(usersNamespace);
    io.emit(`${users.namespace}`, {
      origin: null,
      data: users.get(),
    });
    return startNewRound();
  }

  client.on("combat:syncTick", () => {
    io.emit(`combat:update`, {
      data: patchCombatState({ currentTick: getNextAvailableTick() }),
      origin: null,
    });
  });

  return {
    namespace: "combat",
    get: getCombatState,
    update: patchCombatState,
    del: clearCombatState,
    create: {
      broadcast: true,
      fn: startNewCombatRound,
    },
  };
}

const getProperties = (namespaceMethod) =>
  typeof namespaceMethod === "function"
    ? { fn: namespaceMethod, broadcast: false }
    : namespaceMethod;

io.on("connection", (client) => {
  const namesSpaces = new WeakMap();
  [usersNamespace, teamsNamespace, combatStateNamespace]
    .map((ns) => {
      const nsObject = ns(client, namesSpaces);
      namesSpaces.set(ns, nsObject);
      return nsObject;
    })
    .forEach(({ namespace, get, create, update, del }) => {
      if (get) {
        client.on(`${namespace}:fetch`, () => {
          const { fn, broadcast = false } = getProperties(get);
          (broadcast ? io : client).emit(`${namespace}`, {
            origin: null,
            data: fn(),
          });
        });
      }
      if (create) {
        client.on(`${namespace}:create`, (item) => {
          const { fn, broadcast = false } = getProperties(create);
          (broadcast ? io : client.broadcast).emit(`${namespace}:create`, {
            origin: client.id,
            data: fn(item),
          });
        });
      }
      if (update) {
        client.on(`${namespace}:update`, (item) => {
          const { fn, broadcast = false } = getProperties(update);
          (broadcast ? io : client.broadcast).emit(`${namespace}:update`, {
            origin: client.id,
            data: fn(item),
          });
        });
      }
      if (del) {
        client.on(`${namespace}:delete`, (itemId) => {
          const { fn, broadcast = false } = getProperties(del);
          const updateCombatState = fn(itemId);
          (broadcast ? io : client.broadcast).emit(`${namespace}:delete`, {
            origin: client.id,
            data: itemId,
          });
          if (updateCombatState) {
            const combat = namesSpaces.get(combatStateNamespace);
            io.emit(combat.namespace, {
              origin: null,
              data: getProperties(combat.get).fn(),
            });
          }
        });
      }
    });
});

server.listen(4001, () => console.log("Server up"));
