import styled from "styled-components";
import Tooltip from "@reach/tooltip";
import "@reach/tooltip/styles.css";
import { ReactComponent as Flame } from "./flame.svg";
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
        $anima={user.anima}
      >
        {user.anima === 3 && <IconicAnima />}
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

const getAnimaStyle = (anima) => {
  switch (anima) {
    case 1:
      return `
        box-shadow: 0px -5px 13px 2px #ffe000;
      `;
    case 2:
      return `
        box-shadow: 0px -6px 20px 8px #ffe000;
      `;
    // case 3:
    //   return `
    //     &:before {
    //         content: '';
    //         position: absolute;
    //         width: 100%;
    //         height: 100%;
    //         bottom: 0;
    //         left: 0;
    //         background: black;
    //         clip-path: path('M216.02,611.195c5.978,3.178,12.284-3.704,8.624-9.4c-19.866-30.919-38.678-82.947-8.706-149.952 c49.982-111.737,80.396-169.609,80.396-169.609s16.177,67.536,60.029,127.585c42.205,57.793,65.306,130.478,28.064,191.029 c-3.495,5.683,2.668,12.388,8.607,9.349c46.1-23.582,97.806-70.885,103.64-165.017c2.151-28.764-1.075-69.034-17.206-119.851 c-20.741-64.406-46.239-94.459-60.992-107.365c-4.413-3.861-11.276-0.439-10.914,5.413c4.299,69.494-21.845,87.129-36.726,47.386 c-5.943-15.874-9.409-43.33-9.409-76.766c0-55.665-16.15-112.967-51.755-159.531c-9.259-12.109-20.093-23.424-32.523-33.073 c-4.5-3.494-11.023,0.018-10.611,5.7c2.734,37.736,0.257,145.885-94.624,275.089c-86.029,119.851-52.693,211.896-40.864,236.826 C153.666,566.767,185.212,594.814,216.02,611.195z');
    //     }
    //   `;
    default:
      return null;
  }
};

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
  ${(props) => getAnimaStyle(props.$anima)}

  label {
    pointer-events: none;
  }
`;

const StyledFlame = styled(Flame)`
  position: absolute;
  bottom: 0;
  left: 0;
  transform: scale(1.4) translateY(-4px)
    rotate(${(props) => props.$rotate || 0}deg);
  transform-origin: bottom;
  z-index: -1;
  filter: blur(1px) drop-shadow(0px 0px 10px ${(props) => props.$fill});
  opacity: 0.9;
  fill: ${(props) => props.$fill};
`;

const IconicAnima = () => (
  <>
    <StyledFlame $fill="orange" $rotate={-30} />
    <StyledFlame $fill="red" />
    <StyledFlame $fill="yellow" $rotate={30} />
  </>
);
