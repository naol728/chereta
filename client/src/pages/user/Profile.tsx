/* eslint-disable */
// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hook";
import { useTranslation } from "react-i18next";

import {
  User as UserIcon, Phone, CalendarDays, LogOut, Copy, Loader2, ShieldCheck,
  ChevronRight, Gift, Users, Globe, Moon, Check, Settings, Share2, Sparkles, Link2, Ticket,
  Fingerprint,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { ModeToggle } from "@/components/mode-toggle";
import PreviousUserBid from "./PreviosUserBid";
import { useQuery } from "@tanstack/react-query";
import { gerMyReferalstat } from "@/api/referal";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "am", label: "Amharic", native: "አማርኛ" },
  { code: "om", label: "Afaan Oromoo", native: "Afaan Oromoo" },
];

const TARGET_INVITES = 30;

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-ET", { day: "numeric", month: "long", year: "numeric" }).format(date);
};

export default function Profile() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, loading } = useAppSelector((state) => state.auth);

  // Fetch referral stats
  const {
    data: referralData,
    isLoading: isReferralLoading
  } = useQuery({
    queryKey: ["gerMyReferalstat"],
    queryFn: gerMyReferalstat
  });

  const telegram = window?.Telegram?.WebApp;
  const tgUser = telegram?.initDataUnsafe?.user;
  const tgPhoto = tgUser?.photo_url;
  const currentLangCode = i18n.resolvedLanguage?.split("-")[0] ?? "en";

  // Extract real referral data
  const stats = referralData?.data;
  const referralLink = stats?.referralLink?.trim() || (user?.referral_id ? `https://t.me/cheretas_bot?start=ref_${user.referral_id}` : "");

  // Use real totalReferrals for progress
  const invitedCount = stats?.totalReferrals ?? 0;
  const progressPercentage = Math.min((invitedCount / TARGET_INVITES) * 100, 100);
  const remainingInvites = Math.max(TARGET_INVITES - invitedCount, 0);

  const changeLanguage = async (langCode: string) => {
    try {
      await i18n.changeLanguage(langCode);
      localStorage.setItem("app-language", langCode);
      telegram?.HapticFeedback?.impactOccurred("light");
    } catch {
      toast.error("Unable to change language.");
    }
  };

  const handleCopy = async (text: string) => {
    if (!text) return toast.error("Nothing to copy.");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied!");
      telegram?.HapticFeedback?.notificationOccurred("success");
    } catch {
      toast.error("Unable to copy.");
    }
  };

  const handleShareReferral = () => {
    if (!referralLink) return toast.error("Referral link is not available.");
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join me on Chereta!")}`;
    telegram?.HapticFeedback?.impactOccurred("medium");
    if (telegram?.openTelegramLink) telegram.openTelegramLink(shareUrl);
    else window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    telegram?.HapticFeedback?.notificationOccurred("success");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background p-6 text-center">
        <div className="mb-4 rounded-2xl bg-muted p-4"><UserIcon className="h-8 w-8 text-muted-foreground" /></div>
        <h3 className="text-base font-bold">Not logged in</h3>
        <p className="mt-1 text-sm text-muted-foreground">Please restart Chereta to authenticate your account.</p>
      </div>
    );
  }

  const initials = `${user.Fname?.charAt(0) || ""}${user.Lname?.charAt(0) || ""}`.toUpperCase() || "U";

  return (
    <div className="min-h-[100dvh] w-full bg-background px-4 pb-32 pt-5 text-foreground">
      <div className="mx-auto max-w-lg space-y-5">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight">{t("profile.title", "My Profile")}</h1>
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[9px]">ACCOUNT</Badge>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Your personal information.</p>
          </div>

        </div>

        {/* PROFILE CARD */}
        <Card className="relative overflow-hidden rounded-3xl border-border shadow-sm">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
          <CardContent className="relative flex flex-col items-center px-5 py-6 text-center">
            <div className="relative mb-3">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-[3px] border-primary/20 bg-primary/10 shadow-md">
                {tgPhoto ? <img src={tgPhoto} alt={user.Fname} className="h-full w-full object-cover" /> : <span className="text-2xl font-extrabold text-primary">{initials}</span>}
              </div>
              <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">{[user.Fname, user.Lname].filter(Boolean).join(" ") || "Chereta User"}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">@{user.username || "no_username"}</p>
            <div className="mt-3 flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
              <ShieldCheck className="h-3 w-3 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* REFERRAL CARD */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold">Invite & Earn</h3>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Share Chereta and earn free bids.</p>
            </div>
            <Gift className="h-5 w-5 text-primary" />
          </div>

          <Card className="overflow-hidden rounded-3xl border-primary/20 bg-primary/[0.02] shadow-sm">
            <CardContent className="space-y-4 p-4">

              {/* PROGRESS SECTION */}
              <div className="rounded-2xl border border-primary/10 bg-background p-3 shadow-inner">
                {isReferralLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-3 w-1/2 mx-auto" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 p-1.5 text-primary"><Ticket className="h-4 w-4" /></div>
                        <div>
                          <p className="text-xs font-bold">1 Free Bid Ticket</p>
                          <p className="text-[9px] text-muted-foreground">Invite {TARGET_INVITES} friends to unlock</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary">{invitedCount}/{TARGET_INVITES}</span>
                    </div>

                    <Progress value={progressPercentage} className="h-2" />

                    <p className="mt-2 text-[9px] text-center text-muted-foreground font-medium">
                      {remainingInvites > 0
                        ? `Invite ${remainingInvites} more friends to get 1 free ticket!`
                        : "Congratulations! You've unlocked a free ticket."}
                    </p>

                    {/* Breakdown Stats */}
                    <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-foreground">{stats?.todayReferrals ?? 0}</span>
                        <span>Today</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-foreground">{stats?.thisWeekReferrals ?? 0}</span>
                        <span>This Week</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-foreground">{stats?.thisMonthReferrals ?? 0}</span>
                        <span>This Month</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* LINK BOX */}
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2.5">
                <Link2 className="h-4 w-4 shrink-0 text-primary" />
                <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-muted-foreground">
                  {referralLink || "Referral link unavailable"}
                </p>
                <Button variant="ghost" size="icon" disabled={!referralLink} onClick={() => handleCopy(referralLink)} className="h-7 w-7 shrink-0 rounded-lg">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* ACTIONS */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" disabled={!referralLink} onClick={() => handleCopy(referralLink)} className="h-10 rounded-xl text-xs font-bold">
                  <Copy className="mr-2 h-3.5 w-3.5" /> Copy Link
                </Button>
                <Button disabled={!referralLink} onClick={handleShareReferral} className="h-10 rounded-xl text-xs font-bold shadow-sm">
                  <Share2 className="mr-2 h-3.5 w-3.5" /> Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ACCOUNT INFORMATION */}
        <section className="space-y-3">
          <div className="px-1"><h3 className="text-sm font-bold">Account Information</h3></div>
          <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
            <CardContent className="divide-y divide-border p-0">

              {/* TELEGRAM ID */}
              <div className="flex items-center gap-3 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Fingerprint className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-muted-foreground">Telegram ID</p>
                  <p className="mt-0.5 font-mono text-xs font-bold tracking-wider">{user.telegram_id || "Not available"}</p>
                </div>
                {user.telegram_id && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleCopy(String(user.telegram_id))}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* PHONE */}
              <div className="flex items-center gap-3 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Phone className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-muted-foreground">Phone Number</p>
                  <p className="mt-0.5 truncate text-xs font-semibold">{user.phone || "Not provided"}</p>
                </div>
              </div>

              {/* REFERRAL ID */}
              <div className="flex items-center gap-3 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Gift className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-muted-foreground">Referral ID</p>
                  <p className="mt-0.5 font-mono text-xs font-bold tracking-wider">{user.referral_id || stats?.referralCode?.trim() || "Not available"}</p>
                </div>
                {(user.referral_id || stats?.referralCode) && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleCopy(user.referral_id || stats?.referralCode?.trim())}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* JOINED DATE */}
              <div className="flex items-center gap-3 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-muted-foreground">Member Since</p>
                  <p className="mt-0.5 text-xs font-semibold">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* PREVIOUS AUCTIONS */}
        <section className="pt-2">
          <PreviousUserBid />
        </section>

        {/* PREFERENCES */}
        <section className="space-y-3">
          <div className="px-1"><h3 className="text-sm font-bold">Preferences</h3></div>
          <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
            <CardContent className="divide-y divide-border p-0">
              <div className="flex items-center gap-3 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Globe className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">Language</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Choose your preferred language.</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 rounded-xl px-2.5 text-xs font-bold">
                      {currentLangCode.toUpperCase()}
                      <ChevronRight className="h-3.5 w-3.5 rotate-90 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {LANGUAGES.map((lang) => (
                      <DropdownMenuItem key={lang.code} onClick={() => changeLanguage(lang.code)} className="flex cursor-pointer items-center justify-between py-2">
                        <span className="text-xs font-medium">{lang.native}</span>
                        {currentLangCode === lang.code && <Check className="h-3.5 w-3.5 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-3 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Moon className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">Appearance</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Toggle dark / light mode.</p>
                </div>
                <ModeToggle />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ACCOUNT ACTIONS */}
        <section className="space-y-3">
          <div className="px-1"><h3 className="text-sm font-bold">Account Actions</h3></div>
          <Button variant="outline" onClick={() => navigate("/my-bids")} className="h-14 w-full justify-between rounded-2xl border-border bg-card px-3.5 shadow-sm">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users className="h-4 w-4" /></span>
              <span className="text-left">
                <span className="block text-xs font-bold">My Bids History</span>
                <span className="block text-[10px] font-normal text-muted-foreground">View your auction activity.</span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="outline" onClick={handleLogout} className="h-11 w-full rounded-2xl border-destructive/20 bg-destructive/5 text-xs font-bold text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </section>

        {/* FOOTER */}
        <div className="space-y-1 pb-4 pt-2 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            <p className="text-xs font-extrabold tracking-wide">CHERETA</p>
          </div>
          <p className="text-[10px] text-muted-foreground">Your marketplace, your opportunity.</p>
          <p className="pt-1 text-[9px] text-muted-foreground/60">Version 1.0.1</p>
        </div>

      </div>
    </div>
  );
}