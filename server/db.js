const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const _ = require("lodash/fp");

const adapter = new FileSync("extrack-db.json");
const db = low(adapter);

db.defaults({
  teams: {},
  users: {},
  combatState: { currentTick: null, forcedCurrentUserId: null },
}).write();

function ensureForcedCurrentUserExists() {
  const id = db.get("combatState.forcedCurrentUserId").value();
  if (id && !db.get("users").has(id).value()) {
    db.set("combatState.forcedCurrentUserId", null).write();
    if (!db.get("combatState.currentTick").isNil().value()) {
      db.set(
        "combatState.currentTick",
        module.exports.getNextAvailableTick()
      ).write();
    }
    return true;
  }
}

module.exports.upsertUser = (user) => {
  db.get("users").set(user.id, user).write();
  return user;
};

module.exports.deleteUser = (userId) => {
  db.get("users").unset(userId).write();
  return ensureForcedCurrentUserExists();
};

module.exports.getNextAvailableTick = () => {
  return (
    db.get("users").values().reject("acted").map("initiative").max().value() ??
    null
  );
};

module.exports.upsertTeam = (team) => {
  db.get("teams").set(team.id, team).write();
  return team;
};

module.exports.deleteTeam = (teamId) => {
  db.get("teams").unset(teamId).write();
  db.update("users", _.omitBy(["teamId", teamId])).write();
  return ensureForcedCurrentUserExists();
};

module.exports.getAllUsers = () => db.get("users").value();

module.exports.getAllTeams = () => db.get("teams").value();

module.exports.getCombatState = () => db.get("combatState").value();

module.exports.patchCombatState = (combatState) => {
  db.update("combatState", (current) => ({
    ...current,
    ...combatState,
  })).write();
  return db.get("combatState").value();
};

module.exports.updateAllUsersProperty = (property, value) =>
  db.update("users", _.mapValues(_.update(property, () => value))).write();

module.exports.startNewRound = () => {
  const maxInitiative = db
    .get("users")
    .values()
    .map("initiative")
    .max()
    .value();

  module.exports.updateAllUsersProperty("acted", false);
  return module.exports.patchCombatState({
    currentTick: maxInitiative,
    forcedCurrentUserId: null,
  });
};
