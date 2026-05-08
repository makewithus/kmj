/**
 * JamatPortalWrapper
 * Layout route wrapper — provides JamatAuthProvider keyed by slug.
 * Used as a parent <Route> with nested child routes via <Outlet>.
 */

import { useParams } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { JamatAuthProvider } from "../../context/JamatAuthContext";

const JamatPortalWrapper = () => {
  const { slug } = useParams();
  return (
    <JamatAuthProvider slug={slug}>
      <Outlet />
    </JamatAuthProvider>
  );
};

export default JamatPortalWrapper;
