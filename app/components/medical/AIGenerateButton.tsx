import { observer } from "mobx-react";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";
import Flex from "~/components/Flex";
import { client } from "~/utils/ApiClient";
import styled from "styled-components";
import { s } from "@shared/styles";

interface Props {
  /** The condition name */
  conditionName: string;
  /** The section type to generate for */
  sectionType: string;
  /** Existing content to build upon */
  existingContent?: string;
  /** Called when content is generated with the markdown result */
  onGenerated: (content: string) => void;
}

function AIGenerateButton({
  conditionName,
  sectionType,
  existingContent,
  onGenerated,
}: Props) {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await client.post("/ai.generateContent", {
        conditionName,
        sectionType,
        existingContent,
      });
      setPreview(res.data?.content ?? "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("Failed to generate content")
      );
    } finally {
      setIsGenerating(false);
    }
  }, [conditionName, sectionType, existingContent, t]);

  const handleInsert = useCallback(() => {
    if (preview) {
      onGenerated(preview);
      setPreview(null);
    }
  }, [preview, onGenerated]);

  return (
    <Container>
      {!preview ? (
        <Button onClick={handleGenerate} disabled={isGenerating} neutral>
          {isGenerating ? t("Generating...") : t("Generate with AI")}
        </Button>
      ) : (
        <>
          <PreviewContainer>
            <PreviewHeader>
              <PreviewTitle>{t("AI Generated Content")}</PreviewTitle>
              <Flex gap={8}>
                <Button onClick={handleInsert}>{t("Insert")}</Button>
                <Button onClick={() => setPreview(null)} neutral>
                  {t("Discard")}
                </Button>
              </Flex>
            </PreviewHeader>
            <PreviewContent>{preview}</PreviewContent>
          </PreviewContainer>
        </>
      )}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </Container>
  );
}

const Container = styled.div`
  margin-top: 8px;
`;

const PreviewContainer = styled.div`
  border: 1px solid ${s("accent")};
  border-radius: 8px;
  overflow: hidden;
`;

const PreviewHeader = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${s("backgroundSecondary")};
  border-bottom: 1px solid ${s("divider")};
`;

const PreviewTitle = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${s("accent")};
`;

const PreviewContent = styled.pre`
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: ${s("text")};
  max-height: 400px;
  overflow-y: auto;
  margin: 0;
`;

const ErrorMessage = styled.div`
  margin-top: 8px;
  font-size: 13px;
  color: #d73a49;
`;

export default observer(AIGenerateButton);
