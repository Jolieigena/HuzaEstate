"use client";

import { useEffect, useState } from "react";
import type { RequestableRole } from "@/lib/roleRequests/api";
import { useAuth } from "@/lib/auth-context";
import { OPEN_ADD_ROLE_EVENT, requestableRolesFor } from "@/lib/roleRequests/api";
import AddRoleDialog from "./AddRoleDialog";

/** Mounted once for the whole site. The account menu closes itself when it is used, which would take a dialog inside it away, so
 *  the menu asks for the dialog with an event and this opens it. */
export default function AddRoleHost() {
  const { account } = useAuth();
  const [open, setOpen] = useState(false);
  const [preferred, setPreferred] = useState<RequestableRole | null>(null);

  useEffect(() => {
    const show = (event: Event) => {
      const wanted = (event as CustomEvent<{ role?: RequestableRole } | undefined>).detail?.role;
      setPreferred(wanted ?? null);
      setOpen(true);
    };
    window.addEventListener(OPEN_ADD_ROLE_EVENT, show);
    return () => window.removeEventListener(OPEN_ADD_ROLE_EVENT, show);
  }, []);

  const available = requestableRolesFor(account?.roles);
  // A page that asks for one role in particular (the professionals page) has that role selected first.
  const roles = preferred && available.includes(preferred) ? [preferred, ...available.filter((r) => r !== preferred)] : available;
  if (!account || roles.length === 0) return null;
  return <AddRoleDialog open={open} onClose={() => setOpen(false)} roles={roles} />;
}
