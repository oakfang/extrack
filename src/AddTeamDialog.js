import { useState } from "react";
import styled from "styled-components";
import { Dialog } from "@reach/dialog";
import "@reach/dialog/styles.css";
import { SketchPicker } from "react-color";
import { Form, useFormValidity } from "./common";

function AddTeamForm({ stopAddingTeam, addTeam }) {
  const { isValid, formProps } = useFormValidity();
  const [flagOpen, setFlagOpen] = useState(false);
  const [name, setName] = useState("");
  const [flag, setFlag] = useState("#fff");

  function onSubmit(event) {
    event.preventDefault();
    if (!isValid) return;
    addTeam({ name, flag });
    stopAddingTeam();
  }

  return (
    <Form {...formProps} onSubmit={onSubmit}>
      <h1>Add Team</h1>
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
        Team Flag:
        <Square
          style={{ "--flag": flag }}
          onClick={() => setFlagOpen(!flagOpen)}
          tabIndex="0"
          onKeyDown={(e) => {
            if (e.code.toLowerCase() === "enter") {
              e.preventDefault();
              setFlagOpen(!flagOpen);
            }
          }}
        />
      </label>
      {flagOpen ? (
        <SketchPicker
          disableAlpha
          color={flag}
          onChange={(color) => setFlag(color.hex)}
        />
      ) : null}

      <button type="submit" disabled={!isValid}>
        Add
      </button>
    </Form>
  );
}

export function AddTeamDialog({ addingTeam, stopAddingTeam, addTeam }) {
  return (
    <Dialog
      aria-label="Add Team"
      isOpen={addingTeam}
      onDismiss={stopAddingTeam}
    >
      <AddTeamForm {...{ stopAddingTeam, addTeam }} />
    </Dialog>
  );
}

const Square = styled.figure`
  background-color: var(--flag);
  border-radius: 3px;
  height: 20px;
  width: 20px;
  border: 1px solid black;
  cursor: pointer;
`;
