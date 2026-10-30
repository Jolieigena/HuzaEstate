"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { OPEN_ADD_ROLE_EVENT, requestableRolesFor } from "@/lib/roleRequests/api";
import AddRoleDialog from "./AddRoleDialog";

/** Mounted once for the whole site. The account menu closes itself when it is used, which would take a dialog inside it away, so
 *  the menu asks for the dialog with an event and this opens it. */
export default function AddRoleHost() {
  const { account } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_ADD_ROLE_EVENT, show);
    return () => window.removeEventListener(OPEN_ADD_ROLE_EVENT, show);
  }, []);

  const roles = requestableRolesFor(account?.roles);
  if (!account || roles.length === 0) return null;
  return <AddRoleDialog open={open} onClose={() => setOpen(false)} roles={roles} />;
}
