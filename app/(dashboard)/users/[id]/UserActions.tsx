"use client";

import { useRouter } from "next/navigation";
import { Ban, BadgeCheck, KeyRound, ShieldCheck, ShieldOff, Trash2, Undo2 } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { banUser, deleteUser, sendPasswordReset, setUserRole, setUserVerified, unbanUser } from "@/lib/actions/users";

interface Props {
  user: { id: string; email: string | null; role: "user" | "admin"; is_verified: boolean; banned: boolean };
}

export function UserActions({ user: u }: Props) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-1.5">
      {u.is_verified ? (
        <ActionButton action={setUserVerified.bind(null, u.id, false)}>Remove verified badge</ActionButton>
      ) : (
        <ActionButton action={setUserVerified.bind(null, u.id, true)} className="btn-primary">
          <BadgeCheck className="h-3.5 w-3.5" /> Mark verified seller
        </ActionButton>
      )}

      {u.role === "admin" ? (
        <ActionButton action={setUserRole.bind(null, u.id, "user")} confirm="Remove admin access from this account?">
          <ShieldOff className="h-3.5 w-3.5" /> Remove admin
        </ActionButton>
      ) : (
        <ActionButton action={setUserRole.bind(null, u.id, "admin")} confirm="Give this account full admin access?">
          <ShieldCheck className="h-3.5 w-3.5" /> Make admin
        </ActionButton>
      )}

      {u.email ? (
        <ActionButton action={sendPasswordReset.bind(null, u.email)}>
          <KeyRound className="h-3.5 w-3.5" /> Send password reset
        </ActionButton>
      ) : null}

      {u.banned ? (
        <ActionButton action={unbanUser.bind(null, u.id)}>
          <Undo2 className="h-3.5 w-3.5" /> Unban
        </ActionButton>
      ) : (
        <>
          <ActionButton action={banUser.bind(null, u.id, false)} confirm="Ban this user? They won't be able to sign in." className="btn-danger">
            <Ban className="h-3.5 w-3.5" /> Ban
          </ActionButton>
          <ActionButton action={banUser.bind(null, u.id, true)} confirm="Ban this user AND take down all their active ads?" className="btn-danger">
            <Ban className="h-3.5 w-3.5" /> Ban + hide ads
          </ActionButton>
        </>
      )}

      <ActionButton
        action={async () => {
          const r = await deleteUser(u.id);
          if (r.ok) router.replace("/users");
          return r;
        }}
        confirm="PERMANENTLY delete this account, all their ads, chats and payments history? This cannot be undone."
        className="btn-danger"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete account
      </ActionButton>
    </div>
  );
}
