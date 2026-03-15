import { observer } from "mobx-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { toast } from "sonner";
import Flex from "~/components/Flex";
import type Condition from "~/models/Condition";
import useStores from "~/hooks/useStores";
import { client } from "~/utils/ApiClient";
import { conditionCompiledPath } from "~/utils/routeHelpers";
import styled from "styled-components";
import { s } from "@shared/styles";

interface Props {
  condition: Condition;
}

function ConditionHeader({ condition }: Props) {
  const { t } = useTranslation();
  const history = useHistory();
  const { conditions } = useStores();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(condition.name);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<string | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  const handleSave = useCallback(async () => {
    if (name.trim() && name !== condition.name) {
      await conditions.update({ id: condition.id, name: name.trim() });
    }
    setIsEditing(false);
  }, [conditions, condition, name]);

  const handleStatusChange = useCallback(
    async (newStatus: "draft" | "review" | "published") => {
      setIsTransitioning(true);
      try {
        await client.post("/conditions.status", {
          id: condition.id,
          status: newStatus,
        });
        // Update local model
        condition.status = newStatus;

        const messages: Record<string, string> = {
          draft: t("Condition moved back to draft"),
          review: t("Condition submitted for review"),
          published: t("Condition published"),
        };
        toast.success(messages[newStatus]);
      } finally {
        setIsTransitioning(false);
      }
    },
    [conditions, condition, t]
  );

  const handleViewCompiled = useCallback(() => {
    history.push(conditionCompiledPath(condition.id));
  }, [history, condition.id]);

  const handleReviewSummary = useCallback(async () => {
    setIsLoadingReview(true);
    setReviewSummary(null);
    try {
      const res = await client.post("/ai.reviewSummary", {
        conditionId: condition.id,
      });
      setReviewSummary(res.data?.summary ?? "");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("Failed to generate review summary")
      );
    } finally {
      setIsLoadingReview(false);
    }
  }, [condition.id, t]);

  return (
    <Header>
      <TopRow>
        {isEditing ? (
          <NameInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleSave();
              }
            }}
            autoFocus
          />
        ) : (
          <ConditionName onClick={() => setIsEditing(true)}>
            {condition.name}
          </ConditionName>
        )}
        <StatusBadge $status={condition.status}>
          {condition.status}
        </StatusBadge>
      </TopRow>

      <MetaRow>
        {condition.snomedCode && (
          <MetaTag>
            <MetaLabel>{t("SNOMED")}</MetaLabel>
            {condition.snomedCode}
          </MetaTag>
        )}
        {condition.icdCode && (
          <MetaTag>
            <MetaLabel>{t("ICD")}</MetaLabel>
            {condition.icdCode}
          </MetaTag>
        )}
      </MetaRow>

      <StatusActions>
        {condition.status === "draft" && (
          <StatusButton
            onClick={() => handleStatusChange("review")}
            disabled={isTransitioning}
            $variant="review"
          >
            {isTransitioning ? `${t("Submitting")}\u2026` : t("Submit for Review")}
          </StatusButton>
        )}
        {condition.status === "review" && (
          <>
            <StatusButton
              onClick={() => handleStatusChange("published")}
              disabled={isTransitioning}
              $variant="publish"
            >
              {isTransitioning ? `${t("Publishing")}\u2026` : t("Publish")}
            </StatusButton>
            <StatusButton
              onClick={() => handleStatusChange("draft")}
              disabled={isTransitioning}
              $variant="draft"
            >
              {t("Back to Draft")}
            </StatusButton>
          </>
        )}
        {condition.status === "published" && (
          <StatusButton
            onClick={() => handleStatusChange("draft")}
            disabled={isTransitioning}
            $variant="draft"
          >
            {t("Unpublish")}
          </StatusButton>
        )}
        <CompileButton onClick={handleViewCompiled}>
          {t("View Compiled Document")}
        </CompileButton>
        <ReviewButton
          onClick={handleReviewSummary}
          disabled={isLoadingReview}
        >
          {isLoadingReview ? t("Analyzing\u2026") : t("AI Review Summary")}
        </ReviewButton>
      </StatusActions>

      {reviewSummary && (
        <ReviewPanel>
          <ReviewPanelHeader>
            <ReviewPanelTitle>{t("AI Review Summary")}</ReviewPanelTitle>
            <DismissButton onClick={() => setReviewSummary(null)}>
              {t("Dismiss")}
            </DismissButton>
          </ReviewPanelHeader>
          <ReviewContent>{reviewSummary}</ReviewContent>
        </ReviewPanel>
      )}
    </Header>
  );
}

const Header = styled.div`
  margin-bottom: 8px;
`;

const TopRow = styled(Flex)`
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const ConditionName = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: ${s("text")};
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const NameInput = styled.input`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: ${s("text")};
  background: transparent;
  border: none;
  border-bottom: 2px solid ${s("accent")};
  outline: none;
  width: 100%;
  padding: 0;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 12px;
  white-space: nowrap;
  background: ${(props) =>
    props.$status === "published"
      ? "#d4edda"
      : props.$status === "review"
        ? "#fff3cd"
        : "#e2e8f0"};
  color: ${(props) =>
    props.$status === "published"
      ? "#155724"
      : props.$status === "review"
        ? "#856404"
        : "#4a5568"};
`;

const MetaRow = styled(Flex)`
  gap: 8px;
`;

const MetaTag = styled.span`
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${s("backgroundSecondary")};
  color: ${s("textSecondary")};
`;

const MetaLabel = styled.span`
  font-weight: 600;
  margin-right: 4px;
`;

const StatusActions = styled(Flex)`
  gap: 8px;
  margin-top: 12px;
`;

const StatusButton = styled.button<{ $variant: string }>`
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 100ms ease;
  border: ${(props) =>
    props.$variant === "draft"
      ? `1px solid ${props.theme.divider}`
      : "none"};
  background: ${(props) =>
    props.$variant === "publish"
      ? "#28a745"
      : props.$variant === "review"
        ? "#ffc107"
        : "transparent"};
  color: ${(props) =>
    props.$variant === "publish"
      ? "#fff"
      : props.$variant === "review"
        ? "#212529"
        : props.theme.textSecondary};

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CompileButton = styled.button`
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 100ms ease;
  border: 1px solid ${s("accent")};
  background: ${s("accent")};
  color: white;

  &:hover {
    opacity: 0.85;
  }
`;

const ReviewButton = styled.button`
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 100ms ease;
  border: 1px solid ${s("accent")};
  background: transparent;
  color: ${s("accent")};

  &:hover {
    background: ${s("accent")};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ReviewPanel = styled.div`
  margin-top: 12px;
  border: 1px solid ${s("accent")};
  border-radius: 8px;
  overflow: hidden;
`;

const ReviewPanelHeader = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: ${s("backgroundSecondary")};
  border-bottom: 1px solid ${s("divider")};
`;

const ReviewPanelTitle = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${s("accent")};
`;

const DismissButton = styled.button`
  padding: 3px 10px;
  border: 1px solid ${s("divider")};
  border-radius: 4px;
  background: none;
  color: ${s("textSecondary")};
  font-size: 12px;
  cursor: pointer;

  &:hover {
    border-color: ${s("text")};
    color: ${s("text")};
  }
`;

const ReviewContent = styled.pre`
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: ${s("text")};
  max-height: 400px;
  overflow-y: auto;
  margin: 0;
`;

export default observer(ConditionHeader);
