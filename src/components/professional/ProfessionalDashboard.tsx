"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, PageFrame, PrimaryLink } from "./ui";

// Shown to a professional after login: profile-completion status and a way to their public profile.
export default function ProfessionalDashboard() {
  const { account } = useAuth();
  return (
    <PageFrame title={`Welcome, ${account?.name ?? "there"}`} description="Your professional workspace.">
      <Card className="max-w-xl">
        {account?.profileCompleted ? (
          <>
            <p className="font-bold text-slate-900">Your profile is live</p>
            <p className="mt-1 text-sm text-slate-500">Clients can find and contact you on the public professionals directory.</p>
            <div className="mt-5 flex gap-3">
              <PrimaryLink href="/professional/profile">Edit profile</PrimaryLink>
              {account?.id && (
                <a href={`/professionals/${account.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  View public profile
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="font-bold text-slate-900">Complete your profile</p>
            <p className="mt-1 text-sm text-slate-500">Add your bio, specialisation, services and example projects so clients can find and contact you.</p>
            <div className="mt-5"><PrimaryLink href="/professional/profile">Complete your profile</PrimaryLink></div>
          </>
        )}
      </Card>
    </PageFrame>
  );
}
