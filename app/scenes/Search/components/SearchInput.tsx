import { SearchIcon } from "outline-icons";
import { transparentize } from "polished";
import * as React from "react";
import styled, { useTheme } from "styled-components";
import { s } from "@shared/styles";
import Flex from "~/components/Flex";

interface Props extends React.HTMLAttributes<HTMLInputElement> {
  name: string;
  defaultValue: string;
}

function SearchInput(
  { defaultValue, ...rest }: Props,
  ref: React.RefObject<HTMLInputElement>
) {
  const theme = useTheme();
  const focusInput = React.useCallback(() => {
    ref.current?.focus();
  }, [ref]);

  React.useEffect(() => {
    // ensure that focus is placed at end of input
    const len = (defaultValue || "").length;
    ref.current?.setSelectionRange(len, len);
    const timeoutId = setTimeout(() => {
      focusInput();
    }, 100); // arbitrary number

    return () => {
      clearTimeout(timeoutId);
    };
  }, [ref, defaultValue, focusInput]);

  return (
    <Wrapper align="center">
      <StyledIcon size={24} color={theme.textTertiary} onClick={focusInput} />
      <StyledInput
        {...rest}
        defaultValue={defaultValue}
        ref={ref}
        spellCheck="false"
        type="search"
        autoFocus
      />
      <Shortcut>esc</Shortcut>
    </Wrapper>
  );
}

const Wrapper = styled(Flex)`
  position: relative;
  margin-bottom: 12px;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 16px 60px 16px 52px;
  font-size: 18px;
  font-weight: 400;
  outline: none;
  border: 1px solid ${s("inputBorder")};
  background: ${s("inputBackground")};
  border-radius: 12px;
  color: ${s("text")};
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &:focus {
    border-color: ${s("accent")};
    box-shadow: 0 0 0 3px ${(props) => transparentize(0.85, props.theme.accent)};
  }

  ::-webkit-search-cancel-button {
    -webkit-appearance: none;
  }
  ::-webkit-input-placeholder {
    color: ${s("placeholder")};
  }
  :-moz-placeholder {
    color: ${s("placeholder")};
  }
  ::-moz-placeholder {
    color: ${s("placeholder")};
  }
  :-ms-input-placeholder {
    color: ${s("placeholder")};
  }
`;

const StyledIcon = styled(SearchIcon)`
  position: absolute;
  left: 16px;
  pointer-events: none;
  opacity: 0.5;
`;

const Shortcut = styled.span`
  position: absolute;
  right: 16px;
  font-size: 12px;
  font-weight: 500;
  color: ${s("textTertiary")};
  background: ${s("backgroundSecondary")};
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid ${s("inputBorder")};
  pointer-events: none;
  user-select: none;
`;

export default React.forwardRef(SearchInput);
