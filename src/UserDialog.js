import { useState, useRef } from "react";
import styled from "styled-components";
import immer from "immer";
import { Dialog } from "@reach/dialog";
import "@reach/dialog/styles.css";
import { Attack, AttackForm } from "./AttackForm";
import { Form, Footer, Row, Col, stringToNumber, DangerButton } from "./common";

const ANIMA_LEVELS = ["Dim", "Glowing", "Burning", "Bonfire"];

function UserDialogForm({
  activeUser,
  updateUser,
  setActiveUserId,
  currentUser,
  users,
  setForcedCurrentUserId,
  isOutOfOrder,
  teams,
  removeUser,
  findNextTick,
}) {
  const didStartAsForced = useRef(isOutOfOrder);
  const [attack, setAttack] = useState(Attack.None);
  if (!activeUser) return null;

  let attacksSection = null;
  if (currentUser?.id === activeUser.id) {
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
            users={Object.values(users)}
            activeUser={activeUser}
            updateUser={updateUser}
            stopAttacking={() => setAttack(Attack.None)}
          />
        </Dialog>
      </label>
    );
  }

  const { anima = 0 } = activeUser;

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
              Anima level:
              <RadioGroup>
                {ANIMA_LEVELS.map((level, idx) => {
                  return (
                    <label key={level}>
                      <input
                        type="radio"
                        name="anima"
                        value={idx}
                        checked={anima === idx}
                        onChange={(e) => {
                          const { value } = e.target;
                          updateUser(
                            immer(activeUser, (draft) => {
                              draft.anima = parseInt(value);
                            })
                          );
                        }}
                      />
                      {level}
                    </label>
                  );
                })}
              </RadioGroup>
            </label>
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
                {Object.values(teams).map((team) => (
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
                      draft.damage = Math.max(0, parseInt(value));
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
          {currentUser?.id === activeUser.id ? (
            <button
              type="button"
              onClick={() => {
                if (!didStartAsForced.current) {
                  updateUser(
                    immer(activeUser, (draft) => {
                      draft.acted = true;
                    })
                  );
                }
                setForcedCurrentUserId(null);
                setActiveUserId(null);
                findNextTick();
              }}
            >
              Finish turn
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                didStartAsForced.current = true;
                setForcedCurrentUserId(activeUser.id);
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

const RadioGroup = styled(Row)`
  gap: 15px;
  align-items: center;

  label {
    margin: 0;
  }
`;
