"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { createProjectSyncs } from "@/lib/projectSync";

type Syncs = ReturnType<typeof createProjectSyncs>;
const RECHECK_AFTER_MS = 60 * 1000;

/**
 * Keeps the signed-in person's Build and Renovate projects on their account (see lib/projectSync), so they follow them across devices.
 * Renders nothing. A visitor who is not signed in has the account's projects removed from this browser, so the next person does not see them.
 */
export default function ProjectSyncHost() {
  const { account, token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const syncs = useRef<Syncs | null>(null);
  const toast = useRef(showToast);
  useEffect(() => {
    toast.current = showToast;
  });

  useEffect(() => {
    if (!isAuthReady) return;
    if (!syncs.current) syncs.current = createProjectSyncs((message) => toast.current(message, "error"));
    const engines = syncs.current;
    if (!account || !token) {
      engines.build.stop();
      engines.renovate.stop();
      engines.build.cleanupForSignedOut();
      engines.renovate.cleanupForSignedOut();
      return;
    }
    if (typeof crypto === "undefined" || !crypto.subtle) return; // pictures are identified by a hash, which needs a secure page (https)
    void engines.build.start(account.id, token);
    void engines.renovate.start(account.id, token);

    let lastSeen = Date.now();
    const onVisible = () => {
      if (document.visibilityState === "hidden") {
        lastSeen = Date.now();
        return;
      }
      if (Date.now() - lastSeen > RECHECK_AFTER_MS) {
        void engines.build.refresh();
        void engines.renovate.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      engines.build.stop();
      engines.renovate.stop();
    };
  }, [account, token, isAuthReady]);

  return null;
}
