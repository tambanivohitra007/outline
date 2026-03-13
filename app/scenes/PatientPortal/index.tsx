import { observer } from "mobx-react";
import { GlobeIcon } from "outline-icons";
import { useTranslation } from "react-i18next";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import Scene from "~/components/Scene";
import Subheading from "~/components/Subheading";
import Text from "~/components/Text";
import styled from "styled-components";
import { s } from "@shared/styles";

function PatientPortal() {
  const { t } = useTranslation();

  return (
    <Scene icon={<GlobeIcon />} title={t("Patient Portal")}>
      <Heading>{t("Patient Portal")}</Heading>
      <Text as="p" size="large">
        {t(
          "A read-only portal for patients to view their assigned condition guides, care plans, and recommended recipes."
        )}
      </Text>

      <Subheading>{t("Features")}</Subheading>
      <FeatureGrid>
        <FeatureCard>
          <FeatureIcon>{"\ud83d\udccb"}</FeatureIcon>
          <FeatureTitle>{t("Condition Summaries")}</FeatureTitle>
          <FeatureDescription>
            {t("Simplified view of condition treatment guides assigned to the patient.")}
          </FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon>{"\ud83d\udcc5"}</FeatureIcon>
          <FeatureTitle>{t("Care Plans")}</FeatureTitle>
          <FeatureDescription>
            {t("Interventions organized as actionable care plan items by NEWSTART+ domains.")}
          </FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon>{"\ud83c\udf3f"}</FeatureIcon>
          <FeatureTitle>{t("Recipe Recommendations")}</FeatureTitle>
          <FeatureDescription>
            {t("Therapeutic recipes linked to the patient\u2019s conditions.")}
          </FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon>{"\ud83c\udfe5"}</FeatureIcon>
          <FeatureTitle>{t("Cerbo EHR Integration")}</FeatureTitle>
          <FeatureDescription>
            {t("Patient data synchronized from Cerbo electronic health records.")}
          </FeatureDescription>
        </FeatureCard>
      </FeatureGrid>

      <SetupNotice>
        <NoticeIcon>{"\u2139\ufe0f"}</NoticeIcon>
        <NoticeText>
          {t("Configure CERBO_API_URL and CERBO_API_KEY environment variables to enable patient data synchronization. Patient authentication uses magic links or Cerbo patient IDs.")}
        </NoticeText>
      </SetupNotice>
    </Scene>
  );
}

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin: 16px 0;
`;

const FeatureCard = styled.div`
  padding: 20px;
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  text-align: center;
`;

const FeatureIcon = styled.div`
  font-size: 32px;
  margin-bottom: 12px;
`;

const FeatureTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 600;
  color: ${s("text")};
`;

const FeatureDescription = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${s("textSecondary")};
  line-height: 1.4;
`;

const SetupNotice = styled(Flex)`
  align-items: flex-start;
  gap: 12px;
  margin-top: 24px;
  padding: 16px;
  background: ${s("backgroundSecondary")};
  border-radius: 8px;
`;

const NoticeIcon = styled.span`
  font-size: 18px;
  flex-shrink: 0;
`;

const NoticeText = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${s("textSecondary")};
  line-height: 1.5;
`;

export default observer(PatientPortal);
