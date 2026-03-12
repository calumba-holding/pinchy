"use client";

import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { UserListItem, UserGroup } from "@/lib/user-list";

interface UserDetailSheetProps {
  user: UserListItem & { kind: "user" };
  allGroups: UserGroup[];
  isEnterprise: boolean;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    deactivated: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };
  return (
    <Badge variant="outline" className={`text-xs ${variants[status] || ""}`}>
      {status}
    </Badge>
  );
}

export function UserDetailSheet({
  user,
  allGroups,
  isEnterprise,
  currentUserId,
  open,
  onOpenChange,
  onSaved,
}: UserDetailSheetProps) {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    () => new Set(user.groups.map((g) => g.id))
  );
  const [saving, setSaving] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const isOwnAccount = user.id === currentUserId;
  const isDeactivated = user.status === "deactivated";

  const showGroups = isEnterprise && allGroups.length > 0;

  const isDirty = useMemo(() => {
    if (selectedRole !== user.role) return true;

    const originalIds = new Set(user.groups.map((g) => g.id));
    if (selectedGroupIds.size !== originalIds.size) return true;
    for (const id of selectedGroupIds) {
      if (!originalIds.has(id)) return true;
    }
    return false;
  }, [selectedRole, selectedGroupIds, user.role, user.groups]);

  function handleGroupToggle(groupId: string) {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const promises: Promise<Response>[] = [];

      if (selectedRole !== user.role) {
        promises.push(
          fetch(`/api/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: selectedRole }),
          })
        );
      }

      const originalIds = new Set(user.groups.map((g) => g.id));
      const groupsChanged =
        selectedGroupIds.size !== originalIds.size ||
        [...selectedGroupIds].some((id) => !originalIds.has(id));

      if (groupsChanged) {
        promises.push(
          fetch(`/api/users/${user.id}/groups`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupIds: [...selectedGroupIds] }),
          })
        );
      }

      const results = await Promise.all(promises);
      const allOk = results.every((r) => r.ok);

      if (allOk) {
        toast("User updated");
        onSaved();
        onOpenChange(false);
      } else {
        toast.error("Failed to update user");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    const res = await fetch(`/api/users/${user.id}/reset`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setResetLink(`${window.location.origin}/invite/${data.token}`);
    }
  }

  async function handleDeactivate() {
    await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    setShowDeactivateConfirm(false);
    onSaved();
    onOpenChange(false);
  }

  async function handleReactivate() {
    await fetch(`/api/users/${user.id}/reactivate`, { method: "POST" });
    onSaved();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg">{user.name}</SheetTitle>
              <SheetDescription>{user.email}</SheetDescription>
            </div>
            <StatusBadge status={user.status} />
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 flex-1 overflow-y-auto">
          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role-select">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={isOwnAccount || isDeactivated}
            >
              <SelectTrigger id="role-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Groups (enterprise only, when groups exist) */}
          {showGroups && (
            <div className="space-y-2">
              <Label>Groups</Label>
              <div className="space-y-2">
                {allGroups.map((group) => (
                  <label key={group.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedGroupIds.has(group.id)}
                      onCheckedChange={() => handleGroupToggle(group.id)}
                      disabled={isDeactivated}
                    />
                    {group.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-4 space-y-4">
          {/* Save */}
          <Button onClick={handleSave} disabled={!isDirty || saving} className="w-full">
            {saving ? "Saving..." : "Save"}
          </Button>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full" onClick={handleResetPassword}>
              Reset Password
            </Button>

            {resetLink && (
              <div className="rounded border bg-muted p-3">
                <p className="text-sm font-medium mb-1">Reset link:</p>
                <p className="text-sm break-all">{resetLink}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText(resetLink);
                    toast("Link copied to clipboard");
                  }}
                >
                  Copy
                </Button>
              </div>
            )}

            {user.status === "active" ? (
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                disabled={isOwnAccount}
                onClick={() => setShowDeactivateConfirm(true)}
              >
                Deactivate
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="w-full" onClick={handleReactivate}>
                Reactivate
              </Button>
            )}
          </div>
        </div>
      </SheetContent>

      <AlertDialog
        open={showDeactivateConfirm}
        onOpenChange={(open) => !open && setShowDeactivateConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              This user will no longer be able to log in. You can reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeactivate}>
              Confirm Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
