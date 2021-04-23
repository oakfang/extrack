import styled from "styled-components";
import { User } from "./User";

export function Tick({
  tick,
  index,
  ticksCount,
  setActiveUserId,
  isCurrent,
  currentUser,
  tickUsers = [],
}) {
  const leftBy = ((index + 0.5) / ticksCount) * 100;

  return (
    <TickMarker key={tick} $active={isCurrent} style={{ left: `${leftBy}%` }}>
      <TickUsers>
        {tickUsers.map((user) => {
          return (
            <User
              key={user.name}
              isCurrent={currentUser === user.id}
              user={user}
              setActiveUserId={setActiveUserId}
            />
          );
        })}
      </TickUsers>
      <label>{tick}</label>
    </TickMarker>
  );
}

const TickMarker = styled.div`
  position: absolute;
  width: 1px;
  color: ${(props) => (props.$active ? "red" : "black")};
  background-color: currentColor;
  top: 0;
  bottom: 0;

  > label {
    position: absolute;
    top: 100%;
    transform: translateX(-50%);
  }
`;

const TickUsers = styled.div`
  position: absolute;
  bottom: 100%;
  transform: translateX(-50%);
  padding-bottom: 5px;
`;
