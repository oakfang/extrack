import { useState } from "react";
import immer from "immer";
import { Form, useFormValidity, Footer, stringToNumber } from "./common";

export const Attack = {
  None: Symbol("no attack"),
  Withering: Symbol("Withering"),
  Decisive: Symbol("Decisive"),
};

export function AttackForm({
  type,
  activeUser,
  updateUser,
  users,
  stopAttacking,
}) {
  const [opponent, setOpponent] = useState("");
  const [damage, setDamage] = useState(0);
  const { formProps, isValid } = useFormValidity();

  if (type === Attack.None) {
    return null;
  }

  function onMiss() {
    const opponentUser = users.find((user) => user.id === opponent);
    updateUser(
      immer(opponentUser, (draft) => {
        draft.onslaught -= 1;
      })
    );
    if (type === Attack.Decisive) {
      updateUser(activeUser, (draft) => {
        if (draft.initiative <= 10) {
          draft.initiative -= 2;
        } else {
          draft.initiative -= 3;
        }
      });
    }
    stopAttacking();
  }
  function onSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!isValid) return;
    const opponentUser = users.find((user) => user.id === opponent);
    updateUser(
      immer(opponentUser, (draft) => {
        if (type === Attack.Withering) {
          draft.initiative -= damage;
        } else {
          draft.damage += damage;
        }
        draft.onslaught -= 1;
      })
    );
    updateUser(
      immer(activeUser, (draft) => {
        if (type === Attack.Decisive) {
          draft.initiative = 3;
          return;
        }
        draft.initiative += damage;
        draft.initiative += 1;
        if (opponentUser.initiative <= damage && opponentUser.initiative > 0) {
          draft.initiative += 5;
        }
      })
    );
    stopAttacking();
  }

  return (
    <>
      <h2>Withering Attack</h2>
      <Form {...formProps} onSubmit={onSubmit}>
        <label>
          Opponent:
          <select
            required
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
          >
            <option value="" disabled>
              Choose opponent
            </option>
            {users
              .filter((user) => user.id !== activeUser.id)
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.onslaught})
                </option>
              ))}
          </select>
        </label>
        <label>
          {type === Attack.Withering ? "Initiative" : "Health"} damage:
          <input
            type="number"
            value={damage}
            onChange={(e) => {
              setDamage(stringToNumber(e.target.value));
            }}
          />
        </label>
        <Footer $justify="space-between">
          <button
            type="button"
            disabled={!isValid || damage > 0}
            onClick={onMiss}
          >
            Miss...
          </button>
          <button disabled={!isValid}>Hit!</button>
        </Footer>
      </Form>
    </>
  );
}
