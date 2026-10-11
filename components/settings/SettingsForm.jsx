"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { WEEK_ORDER, WEEKDAY_NAMES, api } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

// Full IANA list where supported, falling back to a small set otherwise.
function listTimeZones() {
  try {
    if (typeof Intl.supportedValuesOf === "function") return Intl.supportedValuesOf("timeZone");
  } catch {
    /* ignore */
  }
  return ["UTC", "America/New_York", "Europe/London", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"];
}

export function SettingsForm({ user }) {
  const router = useRouter();
  const toast = useToast();
  const prefs = user.preferences || {};

  const timeZones = (() => {
    const zones = listTimeZones();
    const current = prefs.timeZone || "UTC";
    return zones.includes(current) ? zones : [current, ...zones];
  })();

  const [name, setName] = useState(user.name || "");
  const [preferredStudyTime, setPreferredStudyTime] = useState(prefs.preferredStudyTime || "evening");
  const [timeZone, setTimeZone] = useState(prefs.timeZone || "UTC");
  const [dailyStudyMinutes, setDailyStudyMinutes] = useState(String(prefs.dailyStudyMinutes ?? 120));
  const [weekly, setWeekly] = useState(() => {
    const initial = {};
    for (const day of WEEK_ORDER) {
      const raw = (prefs.weeklyAvailability || {})[String(day)];
      initial[String(day)] = raw != null ? String(raw) : String(prefs.dailyStudyMinutes ?? 120);
    }
    return initial;
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const weeklyAvailability = {};
      for (const day of WEEK_ORDER) {
        const v = Number(weekly[String(day)]);
        if (Number.isFinite(v)) weeklyAvailability[String(day)] = Math.min(1440, Math.max(0, Math.round(v)));
      }
      await api("/api/settings", {
        method: "PUT",
        body: {
          name: name.trim(),
          preferredStudyTime,
          timeZone,
          dailyStudyMinutes: Math.min(1440, Math.max(0, Number(dailyStudyMinutes) || 120)),
          weeklyAvailability,
        },
      });
      toast({ title: "Settings saved", variant: "success" });
      router.refresh();
    } catch (err) {
      toast({ title: "Could not save settings", description: err.message, variant: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "error" });
      return;
    }
    setSavingPassword(true);
    try {
      await api("/api/settings", {
        method: "PUT",
        body: { currentPassword, newPassword },
      });
      toast({ title: "Password changed", variant: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast({ title: "Could not change password", description: err.message, variant: "error" });
    } finally {
      setSavingPassword(false);
    }
  };

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Your profile, study availability and account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name and preferred study time.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="settings-name">Name</Label>
                <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-email">Email</Label>
                <Input id="settings-email" value={user.email} disabled />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Preferred study time</Label>
              <div className="flex flex-wrap gap-2">
                {["morning", "afternoon", "evening", "night"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPreferredStudyTime(t)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                      preferredStudyTime === t
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-w-sm space-y-1.5">
              <Label htmlFor="settings-timezone">Time zone</Label>
              <Select
                id="settings-timezone"
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
              >
                {timeZones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-zinc-500">
                Used for today&apos;s sessions, streaks, weekly planning and progress. Exam dates stay fixed calendar dates.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Study minutes per day</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {WEEK_ORDER.map((day) => (
                  <div key={day} className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2">
                    <span className="flex-1 text-sm text-zinc-600">{WEEKDAY_NAMES[day]}</span>
                    <Input
                      type="number"
                      min={0}
                      max={1440}
                      value={weekly[String(day)]}
                      onChange={(e) => setWeekly((w) => ({ ...w, [String(day)]: e.target.value }))}
                      className="h-8 w-20"
                      aria-label={`${WEEKDAY_NAMES[day]} minutes`}
                    />
                    <span className="text-xs text-zinc-400">min</span>
                  </div>
                ))}
              </div>
              <div className="max-w-xs space-y-1.5">
                <Label htmlFor="settings-daily">Default daily minutes (fallback)</Label>
                <Input
                  id="settings-daily"
                  type="number"
                  min={0}
                  max={1440}
                  value={dailyStudyMinutes}
                  onChange={(e) => setDailyStudyMinutes(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? <Loader2 className="animate-spin" /> : null}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Use at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="pw-current">Current password</Label>
                <Input
                  id="pw-current"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw-new">New password</Label>
                <Input
                  id="pw-new"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw-confirm">Confirm new password</Label>
                <Input
                  id="pw-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="outline" disabled={savingPassword}>
              {savingPassword ? <Loader2 className="animate-spin" /> : null}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-medium">Session</p>
            <p className="text-sm text-zinc-500">Signed in as {user.email}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut /> Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
