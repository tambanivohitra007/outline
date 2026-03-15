import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { ShieldIcon } from "outline-icons";
import { useState } from "react";
import * as React from "react";
import { useTranslation, Trans } from "react-i18next";
import { toast } from "sonner";
import { TeamPreference, EmailDisplay } from "@shared/types";
import Heading from "~/components/Heading";
import type { Option } from "~/components/InputSelect";
import { InputSelect } from "~/components/InputSelect";
import Scene from "~/components/Scene";
import Switch from "~/components/Switch";
import Text from "~/components/Text";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import SettingRow from "./components/SettingRow";

function Security() {
  const team = useCurrentTeam();
  const { t } = useTranslation();

  const [data, setData] = useState({
    defaultUserRole: team.defaultUserRole,
    inviteRequired: team.inviteRequired,
    passkeysEnabled: team.passkeysEnabled,
  });

  const userRoleOptions: Option[] = React.useMemo(
    () =>
      [
        {
          type: "item",
          label: t("Editor"),
          value: "member",
        },
        {
          type: "item",
          label: t("Viewer"),
          value: "viewer",
        },
      ] satisfies Option[],
    [t]
  );

  const emailDisplayOptions: Option[] = React.useMemo(
    () =>
      [
        {
          type: "item",
          label: t("Members"),
          value: EmailDisplay.Members,
        },
        {
          type: "item",
          label: t("Members and guests"),
          value: EmailDisplay.Everyone,
        },
        {
          type: "item",
          label: t("No one"),
          value: EmailDisplay.None,
        },
      ] satisfies Option[],
    [t]
  );

  const showSuccessMessage = React.useMemo(
    () =>
      debounce(() => {
        toast.success(t("Settings saved"));
      }, 250),
    [t]
  );

  const saveData = React.useCallback(
    async (newData) => {
      try {
        setData((prev) => ({ ...prev, ...newData }));
        await team.save(newData);
        showSuccessMessage();
      } catch (err) {
        toast.error(err.message);
      }
    },
    [team, showSuccessMessage]
  );

  const handleDefaultRoleChange = React.useCallback(
    async (newDefaultRole: string) => {
      await saveData({ defaultUserRole: newDefaultRole });
    },
    [saveData]
  );

  const handlePasskeysEnabledChange = React.useCallback(
    async (checked: boolean) => {
      await saveData({ passkeysEnabled: checked });
    },
    [saveData]
  );

  const handleMembersCanInviteChange = React.useCallback(
    async (checked: boolean) => {
      const preferences = {
        ...team.preferences,
        [TeamPreference.MembersCanInvite]: checked,
      };
      await saveData({ preferences });
    },
    [saveData, team.preferences]
  );

  const handleViewersCanExportChange = React.useCallback(
    async (checked: boolean) => {
      const preferences = {
        ...team.preferences,
        [TeamPreference.ViewersCanExport]: checked,
      };
      await saveData({ preferences });
    },
    [saveData, team.preferences]
  );

  const handleEmailDisplayChange = React.useCallback(
    async (emailDisplay: string) => {
      const preferences = {
        ...team.preferences,
        [TeamPreference.EmailDisplay]: emailDisplay,
      };
      await saveData({ preferences });
    },
    [saveData, team.preferences]
  );

  const handleInviteRequiredChange = React.useCallback(
    async (checked: boolean) => {
      await saveData({ inviteRequired: checked });
    },
    [saveData]
  );

  return (
    <Scene title={t("Security")} icon={<ShieldIcon />}>
      <Heading>{t("Security")}</Heading>
      <Text as="p" type="secondary">
        <Trans>
          Control access, authentication, and data visibility for your
          medical knowledge platform.
        </Trans>
      </Text>

      <Heading as="h2">{t("Access Control")}</Heading>
      <SettingRow
        label={t("Require invitations")}
        name="inviteRequired"
        description={t(
          "New staff must be invited before they can access the platform. Recommended for medical environments."
        )}
      >
        <Switch
          id="inviteRequired"
          checked={data.inviteRequired}
          onChange={handleInviteRequiredChange}
        />
      </SettingRow>
      <SettingRow
        label={t("Allow staff to send invites")}
        name={TeamPreference.MembersCanInvite}
        description={t(
          "Allow editors to invite other practitioners to the platform"
        )}
      >
        <Switch
          id={TeamPreference.MembersCanInvite}
          checked={team.getPreference(TeamPreference.MembersCanInvite)}
          onChange={handleMembersCanInviteChange}
        />
      </SettingRow>
      <SettingRow
        label={t("Default role for new staff")}
        name="defaultUserRole"
        description={t(
          "New accounts are assigned this role. Editors can create and modify clinical content. Viewers have read-only access."
        )}
        border={false}
      >
        <InputSelect
          value={data.defaultUserRole}
          options={userRoleOptions}
          onChange={handleDefaultRoleChange}
          label={t("Default role")}
          hideLabel
          short
        />
      </SettingRow>

      <Heading as="h2">{t("Authentication")}</Heading>
      <SettingRow
        label={t("Passkeys")}
        name="passkeysEnabled"
        description={t(
          "Allow staff to sign in with passkeys for passwordless authentication"
        )}
      >
        <Switch
          id="passkeysEnabled"
          checked={data.passkeysEnabled}
          onChange={handlePasskeysEnabledChange}
        />
      </SettingRow>

      <Heading as="h2">{t("Data Visibility")}</Heading>
      <SettingRow
        label={t("Allow viewers to export content")}
        name={TeamPreference.ViewersCanExport}
        description={t(
          "When enabled, viewers can download clinical documents and protocols"
        )}
      >
        <Switch
          id={TeamPreference.ViewersCanExport}
          checked={team.getPreference(TeamPreference.ViewersCanExport)}
          onChange={handleViewersCanExportChange}
        />
      </SettingRow>
      <SettingRow
        label={t("Email address visibility")}
        name={TeamPreference.EmailDisplay}
        description={t(
          "Controls who can see staff email addresses on the platform"
        )}
      >
        <InputSelect
          value={team.getPreference(TeamPreference.EmailDisplay) as string}
          options={emailDisplayOptions}
          onChange={handleEmailDisplayChange}
          label={t("Email address visibility")}
          hideLabel
          short
        />
      </SettingRow>
    </Scene>
  );
}

export default observer(Security);
