"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import clsx from "clsx";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-base font-semibold text-slate-900">
            MeetingPrep<span className="text-brand-500">.ai</span>
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-sm hover:bg-slate-50"
          >
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt=""
                width={28}
                height={28}
                className="rounded-full"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {session?.user?.name?.[0] ?? "U"}
              </span>
            )}
            <span className="hidden max-w-[10rem] truncate sm:inline">
              {session?.user?.name ?? session?.user?.email}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-card">
              <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500 sm:hidden">
                <div className="flex flex-col gap-1">
                  {links.map((link) => (
                    <Link key={link.href} href={link.href} className="text-slate-700">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
