"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, CircleHelp, UserRound } from "lucide-react";

const items = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/support", label: "サポート", icon: CircleHelp },
  { href: "/me", label: "私", icon: UserRound },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="主要メニュー">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "nav-item active" : "nav-item"}>
            <Icon size={24} strokeWidth={2.2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
