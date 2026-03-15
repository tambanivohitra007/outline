import { useEffect } from "react";
import env from "~/env";
import LoadingIndicator from "~/components/LoadingIndicator";
import useStores from "~/hooks/useStores";

const Logout = () => {
  const { auth } = useStores();

  useEffect(() => {
    async function performLogout() {
      await auth.logout({ userInitiated: true });

      if (env.OIDC_LOGOUT_URI) {
        window.location.href = env.OIDC_LOGOUT_URI;
      } else {
        // Full page navigation to clear all SPA state
        window.location.href = "/?logout=true";
      }
    }
    void performLogout();
  }, [auth]);

  return <LoadingIndicator />;
};

export default Logout;
