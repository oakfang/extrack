import styled from "styled-components";
import Tooltip from "@reach/tooltip";
import "@reach/tooltip/styles.css";
import { Team } from "./common";

export function User({ user, setActiveUserId, isCurrent }) {
  return (
    <Tooltip label={user.name}>
      <Container
        tabIndex="0"
        onKeyDown={(e) => {
          if (e.code.toLowerCase() === "enter") {
            e.preventDefault();
            setActiveUserId(user.id);
          }
        }}
        onClick={() => setActiveUserId(user.id)}
        $active={isCurrent}
        $flag={user[Team]?.flag}
      >
        <label>
          {user.name
            .split(" ")
            .map((word) => word[0].toUpperCase())
            .join("")}
        </label>
      </Container>
    </Tooltip>
  );
}

const Container = styled.div`
  padding: 5px;
  background-color: white;
  color: ${(props) => (props.$active ? "red" : "black")};
  border: 1px solid currentColor;
  text-align: center;
  cursor: pointer;
  user-select: none;
  ${(props) =>
    props.$flag &&
    `
    border-left: 3px solid ${props.$flag};
  `}

  label {
    pointer-events: none;
  }
`;
