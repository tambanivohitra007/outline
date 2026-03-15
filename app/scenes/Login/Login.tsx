import find from "lodash/find";
import { observer } from "mobx-react";
import { EmailIcon } from "outline-icons";
import * as React from "react";
import { Trans, useTranslation } from "react-i18next";
import { useLocation, Link, Redirect } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { getCookie, setCookie } from "tiny-cookie";
import { s } from "@shared/styles";
import { Client, UserPreference } from "@shared/types";
import { isPWA } from "@shared/utils/browser";
import { parseDomain } from "@shared/utils/domains";
import type { Config } from "~/stores/AuthStore";
import { AvatarSize } from "~/components/Avatar";
import ButtonLarge from "~/components/ButtonLarge";
import ChangeLanguage from "~/components/ChangeLanguage";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import OutlineIcon from "~/components/Icons/OutlineIcon";
import Input from "~/components/Input";
import LoadingIndicator from "~/components/LoadingIndicator";
import { OneTimePasswordInput } from "~/components/OneTimePasswordInput";
import PageTitle from "~/components/PageTitle";
import TeamLogo from "~/components/TeamLogo";
import Text from "~/components/Text";
import env from "~/env";
import useCurrentUser from "~/hooks/useCurrentUser";
import {
  useLastVisitedPath,
  usePostLoginPath,
} from "~/hooks/useLastVisitedPath";
import useQuery from "~/hooks/useQuery";
import useStores from "~/hooks/useStores";
import Desktop from "~/utils/Desktop";
import isCloudHosted from "~/utils/isCloudHosted";
import { detectLanguage } from "~/utils/language";
import { homePath } from "~/utils/routeHelpers";
import AuthenticationProvider from "./components/AuthenticationProvider";
import { BackButton } from "./components/BackButton";
import { Notices } from "./components/Notices";
import { getRedirectUrl, navigateToSubdomain } from "./urls";
import lazyWithRetry from "~/utils/lazyWithRetry";

const WorkspaceSetup = lazyWithRetry(
  () => import("./components/WorkspaceSetup")
);

type Props = {
  children?: (config?: Config) => React.ReactNode;
  onBack?: () => void;
};

