import {
  EmailIcon,
  ProfileIcon,
  PadlockIcon,
  UserIcon,
  GroupIcon,
  ShieldIcon,
  TeamIcon,
  SparklesIcon,
  SettingsIcon,
  ShapesIcon,
} from "outline-icons";
import { useTranslation } from "react-i18next";
import { createLazyComponent as lazy } from "~/components/LazyLoad";
import { settingsPath } from "~/utils/routeHelpers";
import { useComputed } from "./useComputed";
import useCurrentTeam from "./useCurrentTeam";
import usePolicy from "./usePolicy";

const Authentication = lazy(() => import("~/scenes/Settings/Authentication"));
const Details = lazy(() => import("~/scenes/Settings/Details"));
const Features = lazy(() => import("~/scenes/Settings/Features"));
const Groups = lazy(() => import("~/scenes/Settings/Groups"));
const Members = lazy(() => import("~/scenes/Settings/Members"));
const Notifications = lazy(() => import("~/scenes/Settings/Notifications"));
const Preferences = lazy(() => import("~/scenes/Settings/Preferences"));
const Profile = lazy(() => import("~/scenes/Settings/Profile"));
const Security = lazy(() => import("~/scenes/Settings/Security"));
const Templates = lazy(() => import("~/scenes/Settings/Templates"));

export type ConfigItem = {
  name: string;
  path: string;
  icon: React.FC<{
    size?: number;
    fill?: string;
    monochrome?: boolean;
  }>;
  component: React.ComponentType;
  description?: string;
  preload?: () => void;
  enabled: boolean;
  group: string;
  pluginId?: string;
};

const useSettingsConfig = () => {
  const team = useCurrentTeam();
  const can = usePolicy(team);
  const { t } = useTranslation();

  const config = useComputed(() => {
    const items: ConfigItem[] = [
      // Account
      {
        name: t("Profile"),
        path: settingsPath(),
        component: Profile.Component,
        preload: Profile.preload,
        enabled: true,
        group: t("Account"),
        icon: ProfileIcon,
      },
      {
        name: t("Preferences"),
        path: settingsPath("preferences"),
        component: Preferences.Component,
        preload: Preferences.preload,
        enabled: true,
        group: t("Account"),
        icon: SettingsIcon,
      },
      {
        name: t("Notifications"),
        path: settingsPath("notifications"),
        component: Notifications.Component,
        preload: Notifications.preload,
        enabled: true,
        group: t("Account"),
        icon: EmailIcon,
      },
      // Workspace
      {
        name: t("Details"),
        path: settingsPath("details"),
        component: Details.Component,
        preload: Details.preload,
        enabled: can.update,
        group: t("Workspace"),
        icon: TeamIcon,
      },
      {
        name: t("Authentication"),
        path: settingsPath("authentication"),
        component: Authentication.Component,
        preload: Authentication.preload,
        enabled: can.update,
        group: t("Workspace"),
        icon: PadlockIcon,
      },
      {
        name: t("Security"),
        path: settingsPath("security"),
        component: Security.Component,
        preload: Security.preload,
        enabled: can.update,
        group: t("Workspace"),
        icon: ShieldIcon,
      },
      {
        name: t("AI"),
        path: settingsPath("features"),
        component: Features.Component,
        preload: Features.preload,
        enabled: can.update,
        group: t("Workspace"),
        icon: SparklesIcon,
      },
      {
        name: t("Members"),
        path: settingsPath("members"),
        component: Members.Component,
        preload: Members.preload,
        enabled: can.listUsers,
        group: t("Workspace"),
        icon: UserIcon,
      },
      {
        name: t("Groups"),
        path: settingsPath("groups"),
        component: Groups.Component,
        preload: Groups.preload,
        enabled: can.listGroups,
        group: t("Workspace"),
        icon: GroupIcon,
      },
      {
        name: t("Templates"),
        path: settingsPath("templates"),
        component: Templates.Component,
        preload: Templates.preload,
        enabled: can.readTemplate,
        group: t("Workspace"),
        icon: ShapesIcon,
      },
    ];

    return items;
  }, [t, can.update]);

  return config.filter((item) => item.enabled);
};

export default useSettingsConfig;
