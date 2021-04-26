import styled from "styled-components";
import { DangerButton } from "./common";

export function Team({ team, deleteTeam }) {
  const onDelete = () => {
    if (window.confirm("Are you sure? This will delete all team users too!")) {
      deleteTeam(team.id);
    }
  };
  return (
    <Container $flag={team.flag}>
      <h3>{team.name}</h3>
      <DangerButton onClick={onDelete}>(X)</DangerButton>
    </Container>
  );
}

const Container = styled.div`
  min-width: 50px;
  min-height: 50px;
  border-radius: 3px;
  border: 1px solid black;
  border-top: 10px solid ${(props) => props.$flag};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
`;