function Login({ children, onBack }: Props) {
  const location = useLocation();
  const query = useQuery();
  const notice = query.get("notice");
  const forceOTP = query.get("forceOTP");

  const { t } = useTranslation();
  const user = useCurrentUser({ rejectOnEmpty: false });
  const { auth } = useStores();
  const { config } = auth;
  const [error, setError] = React.useState(null);
  const [emailLinkSentTo, setEmailLinkSentTo] = React.useState("");
  const isCreate = location.pathname === "/create";
  const rememberLastPath = !!user?.getPreference(
    UserPreference.RememberLastPath
  );
  const [lastVisitedPath] = useLastVisitedPath();
  const [spendPostLoginPath] = usePostLoginPath();

  const handleReset = React.useCallback(() => {
    setEmailLinkSentTo("");
  }, []);
  const handleEmailSuccess = React.useCallback((email) => {
    setEmailLinkSentTo(email);
  }, []);

  const handleGoSubdomain = React.useCallback(async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    await navigateToSubdomain(data.subdomain.toString());
  }, []);

  React.useEffect(() => {
    auth.fetchConfig().catch(setError);
  }, [auth]);

  React.useEffect(() => {
    const entries = Object.fromEntries(query.entries());
    const existing = getCookie("signupQueryParams");

    if (Object.keys(entries).length && !query.get("notice") && !existing) {
      setCookie("signupQueryParams", JSON.stringify(entries));
    }
  }, [query]);

  if (auth.authenticated) {
    const postLoginPath = spendPostLoginPath();
    if (postLoginPath) {
      return <Redirect to={postLoginPath} />;
    }

    if (rememberLastPath && lastVisitedPath !== location.pathname) {
      return <Redirect to={lastVisitedPath} />;
    }

    if (auth.team?.defaultCollectionId) {
      return <Redirect to={`/collection/${auth.team?.defaultCollectionId}`} />;
    }

    return <Redirect to={homePath()} />;
  }

  if (error) {
    return (
      <LoginWrapper>
        <RightPanel>
          <BackButton onBack={onBack} />
          <ChangeLanguage locale={detectLanguage()} />
          <FormContainer>
            <PageTitle title={t("Login")} />
            <StyledHeading centered>{t("Error")}</StyledHeading>
            <Note>
              {t("Failed to load configuration.")}
              {!isCloudHosted && (
                <p>
                  {t(
                    "Check the network requests and server logs for full details of the error."
                  )}
                </p>
              )}
            </Note>
          </FormContainer>
        </RightPanel>
      </LoginWrapper>
    );
  }

  if (!config) {
    return <LoadingIndicator />;
  }

  const isCustomDomain = parseDomain(window.location.origin).custom;

  if (isCloudHosted && isCustomDomain && !config.name) {
    return (
      <LoginWrapper>
        <RightPanel>
          <BackButton onBack={onBack} config={config} />
          <ChangeLanguage locale={detectLanguage()} />
          <FormContainer>
            <PageTitle title={t("Custom domain setup")} />
            <StyledHeading centered>{t("Almost there")}…</StyledHeading>
            <Note>
              {t(
                "Your custom domain is successfully pointing at Outline. To complete the setup process please contact support."
              )}
            </Note>
          </FormContainer>
        </RightPanel>
      </LoginWrapper>
    );
  }

  if (Desktop.isElectron() && notice === "domain-required") {
    return (
      <LoginWrapper>
        <RightPanel>
          <BackButton onBack={onBack} config={config} />
          <ChangeLanguage locale={detectLanguage()} />
          <FormContainer as="form" onSubmit={handleGoSubdomain}>
            <StyledHeading centered>{t("Choose workspace")}</StyledHeading>
            <Note>
              {t(
                "This login method requires choosing your workspace to continue"
              )}
              …
            </Note>
            <Flex>
              <Input
                name="subdomain"
                style={{ textAlign: "right" }}
                placeholder={t("subdomain")}
                pattern="^[a-z\d-]+$"
                required
              >
                <Domain>.getoutline.com</Domain>
              </Input>
            </Flex>
            <ButtonLarge type="submit" fullwidth>
              {t("Continue")}
            </ButtonLarge>
          </FormContainer>
        </RightPanel>
      </LoginWrapper>
    );
  }

  const firstRun =
    config.providers.length === 0 && !isCloudHosted && !config.name;
  const hasMultipleProviders = config.providers.length > 1;
  const defaultProvider = find(
    config.providers,
    (provider) => provider.id === auth.lastSignedIn && !isCreate
  );
  const clientType = Desktop.isElectron() ? Client.Desktop : Client.Web;
  const preferOTP = isPWA || !!forceOTP;

  if (firstRun) {
    return (
      <React.Suspense fallback={null}>
        <WorkspaceSetup onBack={onBack} />
      </React.Suspense>
    );
  }

  if (emailLinkSentTo) {
    return (
      <LoginWrapper>
        <LeftPanel>
          <BrandingContent />
        </LeftPanel>
        <RightPanel>
          <BackButton onBack={onBack} config={config} />
          <FormContainer>
            <PageTitle title={t("Check your email")} />
            <CheckEmailIcon size={38} />
            <StyledHeading centered>{t("Check your email")}</StyledHeading>
            {preferOTP ? (
              <>
                <Note>
                  <Trans
                    defaults="Enter the sign-in code sent to the email <em>{{ emailLinkSentTo }}</em>"
                    values={{ emailLinkSentTo }}
                    components={{ em: <em /> }}
                  />
                  .
                </Note>
                <Form
                  method="POST"
                  action="/auth/email.callback"
                  style={{ width: "100%" }}
                >
                  <input type="hidden" name="email" value={emailLinkSentTo} />
                  <input type="hidden" name="client" value={clientType} />
                  <input type="hidden" name="follow" value="true" />
                  <OneTimePasswordInput name="code" />
                  <br />
                  <ButtonLarge type="submit" fullwidth>
                    {t("Continue")}
                  </ButtonLarge>
                </Form>
              </>
            ) : (
              <>
                <Note>
                  <Trans
                    defaults="A magic sign-in link has been sent to the email <em>{{ emailLinkSentTo }}</em> if an account exists."
                    values={{ emailLinkSentTo }}
                    components={{ em: <em /> }}
                  />
                </Note>
                <br />
              </>
            )}
            <ButtonLarge onClick={handleReset} fullwidth neutral>
              {t("Back to login")}
            </ButtonLarge>
          </FormContainer>
        </RightPanel>
      </LoginWrapper>
    );
  }

  if (
    config.providers.length === 1 &&
    config.providers[0].id === "oidc" &&
    !env.OIDC_DISABLE_REDIRECT &&
    !query.get("notice") &&
    !query.get("logout")
  ) {
    window.location.href = getRedirectUrl(config.providers[0].authUrl);
    return null;
  }

  return (
    <LoginWrapper>
      <LeftPanel>
        <BrandingContent />
      </LeftPanel>
      <RightPanel>
        <BackButton onBack={onBack} config={config} />
        <ChangeLanguage locale={detectLanguage()} />

        <FormContainer gap={12}>
          <PageTitle
            title={config.name ? `${config.name} – ${t("Login")}` : t("Login")}
          />
          <Logo>
            {config.logo && !isCreate ? (
              <TeamLogo size={AvatarSize.XXLarge} src={config.logo} />
            ) : (
              <OutlineIcon size={AvatarSize.XXLarge} />
            )}
          </Logo>
          {isCreate ? (
            <>
              <StyledHeading as="h2" centered>
                {t("Create a workspace")}
              </StyledHeading>
              <Content>
                {t(
                  "Get started by choosing a sign-in method for your new workspace below…"
                )}
              </Content>
            </>
          ) : (
            <>
              <WelcomeText>{t("Welcome back")}</WelcomeText>
              <SubText>
                {t("Sign in to access your knowledge platform")}
              </SubText>
              {children?.(config)}
            </>
          )}
          <Notices />
          {defaultProvider && (
            <React.Fragment key={defaultProvider.id}>
              <AuthenticationProvider
                isCreate={isCreate}
                onEmailSuccess={handleEmailSuccess}
                preferOTP={preferOTP}
                {...defaultProvider}
              />
              {hasMultipleProviders && (
                <>
                  <Note>
                    {t("You signed in with {{ authProviderName }} last time.", {
                      authProviderName: defaultProvider.name,
                    })}
                  </Note>
                  <Or data-text={t("Or")} />
                </>
              )}
            </React.Fragment>
          )}
          {config.providers.map((provider) => {
            if (defaultProvider && provider.id === defaultProvider.id) {
              return null;
            }

            return (
              <AuthenticationProvider
                key={provider.id}
                isCreate={isCreate}
                onEmailSuccess={handleEmailSuccess}
                preferOTP={preferOTP}
                neutral={defaultProvider && hasMultipleProviders}
                {...provider}
              />
            );
          })}
          {isCreate && (
            <Note>
              <Trans>
                Already have an account? Go to <Link to="/">login</Link>.
              </Trans>
            </Note>
          )}
        </FormContainer>
      </RightPanel>
    </LoginWrapper>
  );
}

