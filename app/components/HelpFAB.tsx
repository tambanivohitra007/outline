import { observer } from "mobx-react";
import { QuestionMarkIcon } from "outline-icons";
import { useCallback, useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import styled from "styled-components";
import { s } from "@shared/styles";
import useCurrentUser from "~/hooks/useCurrentUser";
import useStores from "~/hooks/useStores";
import { client } from "~/utils/ApiClient";
import Tooltip from "~/components/Tooltip";

/**
 * Floating action button that navigates to the Help & Documentation collection.
 * If the collection does not exist yet and the user is an admin, it seeds it first.
 */
function HelpFAB() {
  const { t } = useTranslation();
  const { collections } = useStores();
  const user = useCurrentUser();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    // Check if help collection already exists in the store
    const existing = collections.orderedData.find(
      (c) => c.name === "Help & Documentation"
    );

    if (existing) {
      history.push(existing.path);
      return;
    }

    // Collection not found — seed it if admin
    if (!user.isAdmin) {
      toast.error(
        t("Help collection has not been set up yet. Ask an administrator to set it up.")
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await client.post("/conditions.seedHelp");
      if (res.data?.seeded) {
        // Refresh collections and navigate
        await collections.fetchAll();
        const seeded = collections.orderedData.find(
          (c) => c.name === "Help & Documentation"
        );
        if (seeded) {
          history.push(seeded.path);
        }
        toast.success(t("Help & Documentation collection created"));
      }
    } catch (err) {
      toast.error(
        t("Failed to create Help collection")
      );
    } finally {
      setIsLoading(false);
    }
  }, [collections, user.isAdmin, history, t]);

  return (
    <Tooltip content={t("Help & Documentation")} placement="left">
      <FABButton
        onClick={handleClick}
        disabled={isLoading}
        aria-label={t("Help & Documentation")}
      >
        <QuestionMarkIcon size={24} />
      </FABButton>
    </Tooltip>
  );
}

const FABButton = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 200;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: ${s("accent")};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  }

  &:active {
    transform: scale(0.96);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media print {
    display: none;
  }
`;

export default observer(HelpFAB);
