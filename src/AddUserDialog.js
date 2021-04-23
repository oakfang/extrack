import { useState } from "react";
import { Dialog } from "@reach/dialog";
import "@reach/dialog/styles.css";
import { Form, stringToNumber, useFormValidity } from "./common";

function AddUserForm({ stopAddingUser, addUser, teams }) {
  const { isValid, formProps } = useFormValidity();
  const [name, setName] = useState("");
  const [joinCombat, setJoinCombat] = useState(0);
  const [team, setTeam] = useState(null);

  function onSubmit(event) {
    event.preventDefault();
    if (!isValid) return;
    addUser({ name, joinCombat, teamId: team });
    stopAddingUser();
  }

  return (
    <Form {...formProps} onSubmit={onSubmit}>
      <h1>Add User</h1>
      <label>
        Name:
        <input
          type="text"
          required
          minLength="1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Join Combat:
        <input
          type="number"
          required
          value={joinCombat}
          onChange={(e) => setJoinCombat(stringToNumber(e.target.value))}
        />
      </label>
      <label>
        Team:
        <select
          value={team ?? ""}
          onChange={(e) => {
            const { value } = e.target;
            setTeam(value || null);
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

      <button type="submit" disabled={!isValid}>
        Add
      </button>
    </Form>
  );
}

export function AddUserDialog(props) {
  return (
    <Dialog
      aria-label="Add user"
      isOpen={props.addingUser}
      onDismiss={props.stopAddingUser}
    >
      <AddUserForm {...props} />
    </Dialog>
  );
}
