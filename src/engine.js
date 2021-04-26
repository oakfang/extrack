import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import _ from "lodash";
import { io } from "socket.io-client";
import { Team } from "./common";

const socket = io();
const connection = new Promise((resolve) => socket.on("connect", resolve));

function createPersistedState(
  key,
  {
    initialValue = {},
    adder = (current, item) => ({ ...current, [item.id]: item }),
    updater = (current, item) => ({ ...current, [item.id]: item }),
    remover = (current, itemId) => _.omit(current, itemId),
  } = {}
) {
  return function useLocalState() {
    const [state, setState] = useState(initialValue);
    const addLocalItem = useCallback(
      (item) => setState((current) => adder(current, item)),
      []
    );
    const updateLocalItem = useCallback(
      (item) => setState((current) => updater(current, item)),
      []
    );
    const deleteLocalItem = useCallback(
      (itemId) => setState((current) => remover(current, itemId)),
      []
    );
    useEffect(() => {
      socket.emit(`${key}:fetch`);
      const mainListener = ({ origin, data }) => {
        if (origin !== socket.id) {
          setState(data);
        }
      };
      socket.on(key, mainListener);

      const createListener = ({ origin, data: item }) => {
        if (origin !== socket.id) {
          addLocalItem(item);
        }
      };
      socket.on(`${key}:create`, createListener);

      const updateListener = ({ origin, data: item }) => {
        if (origin !== socket.id) {
          updateLocalItem(item);
        }
      };
      socket.on(`${key}:update`, updateListener);

      const deleteListener = ({ origin, data: itemId }) => {
        if (origin !== socket.id) {
          deleteLocalItem(itemId);
        }
      };
      socket.on(`${key}:delete`, deleteListener);

      return () => {
        socket.off(key, mainListener);
        socket.off(`${key}:create`, createListener);
        socket.off(`${key}:update`, updateListener);
        socket.off(`${key}:delete`, deleteListener);
      };
    }, [addLocalItem, updateLocalItem, deleteLocalItem]);

    const addItem = async (item) => {
      addLocalItem(item);
      await connection;
      socket.emit(`${key}:create`, item);
    };

    const updateItem = async (item) => {
      updateLocalItem(item);
      await connection;
      socket.emit(`${key}:update`, item);
    };

    const deleteItem = async (item) => {
      deleteLocalItem(item);
      await connection;
      socket.emit(`${key}:delete`, item);
    };

    return [state, setState, { addItem, updateItem, deleteItem }];
  };
}

const useTeamsState = createPersistedState("teams");
const useUsersState = createPersistedState("users");
const useCombatState = createPersistedState("combat", {
  initialValue: {
    currentTick: null,
    forcedCurrentUserId: null,
  },
  adder() {
    return {
      currentTick: null,
      forcedCurrentUserId: null,
    };
  },
  updater(current, patch) {
    return {
      ...current,
      ...patch,
    };
  },
  remover(current) {
    return current;
  },
});

export function useExTrackerState() {
  //#region teams
  const [
    teams,
    ,
    { addItem: createTeam, deleteItem: deleteTeam },
  ] = useTeamsState();
  const addTeam = ({ name, flag }) =>
    createTeam({
      id: uuid(),
      name,
      flag,
    });
  const [addingTeam, setAddingTeam] = useState(false);
  const stopAddingTeam = () => setAddingTeam(false);
  const startAddingTeam = () => setAddingTeam(true);
  //#endregion teams

  //#region users
  const [
    rawUsers,
    ,
    { updateItem: updateUser, addItem: createUser, deleteItem: removeUser },
  ] = useUsersState();
  const addUser = ({ name, joinCombat, teamId }) =>
    createUser({
      id: uuid(),
      name,
      teamId,
      onslaught: 0,
      damage: 0,
      acted: false,
      initiative: joinCombat + 3,
    });
  const users = useMemo(
    () =>
      _.mapValues(rawUsers, (user) => {
        if (!user.teamId) {
          return user;
        }
        return { ...user, [Team]: teams[user.teamId] };
      }),
    [rawUsers, teams]
  );
  const [addingUser, setAddingUser] = useState(false);
  const stopAddingUser = () => setAddingUser(false);
  const startAddingUser = () => setAddingUser(true);
  const [activeUserId, setActiveUserId] = useState(null);
  const activeUser = useMemo(() => users[activeUserId], [users, activeUserId]);
  //#endregion users

  const [
    { currentTick, forcedCurrentUserId },
    ,
    {
      updateItem: updateCombatState,
      addItem: startNewCombatRound,
      deleteItem: clearCombatState,
    },
  ] = useCombatState();
  const setForcedCurrentUserId = useCallback(
    (userId) => updateCombatState({ forcedCurrentUserId: userId }),
    [updateCombatState]
  );
  const usersByInitiative = useMemo(
    () => _.groupBy(Object.values(users), "initiative"),
    [users]
  );
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

  const organicCurrentUserId = useMemo(() => {
    if (currentTick === null) return null;
    return usersByInitiative[currentTick]?.find((user) => !user.acted)?.id;
  }, [currentTick, usersByInitiative]);
  const currentUserId = useMemo(() => {
    if (forcedCurrentUserId) return forcedCurrentUserId;
    return organicCurrentUserId;
  }, [organicCurrentUserId, forcedCurrentUserId]);
  const currentUser = useMemo(() => users[currentUserId], [
    currentUserId,
    users,
  ]);

  const isOutOfOrder = forcedCurrentUserId !== organicCurrentUserId;
  useEffect(() => {
    if (currentUser?.id && !forcedCurrentUserId) {
      setForcedCurrentUserId(currentUser.id);
      updateUser({ ...currentUser, onslaught: 0 });
    }
  }, [currentUser, forcedCurrentUserId, updateUser, setForcedCurrentUserId]);

  // request new combat state
  const clearBattleStats = () => {
    clearCombatState();
  };

  async function findNextTick() {
    await connection;
    socket.emit("combat:syncTick");
  }

  const startNewRound = () => {
    if (currentUserId) {
      if (!window.confirm("Are you sure? There is an active user...")) {
        return;
      }
    }
    startNewCombatRound();
    findNextTick();
  };

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
    currentUserId,
    setForcedCurrentUserId,
    isOutOfOrder,
    addingTeam,
    stopAddingTeam,
    startAddingTeam,
    addTeam,
    teams,
    clearBattleStats,
    removeUser,
    findNextTick,
    deleteTeam,
  };
}
