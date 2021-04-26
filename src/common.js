import { useState, useRef, useEffect } from "react";
import styled from "styled-components";

export function useFormValidity() {
  const formRef = useRef(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(formRef.current?.checkValidity() ?? false);
  }, []);

  const formProps = {
    ref: formRef,
    onChange() {
      setIsValid(formRef.current?.checkValidity() ?? false);
    },
  };

  return {
    isValid,
    formProps,
  };
}

export function stringToNumber(value, negative) {
  const nValue = Math[negative ? "min" : "max"](parseInt(value), 0);
  return Number.isInteger(nValue) ? nValue : 0;
}

export const Form = styled.form`
  display: flex;
  flex-direction: column;

  label {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
`;

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export const Col = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Footer = styled.footer`
  display: flex;
  justify-content: ${(props) => props.$justify ?? "flex-end"};
`;

export const Header = styled.header`
  display: flex;
  justify-content: center;
  gap: 20px;
`;

export const DangerButton = styled.button.attrs({ type: "button" })`
  background-color: #6d0202;
  color: white;
`;

export const Team = Symbol("team");
