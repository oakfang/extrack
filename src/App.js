import styled from "styled-components";
import { useExTrackerState } from "./engine";
import { UserDialog } from "./UserDialog";
import { AddUserDialog } from "./AddUserDialog";
import { AddTeamDialog } from "./AddTeamDialog";
import { Tick } from "./Tick";
import { Header, Row } from "./common";

export function App() {
  const {
    users,
    updateUser,
    activeUser,
    setActiveUserId,
    ticks,
    usersByInitiative,
    addUser,
    addingUser,
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
  } = useExTrackerState();

  return (
    <Page>
      <UserDialog
        users={users}
        teams={teams}
        currentUser={currentUser}
        activeUser={activeUser}
        setActiveUserId={setActiveUserId}
        setForceCurrentUser={setForceCurrentUser}
        updateUser={updateUser}
        isOutOfOrder={isOutOfOrder}
        removeUser={removeUser}
      />
      <AddTeamDialog
        addingTeam={addingTeam}
        stopAddingTeam={stopAddingTeam}
        addTeam={addTeam}
      />
      <AddUserDialog
        addingUser={addingUser}
        stopAddingUser={stopAddingUser}
        addUser={addUser}
        teams={teams}
      />
      <Header>
        {teams.map((team) => (
          <p key={team.id} style={{ color: team.flag }}>
            {team.name}
          </p>
        ))}
      </Header>
      <MainRuler>
        {ticks.map((tick, idx) => {
          return (
            <Tick
              key={tick}
              tick={tick}
              index={idx}
              isCurrent={currentTick === tick}
              currentUser={currentUser}
              ticksCount={ticks.length}
              tickUsers={usersByInitiative[tick]}
              setActiveUserId={setActiveUserId}
            />
          );
        })}
      </MainRuler>
      <footer>
        <button onClick={startAddingUser}>Add Combatant</button>
        <Row>
          <button onClick={startNewRound}>Start New Round</button>
          <button onClick={clearBattleStats}>Clear Battle Stats</button>
        </Row>
        <button onClick={startAddingTeam}>Add Team</button>
      </footer>
    </Page>
  );
}

const Page = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  footer {
    display: flex;
    justify-content: space-between;
  }
`;

const MainRuler = styled.div`
  position: relative;
  width: 100%;
  height: 30px;
  background-color: darkgray;
  border: 1px solid black;
`;
