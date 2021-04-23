const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("extrack-db.json");
const db = low(adapter);

db.defaults({ teams: {}, users: {} }).write();

module.exports.upsertUser = (user) => {
  db.get("users").set(user.id, user).write();
  return user;
};

module.exports.deleteUser = (userId) => {
  db.get("users").unset(userId).write();
};

module.exports.upsertTeam = (team) => {
  db.get("teams").set(team.id, team).write();
  return team;
};

module.exports.deleteTeam = (teamId) => {
  db.get("teams").unset(teamId).write();
};

module.exports.getAllUsers = () => db.get("users").values().value();

module.exports.getAllTeams = () => db.get("teams").values().value();
