import { startAuthentication } from "@simplewebauthn/browser";
import { EmailIcon, KeyIcon } from "outline-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import styled from "styled-components";
import { s } from "@shared/styles";
import { Client } from "@shared/types";
import ButtonLarge from "~/components/ButtonLarge";
import InputLarge from "~/components/InputLarge";
import PluginIcon from "~/components/PluginIcon";
import Tooltip from "~/components/Tooltip";
import { client } from "~/utils/ApiClient";
import Desktop from "~/utils/Desktop";
import { getRedirectUrl } from "../urls";
import { CSRF } from "@shared/constants";
import { getCookie } from "tiny-cookie";

type Props = React.ComponentProps<typeof ButtonLarge> & {
  id: string;
  name: string;
  authUrl: string;
  isCreate: boolean;
  onEmailSuccess: (email: string) => void;
  preferOTP: boolean;
};

type AuthState = "initial" | "email" | "code";

function AuthenticationProvider(props: Props) {
  const { t } = useTranslation();
  const [authState, setAuthState] = React.useState<AuthState>("initial");
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const formRef = React.useRef<HTMLFormElement>(null);
  const { isCreate, id, name, authUrl, onEmailSuccess, ...rest } = props;
  const clientType = Desktop.isElectron() ? Client.Desktop : Client.Web;

  const handleChangeEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleSubmitEmail = async (
    event: React.SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (authState === "email" && email) {
      setSubmitting(true);

      try {
        const response = await client.post(event.currentTarget.action, {
          email,
          client: clientType,
          preferOTP: props.preferOTP,
        });

        if (response.redirect) {
          window.location.href = response.redirect;
        } else {
          setSubmitting(false);
          onEmailSuccess?.(email);
        }
      } catch (_err) {
        setSubmitting(false);
      }
    } else {
      setAuthState("email");
    }
  };

  const href = getRedirectUrl(authUrl);

  if (id === "passkeys") {
    const handleSubmitPasskey = async (
      event: React.SyntheticEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      try {
        const resp = await client.post(
          "/passkeys.generateAuthenticationOptions",
          undefined,
          {
            baseUrl: "/auth",
          }
        );
        const { challengeId, ...optionsData } = resp.data;
        const authResp = await startAuthentication(optionsData);

        // Populate hidden form fields with authentication data
        if (formRef.current) {
          const createInputs = (obj: any, prefix = "") => {
            Object.entries(obj).forEach(([key, value]) => {
              const fieldName = prefix ? `${prefix}[${key}]` : key;

              if (value && typeof value === "object" && !Array.isArray(value)) {
                createInputs(value, fieldName);
              } else {
                // Create hidden input for primitive values
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = fieldName;
                input.value = String(value);
                formRef.current?.appendChild(input);
              }
            });
          };

          createInputs({
            ...authResp,
            challengeId,
            [CSRF.fieldName]: getCookie(CSRF.cookieName),
            client: clientType,
          });
        }

        // Submit form natively to let browser handle redirect and cookies
        formRef.current?.submit();
      } catch (err) {
        toast.error(err.message);
      }
    };

    const isDesktop = Desktop.isElectron();
    const button = (
      <ButtonLarge
        type="submit"
        icon={<PluginIcon id={id} color="currentColor" />}
        fullwidth
        disabled={isDesktop}
        {...rest}
      >
        {t("Continue with Passkey")}
      </ButtonLarge>
    );

    return (
      <Wrapper>
        <Form
          ref={formRef}
          method="POST"
          action="/auth/passkeys.verifyAuthentication"
          onSubmit={handleSubmitPasskey}
        >
          {isDesktop ? (
            <Tooltip
              content={t("Passkeys are not supported in the desktop app")}
            >
              {button}
            </Tooltip>
          ) : (
            button
          )}
        </Form>
      </Wrapper>
    );
  }

  if (id === "local-auth") {
    return <LocalAuthForm isCreate={isCreate} {...rest} />;
  }

  if (id === "email") {
    if (isCreate) {
      return null;
    }

    return (
      <Wrapper>
        <Form method="POST" action="/auth/email" onSubmit={handleSubmitEmail}>
          {authState === "email" ? (
            <>
              <InputLarge
                type="email"
                name="email"
                placeholder="me@domain.com"
                value={email}
                onChange={handleChangeEmail}
                disabled={isSubmitting}
                autoFocus
                required
                short
              />
              <ButtonLarge type="submit" disabled={isSubmitting} {...rest}>
                {t("Sign In")} →
              </ButtonLarge>
            </>
          ) : (
            <ButtonLarge type="submit" icon={<EmailIcon />} fullwidth {...rest}>
              {t("Continue with Email")}
            </ButtonLarge>
          )}
        </Form>
      </Wrapper>
    );
  }

  return (
    <ButtonLarge
      onClick={() => (window.location.href = href)}
      icon={<PluginIcon id={id} />}
      fullwidth
      {...rest}
    >
      {t("Continue with {{ authProviderName }}", {
        authProviderName: name,
      })}
    </ButtonLarge>
  );
}

type LocalAuthMode = "login" | "register";

function LocalAuthForm({
  isCreate,
  ...rest
}: {
  isCreate: boolean;
} & Record<string, unknown>) {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState<LocalAuthMode>(
    isCreate ? "register" : "login"
  );
  const [expanded, setExpanded] = React.useState(false);
  const [localEmail, setLocalEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [localName, setLocalName] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // Let the native form POST handle cookies and redirect properly.
    // Only intercept to validate fields or show errors client-side.
    if (!localEmail || !password || (mode === "register" && !localName)) {
      event.preventDefault();
      setError(t("Please fill in all fields"));
      return;
    }
    // Don't disable inputs — the native form POST will navigate away.
    // Disabling inputs before the browser collects form data would
    // cause fields to be excluded from the submission.
  };

  if (!expanded) {
    return (
      <Wrapper>
        <ButtonLarge
          onClick={() => setExpanded(true)}
          icon={<KeyIcon />}
          fullwidth
          {...rest}
        >
          {t("Continue with Password")}
        </ButtonLarge>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <LocalForm
        method="POST"
        action={
          mode === "register"
            ? "/auth/local-auth.register"
            : "/auth/local-auth"
        }
        onSubmit={handleSubmit}
      >
        <input
          type="hidden"
          name={CSRF.fieldName}
          value={getCookie(CSRF.cookieName) || ""}
        />
        {mode === "register" && (
          <InputLarge
            type="text"
            name="name"
            placeholder={t("Full name")}
            value={localName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLocalName(e.target.value)
            }
            required
            autoFocus
          />
        )}
        <InputLarge
          type="email"
          name="email"
          placeholder={t("Email")}
          value={localEmail}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLocalEmail(e.target.value)
          }
          required
          autoFocus={mode === "login"}
        />
        <InputLarge
          type="password"
          name="password"
          placeholder={t("Password")}
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          required
          minLength={8}
        />
        {error && <ErrorText>{error}</ErrorText>}
        <ButtonLarge type="submit" fullwidth>
          {mode === "register"
            ? t("Create Account")
            : t("Sign In")}
        </ButtonLarge>
        <ToggleLink
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login"
            ? t("Don't have an account? Register")
            : t("Already have an account? Sign in")}
        </ToggleLink>
      </LocalForm>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

const LocalForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ErrorText = styled.div`
  color: ${s("danger")};
  font-size: 13px;
  text-align: center;
`;

const ToggleLink = styled.button`
  background: none;
  border: none;
  color: ${s("accent")};
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  padding: 4px;
  margin-top: 4px;

  &:hover {
    text-decoration: underline;
  }
`;

export default AuthenticationProvider;
