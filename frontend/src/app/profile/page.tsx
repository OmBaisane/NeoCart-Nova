"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, refetchUser } = useAuth();

  // Profile details state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI feedback states
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync state when user context is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setStreet(user.address?.street || "");
      setCity(user.address?.city || "");
      setState(user.address?.state || "");
      setPincode(user.address?.pincode || "");
    }
  }, [user]);

  // 1. Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch("/users/profile", {
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: {
          street: street.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          pincode: pincode.trim() || undefined,
        },
      });
      return res.data;
    },
    onSuccess: async () => {
      setProfileSuccess(true);
      setProfileError(null);
      await refetchUser();
      setTimeout(() => setProfileSuccess(false), 4000);
    },
    onError: (err: any) => {
      setProfileError(err.message || "Failed to update profile details.");
    },
  });

  // 2. Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch("/users/password", {
        currentPassword,
        newPassword,
      });
      return res.data;
    },
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    },
    onError: (err: any) => {
      setPasswordError(err.message || "Failed to update password.");
    },
  });

  if (isAuthLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center">
        <UserIcon className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 text-xl font-bold text-brand-charcoal">
          Sign In to Manage Your Account
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          Your saved addresses and security settings require an active session.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-brand-blue px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-600"
        >
          Sign In
        </Link>
      </main>
    );
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (name.trim().length < 2) {
      setProfileError("Full name must be at least 2 characters long.");
      return;
    }

    updateProfileMutation.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    changePasswordMutation.mutate();
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl">
            Account Settings
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage your personal identity, default delivery address, and
            security credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue uppercase tracking-wider">
            Role: {user.role}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Active Session
          </span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Profile Information & Saved Address */}
        <section className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleProfileSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserIcon className="h-4 w-4 text-brand-blue" />
              <h2 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">
                Personal Information & Delivery Details
              </h2>
            </div>

            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            {profileError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Full Name *
                </label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue"
                  />
                  <UserIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address (Locked)
                </label>
                <div className="relative mt-1">
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-500 cursor-not-allowed"
                  />
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Phone Number
              </label>
              <div className="relative mt-1">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue"
                />
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Saved Address Block */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-blue" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                  Default Shipping Address
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Street Address
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. 402 Nova Heights, Link Road"
                  className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-xs outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Surat"
                    className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-xs outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Gujarat"
                    className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-xs outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 395007"
                    className="mt-1 w-full rounded-lg border border-slate-300 py-2 px-3 text-xs outline-none focus:border-brand-blue"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-blue py-2.5 px-6 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-60"
            >
              {updateProfileMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              <span>Save Changes</span>
            </button>
          </form>
        </section>

        {/* Right Col: Password Change & Security */}
        <aside className="space-y-6">
          <form
            onSubmit={handlePasswordSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="h-4 w-4 text-brand-blue" />
              <h2 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">
                Change Password
              </h2>
            </div>

            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Password updated successfully!</span>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Current Password *
              </label>
              <div className="relative mt-1">
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue"
                />
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                New Password (Min. 8 chars) *
              </label>
              <div className="relative mt-1">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue"
                />
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Confirm New Password *
              </label>
              <div className="relative mt-1">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue"
                />
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 px-4 text-xs font-bold text-white hover:bg-brand-blue disabled:opacity-60 transition"
            >
              {changePasswordMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              <span>Update Password</span>
            </button>
          </form>

          {/* Security Information Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-brand-blue" />
              <span>Security Standards</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Passwords are salted and hashed via bcrypt before database
              storage. Your active session is bound to secure HttpOnly cookies,
              guarding against client-side script tampering.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
