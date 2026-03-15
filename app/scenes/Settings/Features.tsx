import { observer } from "mobx-react";
import { CopyIcon, SparklesIcon } from "outline-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { toast } from "sonner";
import { TeamPreference } from "@shared/types";
import Heading from "~/components/Heading";
import Scene from "~/components/Scene";
import Switch from "~/components/Switch";
import Text from "~/components/Text";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import { client } from "~/utils/ApiClient";
import SettingRow from "./components/SettingRow";
import Input from "~/components/Input";
import Tooltip from "~/components/Tooltip";
import CopyToClipboard from "~/components/CopyToClipboard";
import NudeButton from "~/components/NudeButton";
import styled, { useTheme } from "styled-components";
import { s } from "@shared/styles";

interface AIModel {
  id: string;
  label: string;
  provider: string;
}

function Features() {
  const { t } = useTranslation();
  const team = useCurrentTeam();
  const theme = useTheme();
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);

  useEffect(() => {
    async function loadModels() {
      try {
        const res = await client.post("/ai.models");
        setAvailableModels(res.data ?? []);
      } catch {
        // No AI providers configured
      }
    }
    void loadModels();
  }, []);

  const handleMCPChange = useCallback(
    async (checked: boolean) => {
      team.setPreference(TeamPreference.MCP, checked);
      await team.save();
      toast.success(t("Settings saved"));
    },
    [team, t]
  );

  const handleModelChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const modelId = e.target.value;
      team.setPreference(TeamPreference.AIModel, modelId);
      await team.save({ preferences: { ...team.preferences } });
      toast.success(t("Settings saved"));
    },
    [team, t]
  );

  const handleCopied = useCallback(() => {
    toast.success(t("Copied to clipboard"));
  }, [t]);

  const mcpEndpoint = window.location.origin + "/mcp";

  const currentModel = useMemo(
    () =>
      (team.getPreference(TeamPreference.AIModel) as string) ??
      "gemini-2.5-flash-preview-05-20",
    [team]
  );

  return (
    <Scene title={t("AI")} icon={<SparklesIcon />}>
      <Heading>{t("AI")}</Heading>
      <Text as="p" type="secondary">
        <Trans>Manage AI and integration features for your workspace.</Trans>
      </Text>

      {availableModels.length > 0 && (
        <SettingRow
          name="aiModel"
          label={t("AI model")}
          description={t(
            "Choose which AI model to use for content generation, suggestions, and explanations. Only models with configured API keys are shown."
          )}
        >
          <ModelSelect value={currentModel} onChange={handleModelChange}>
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </ModelSelect>
        </SettingRow>
      )}

      {availableModels.length === 0 && (
        <SettingRow
          name="aiModel"
          label={t("AI model")}
          description={t(
            "No AI providers are configured. Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in your environment to enable AI features."
          )}
        >
          <ModelSelect disabled>
            <option>{t("No providers available")}</option>
          </ModelSelect>
        </SettingRow>
      )}

      <SettingRow
        name={TeamPreference.MCP}
        label={t("MCP server")}
        description={
          <>
            <Text type="secondary" as="p">
              {t(
                "Allow members to connect to this workspace with MCP to read and write data."
              )}
            </Text>
            {team.getPreference(TeamPreference.MCP) && (
              <>
                <Text
                  type="secondary"
                  as="p"
                  style={{ marginTop: 8, marginBottom: 4 }}
                >
                  <Trans
                    defaults="Use the following endpoint to connect to the MCP server from your app. Find out more about setup in <a>the docs</a>."
                    components={{
                      a: (
                        <Text
                          as="a"
                          weight="bold"
                          href="https://docs.getoutline.com/s/guide/doc/mcp-6j9jtENNKL"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                    }}
                  />
                </Text>
                <Input readOnly value={mcpEndpoint}>
                  <Tooltip content={t("Copy URL")} placement="top">
                    <CopyToClipboard text={mcpEndpoint} onCopy={handleCopied}>
                      <NudeButton type="button" style={{ marginRight: 3 }}>
                        <CopyIcon color={theme.placeholder} size={18} />
                      </NudeButton>
                    </CopyToClipboard>
                  </Tooltip>
                </Input>
              </>
            )}
          </>
        }
      >
        <Switch
          id={TeamPreference.MCP}
          name={TeamPreference.MCP}
          checked={team.getPreference(TeamPreference.MCP)}
          onChange={handleMCPChange}
        />
      </SettingRow>

      <SettingRow
        name="answers"
        label={t("AI answers")}
        description={t(
          "Use AI to get direct answers to questions in search. This feature requires a paid license."
        )}
        border={false}
      >
        <Switch disabled />
      </SettingRow>
    </Scene>
  );
}

const ModelSelect = styled.select`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid ${s("inputBorder")};
  background: ${s("inputBackground")};
  color: ${s("text")};
  font-size: 14px;
  min-width: 200px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${s("accent")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default observer(Features);