/**
 * Branding content for the left panel
 */
function BrandingContent() {
  const { t } = useTranslation();

  const values = [
    t("Affordable"),
    t("Comprehensive"),
    t("Personalized"),
    t("Accessible"),
  ];

  return (
    <>
      <BackgroundImage
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=1200&q=80')",
        }}
      />
      <GradientOverlay />
      <DecorativeCircleTop />
      <DecorativeCircleBottom />
      <GhostLogo src="/images/lifestyle-logo.png" alt="" />
      <BrandingInner>
        <BrandingHeader>
          <BrandingTitle>{t("Knowledge Platform")}</BrandingTitle>
          <BrandingSubtitle>
            {t("Lifestyle Medicine & Gospel Medical Evangelism")}
          </BrandingSubtitle>
        </BrandingHeader>
        <BrandingBody>
          <Tagline>
            {t("Transforming Health")}
            <br />
            <TaglineHighlight>{t("Through Lifestyle")}</TaglineHighlight>
          </Tagline>
          <BrandingDescription>
            {t(
              "Evidence-based medicine combined with whole-person care for lasting wellness."
            )}
          </BrandingDescription>
          <ValuePills>
            {values.map((value) => (
              <Pill key={value}>{value}</Pill>
            ))}
          </ValuePills>
        </BrandingBody>
      </BrandingInner>
    </>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const LoginWrapper = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  position: relative;
  display: none;
  width: 50%;
  overflow: hidden;

  @media (min-width: 900px) {
    display: flex;
  }
