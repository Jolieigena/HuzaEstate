"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchMyLandlordProfile } from "@/lib/landlords/api";
import { fetchMyProfessionalProfile } from "@/lib/professional/api";

const listeners = new Set<() => void>();

/** Call after a professional or landlord profile photo is saved so every mounted
 *  useMyProfilePhoto() (the header's account-menu circle) picks it up immediately. */
export function notifyProfilePhotoChanged() {
  listeners.forEach((listener) => listener());
}

/** The photo shown in the header's account-menu circle, for the two roles that have a saved
 *  profile photo to show (professional profile, or a seller's landlord profile) — undefined for
 *  everyone else (customer, administrator), who falls back to the plain letter avatar. */
export function useMyProfilePhoto(): string | undefined {
  const { account, token } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!token || !account) {
      setPhotoUrl(undefined);
      return;
    }
    const isProfessional = account.roles.includes("professional");
    const isLandlord = account.roles.includes("seller_manager");
    const fetchProfile = isProfessional ? fetchMyProfessionalProfile(token) : isLandlord ? fetchMyLandlordProfile(token) : Promise.resolve(null);
    fetchProfile.then((profile) => {
      if (!cancelled) setPhotoUrl(profile?.photoUrl || undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [token, account, version]);

  return photoUrl;
}
