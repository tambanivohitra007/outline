import styled from "styled-components";
import { s } from "@shared/styles";
import Fade from "~/components/Fade";

export const Background = styled(Fade)`
  width: 100vw;
  height: 100%;
  background: ${s("background")};
  display: flex;
`;
