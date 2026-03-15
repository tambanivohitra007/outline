import { observer } from "mobx-react";
import { Suspense } from "react";
import type { RouteComponentProps } from "react-router-dom";
import { Switch, Redirect } from "react-router-dom";
import DocumentNew from "~/scenes/DocumentNew";
import Error404 from "~/scenes/Errors/Error404";
import AuthenticatedLayout from "~/components/AuthenticatedLayout";
import CenteredContent from "~/components/CenteredContent";
import PlaceholderDocument from "~/components/PlaceholderDocument";
import Route from "~/components/ProfiledRoute";
import WebsocketProvider from "~/components/WebsocketProvider";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import usePolicy from "~/hooks/usePolicy";
import lazy from "~/utils/lazyWithRetry";
import {
  bibleExplorerPath,
  conditionsPath,
  conditionPath,
  draftsPath,
  homePath,
  interventionsPath,
  knowledgeGraphPath,
  analyticsPath,
  patientPortalPath,
  recipesPath,
  searchPath,
  settingsPath,
  matchDocumentSlug as documentSlug,
  matchCollectionSlug as collectionSlug,
  debugPath,
} from "~/utils/routeHelpers";
import env from "~/env";

const SettingsRoutes = lazy(() => import("./settings"));
const Collection = lazy(() => import("~/scenes/Collection"));
const Document = lazy(() => import("~/scenes/Document"));
const Drafts = lazy(() => import("~/scenes/Drafts"));
const Home = lazy(() => import("~/scenes/Home"));
const Search = lazy(() => import("~/scenes/Search"));
const Debug = lazy(() => import("~/scenes/Developer/Debug"));
const Changesets = lazy(() => import("~/scenes/Developer/Changesets"));
const Conditions = lazy(() => import("~/scenes/Conditions"));
const ConditionEditor = lazy(() => import("~/scenes/ConditionEditor"));
const Interventions = lazy(() => import("~/scenes/Interventions"));
const RecipesScene = lazy(() => import("~/scenes/Recipes"));
const KnowledgeGraph = lazy(() => import("~/scenes/KnowledgeGraph"));
const AnalyticsScene = lazy(() => import("~/scenes/Analytics"));
const PatientPortal = lazy(() => import("~/scenes/PatientPortal"));
const BibleExplorer = lazy(() => import("~/scenes/BibleExplorer"));
const ConditionCompiled = lazy(() => import("~/scenes/ConditionCompiled"));

const RedirectDocument = ({
  match,
}: RouteComponentProps<{ documentSlug: string }>) => (
  <Redirect
    to={
      match.params.documentSlug
        ? `/doc/${match.params.documentSlug}`
        : homePath()
    }
  />
);

/**
 * The authenticated routes are all the routes of the application that require
 * the user to be logged in.
 */
function AuthenticatedRoutes() {
  const team = useCurrentTeam();
  const can = usePolicy(team);

  return (
    <WebsocketProvider>
      <AuthenticatedLayout>
        <Suspense
          fallback={
            <CenteredContent>
              <PlaceholderDocument />
            </CenteredContent>
          }
        >
          <Switch>
            {can.createDocument && (
              <Route exact path={draftsPath()} component={Drafts} />
            )}
            <Route path={`${homePath()}/:tab?`} component={Home} />
            <Redirect from="/dashboard" to={homePath()} />
            <Redirect exact from="/starred" to={homePath()} />
            <Redirect exact from="/templates" to={settingsPath("templates")} />
            <Redirect exact from="/collections/*" to="/collection/*" />
            <Route
              exact
              path={`/collection/${collectionSlug}/new`}
              component={DocumentNew}
            />
            <Route
              exact
              path={`/collection/${collectionSlug}/overview/edit`}
              component={Collection}
            />
            <Route
              exact
              path={`/collection/${collectionSlug}/:tab?`}
              component={Collection}
            />
            <Route exact path="/doc/new" component={DocumentNew} />
            <Route
              exact
              path={`/d/${documentSlug}`}
              component={RedirectDocument}
            />
            <Route
              exact
              path={`/doc/${documentSlug}/history/:revisionId?`}
              component={Document}
            />

            <Route
              exact
              path={`/doc/${documentSlug}/edit`}
              component={Document}
            />
            <Route path={`/doc/${documentSlug}`} component={Document} />
            <Route exact path={`${searchPath()}/:query?`} component={Search} />
            {env.isDevelopment && (
              <Route exact path={debugPath()} component={Debug} />
            )}
            {env.isDevelopment && (
              <Route
                exact
                path={`${debugPath()}/changesets`}
                component={Changesets}
              />
            )}
            <Route exact path={conditionsPath()} component={Conditions} />
            <Route exact path={`${conditionsPath()}/:id/compiled`} component={ConditionCompiled} />
            <Route exact path={`${conditionsPath()}/:id`} component={ConditionEditor} />
            <Route exact path={interventionsPath()} component={Interventions} />
            <Route exact path={recipesPath()} component={RecipesScene} />
            <Route exact path={knowledgeGraphPath()} component={KnowledgeGraph} />
            <Route exact path={analyticsPath()} component={AnalyticsScene} />
            <Route exact path={bibleExplorerPath()} component={BibleExplorer} />
            <Route exact path={patientPortalPath()} component={PatientPortal} />
            <Route exact path="/404" component={Error404} />
            <SettingsRoutes />
            <Route component={Error404} />
          </Switch>
        </Suspense>
      </AuthenticatedLayout>
    </WebsocketProvider>
  );
}

export default observer(AuthenticatedRoutes);