`;

const BackgroundImage = styled.div`
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
`;

const GradientOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom right,
    rgba(76, 5, 25, 0.95),
    rgba(15, 23, 42, 0.9),
    rgba(2, 6, 23, 0.95)
  );
`;

const DecorativeCircleTop = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 384px;
  height: 384px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  transform: translate(50%, -50%);
`;

const DecorativeCircleBottom = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 256px;
  height: 256px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  transform: translate(-50%, 50%);
`;

const GhostLogo = styled.img`
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  width: 224px;
  height: 224px;
  object-fit: contain;
  opacity: 0.1;
  pointer-events: none;
`;

const BrandingInner = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  color: white;
  width: 100%;
`;

const BrandingHeader = styled.div``;

const BrandingTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
`;

const BrandingSubtitle = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 4px 0 0;
`;

const Tagline = styled.h1`
  font-size: clamp(36px, 4vw, 48px);
  font-weight: 700;
  line-height: 1.15;
  margin: 0 0 24px;
`;

const TaglineHighlight = styled.span`
  color: #fda4af;
`;

const BrandingDescription = styled.p`
  font-size: 20px;
  color: rgba(255, 255, 255, 0.8);
  max-width: 420px;
  line-height: 1.5;
  margin: 0 0 32px;
`;

const BrandingBody = styled.div``;

const ValuePills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const Pill = styled.span`
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
`;

const RightPanel = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${s("background")};
  overflow-y: auto;
`;

const FormContainer = styled(Flex).attrs({
  align: "center",
  justify: "center",
  column: true,
  auto: false,
})`
  user-select: none;
  width: 90%;
  max-width: 380px;
  animation: ${fadeIn} 400ms ease-out;
`;

const Form = styled.form`
  margin: 1em 0;
`;

const WelcomeText = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${s("text")};
  margin: 0;
  text-align: center;
`;

const SubText = styled.p`
  font-size: 15px;
  color: ${s("textTertiary")};
  margin: 0 0 8px;
  text-align: center;
`;

const StyledHeading = styled(Heading)`
  margin: 0;
`;

const Domain = styled.div`
  color: ${s("textSecondary")};
  padding: 0 8px 0 0;
`;

const CheckEmailIcon = styled(EmailIcon)`
  margin-bottom: -1.5em;
`;

const Logo = styled.div`
  margin-bottom: -4px;
`;

const Content = styled(Text)`
  color: ${s("textSecondary")};
  text-align: center;
  margin-top: -8px;
`;

const Note = styled(Text)`
  color: ${s("textTertiary")};
  text-align: center;
  font-size: 14px;
  margin-top: 8px;

  em {
    font-style: normal;
    font-weight: 500;
  }
`;

const Or = styled.hr`
  margin: 1em 0;
  position: relative;
  width: 100%;
  border: 0;
  border-top: 1px solid ${s("divider")};

  &:after {
    content: attr(data-text);
    display: block;
    position: absolute;
    left: 50%;
    transform: translate3d(-50%, -50%, 0);
    text-transform: uppercase;
    font-size: 11px;
    font-weight: 500;
    color: ${s("textTertiary")};
    background: ${s("background")};
    border-radius: 2px;
    padding: 0 4px;
  }
`;

export default observer(Login);
