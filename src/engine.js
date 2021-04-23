import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import _ from "lodash";
import { io } from "socket.io-client";

const socket = io();
const connection = new Promise((resolve) => socket.on("connect", resolve));

function createPersistedState(key) {
  return function useLocalState() {
    const [state, setState] = useState([]);
    useEffect(() => {
      socket.emit(`${key}:fetch`);
      const mainListener = ({ origin, data }) => {
        if (origin !== socket.id) {
          setState(data);
        }
      };
      socket.on(key, mainListener);

      const createListener = ({ origin, data }) => {
        if (origin !== socket.id) {
          setState((current) => current.concat([data]));
        }
      };
      socket.on(`${key}:create`, createListener);

      const updateListener = ({ origin, data }) => {
        if (origin !== socket.id) {
          setState((state) => {
            const index = state.findIndex((u) => u.id === data.id);
            return [...state.slice(0, index), data, ...state.slice(index + 1)];
          });
        }
      };
      socket.on(`${key}:update`, updateListener);

      const deleteListener = ({ origin, data }) => {
        if (origin !== socket.id) {
          setState((state) => {
            return state.filter((item) => item.id !== data);
          });
        }
      };
      socket.on(`${key}:delete`, deleteListener);

      return () => {
        socket.off(key, mainListener);
        socket.off(`${key}:create`, createListener);
        socket.off(`${key}:update`, updateListener);
        socket.off(`${key}:delete`, deleteListener);
      };
    }, []);

    return [state, setState];
  };
}

const useTeamsState = createPersistedState("teams");
const useUsersState = createPersistedState("users");

export function useExTrackerState() {
  const [currentTick, setCurrentTick] = useState(null);
  const [teams, setTeams] = useTeamsState();
  const [addingTeam, setAddingTeam] = useState(false);
  const stopAddingTeam = () => setAddingTeam(false);
  const startAddingTeam = () => setAddingTeam(true);
  const addTeam = ({ name, flag }) => {
    const team = {
      id: uuid(),
      name,
      flag,
    };

    setTeams((teams) => teams.concat([team]));
  };
  const teamById = useMemo(() => _.keyBy(teams, "id"), [teams]);
  const [rawUsers, setUsers] = useUsersState();
  const users = useMemo(
    () =>
      rawUsers.map((user) => {
        if (!user.teamId) {
          return user;
        }
        if (Object.getOwnPropertyDescriptor(user, "team")) {
          return user;
        }
        return Object.defineProperty(user, "team", {
          enumerable: false,
          get() {
            return teamById[user.teamId];
          },
        });
      }),
    [rawUsers, teamById]
  );
  const updateUser = useCallback(
    async (user) => {
      setUsers((users) => {
        const index = users.findIndex((u) => u.id === user.id);
        return [...users.slice(0, index), user, ...users.slice(index + 1)];
      });
      await connection;
      socket.emit("users:update", user);
    },
    [setUsers]
  );
  const [activeUserId, setActiveUserId] = useState(null);
  const activeUser = useMemo(
    () => activeUserId && users.find((user) => user.id === activeUserId),
    [users, activeUserId]
  );
  const [addingUser, setAddingUser] = useState(false);
  const stopAddingUser = () => setAddingUser(false);
  const startAddingUser = () => setAddingUser(true);
  const addUser = async ({ name, joinCombat, teamId }) => {
    const user = {
      id: uuid(),
      name,
      teamId,
      onslaught: 0,
      damage: 0,
      acted: false,
      initiative: joinCombat + 3,
    };

    setUsers((users) => users.concat([user]));
    await connection;
    socket.emit("users:create", user);
  };

  const usersByInitiative = useMemo(() => _.groupBy(users, "initiative"), [
    users,
  ]);
  const initiatives = useMemo(
    () => Object.keys(usersByInitiative).map((init) => parseInt(init)),
    [usersByInitiative]
  );
  const minTick = useMemo(() => Math.min(...initiatives, -5), [initiatives]);
  const maxTick = useMemo(() => Math.max(...initiatives, 25), [initiatives]);
  const ticks = useMemo(() => _.range(minTick, maxTick + 1), [
    minTick,
    maxTick,
  ]);
  const [forceCurrentUser, setForceCurrentUser] = useState(null);
  const organicCurrentUser = useMemo(() => {
    if (currentTick === null) return null;
    return usersByInitiative[currentTick]?.find((user) => !user.acted)?.id;
  }, [currentTick, usersByInitiative]);
  const currentUser = useMemo(() => {
    if (forceCurrentUser) return forceCurrentUser;
    return organicCurrentUser;
  }, [organicCurrentUser, forceCurrentUser]);
  const currentUserObject = useMemo(
    () => currentUser && users.find((user) => user.id === currentUser),
    [currentUser, users]
  );
  useEffect(() => {
    if (!currentUserObject && forceCurrentUser) {
      setForceCurrentUser(null);
    }
  }, [currentUserObject, forceCurrentUser]);
  const isOutOfOrder = forceCurrentUser !== organicCurrentUser;
  useEffect(() => {
    if (currentUser && !forceCurrentUser) {
      setForceCurrentUser(currentUser);
      setUsers((users) => {
        const index = users.findIndex((u) => u.id === currentUser);
        return [
          ...users.slice(0, index),
          { ...users[index], onslaught: 0 },
          ...users.slice(index + 1),
        ];
      });
    }
  }, [currentUser, forceCurrentUser, setUsers]);
  const startNewRound = () => {
    if (currentUser) {
      if (!window.confirm("Are you sure? There is an active user...")) {
        return;
      }
    }
    setForceCurrentUser(null);
    setCurrentTick(Math.max(...initiatives));
    setUsers((users) => users.map((user) => ({ ...user, acted: false })));
  };
  const clearBattleStats = () => {
    setUsers((users) =>
      users.map((user) => ({ ...user, damage: 0, onslaught: 0 }))
    );
  };
  const removeUser = async (userId) => {
    setUsers((users) => users.filter((user) => user.id !== userId));
    await connection;
    socket.emit("users:delete", userId);
  };
  useEffect(() => {
    if (currentTick !== null && !currentUserObject) {
      const availableTicks = Object.entries(usersByInitiative)
        .filter(([, users]) => users.some((user) => !user.acted))
        .map(([init]) => +init);
      if (!availableTicks.length) {
        return setCurrentTick(null);
      }
      setCurrentTick(Math.max(...availableTicks));
    } else if (
      currentUserObject &&
      currentTick !== currentUserObject.initiative
    ) {
      setCurrentTick(currentUserObject.initiative);
    }
  }, [currentTick, currentUserObject, usersByInitiative]);

  return {
    users,
    addingUser,
    addUser,
    updateUser,
    activeUser,
    setActiveUserId,
    ticks,
    usersByInitiative,
    stopAddingUser,
    startAddingUser,
    startNewRound,
    currentTick,
    currentUser,
    setForceCurrentUser,
    isOutOfOrder,
    addingTeam,
    stopAddingTeam,
    startAddingTeam,
    addTeam,
    teams,
    clearBattleStats,
    removeUser,
  };
}
