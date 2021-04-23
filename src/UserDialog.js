import styled from "styled-components";
import { useState } from "react";
import immer from "immer";
import { Dialog } from "@reach/dialog";
import "@reach/dialog/styles.css";
import { Attack, AttackForm } from "./AttackForm";
import { Form, Footer, Row, Col, stringToNumber } from "./common";

function UserDialogForm({
  activeUser,
  updateUser,
  setActiveUserId,
  currentUser,
  users,
  setForceCurrentUser,
  isOutOfOrder,
  teams,
  removeUser,
}) {
  const [attack, setAttack] = useState(Attack.None);
  if (!activeUser) return null;

  let attacksSection = null;
  if (currentUser === activeUser.id) {
    attacksSection = (
      <label>
        Attack:
        <button type="button" onClick={() => setAttack(Attack.Withering)}>
          Withering
        </button>
        {activeUser.initiative > 0 && (
          <button type="button" onClick={() => setAttack(Attack.Decisive)}>
            Decisive
          </button>
        )}
        <Dialog
          aria-label="Attack form"
          isOpen={attack !== Attack.None}
          onDismiss={() => setAttack(Attack.None)}
        >
          <AttackForm
            type={attack}
            users={users}
            activeUser={activeUser}
            updateUser={updateUser}
            stopAttacking={() => setAttack(Attack.None)}
          />
        </Dialog>
      </label>
    );
  }

  return (
    <>
      <h1>{activeUser.name}</h1>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          setActiveUserId(null);
        }}
      >
        <Row>
          <Col>
            <label>
              Team:
              <select
                value={activeUser.teamId ?? ""}
                onChange={(e) => {
                  const { value } = e.target;
                  updateUser(
                    immer(activeUser, (draft) => {
                      draft.teamId = value || null;
                    })
                  );
                }}
              >
                <option value="">No team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Damage:
              <input
                type="number"
                value={activeUser.damage ?? 0}
                onChange={(e) => {
                  const { value } = e.target;
                  updateUser(
                    immer(activeUser, (draft) => {
                      draft.damage = value;
                    })
                  );
                }}
              />
            </label>
            <label>
              Initiative:
              <input
                type="number"
                value={activeUser.initiative}
                onChange={(e) => {
                  const { value } = e.target;
                  updateUser(
                    immer(activeUser, (draft) => {
                      draft.initiative = stringToNumber(value);
                    })
                  );
                }}
              />
            </label>
            <label>
              Onslaught ({activeUser.onslaught}):
              <input
                type="range"
                min={-10}
                max={0}
                value={activeUser.onslaught}
                onChange={(e) => {
                  const { value } = e.target;
                  updateUser(
                    immer(activeUser, (draft) => {
                      draft.onslaught = parseInt(value);
                    })
                  );
                }}
              />
            </label>
            {attacksSection}
          </Col>
        </Row>
        <Footer $justify="space-between">
          <DangerButton
            onClick={() => {
              if (window.confirm("Are you sure?")) {
                removeUser(activeUser.id);
              }
            }}
          >
            Remove from play
          </DangerButton>
          {currentUser === activeUser.id ? (
            <button
              type="button"
              onClick={() => {
                if (!isOutOfOrder) {
                  updateUser(
                    immer(activeUser, (draft) => {
                      draft.acted = true;
                    })
                  );
                }
                setForceCurrentUser(null);
                setActiveUserId(null);
              }}
            >
              Finish turn
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setForceCurrentUser(activeUser.id);
              }}
            >
              Force Active
            </button>
          )}
        </Footer>
      </Form>
    </>
  );
}

export function UserDialog(props) {
  return (
    <Dialog
      aria-label="User Details"
      isOpen={!!props.activeUser}
      onDismiss={() => props.setActiveUserId(null)}
    >
      <UserDialogForm {...props} />
    </Dialog>
  );
}

const DangerButton = styled.button.attrs({ type: "button" })`
  background-color: #6d0202;
  color: white;
`;
