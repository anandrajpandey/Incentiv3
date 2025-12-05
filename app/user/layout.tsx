"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, FileImage, LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet-button";

const menu = [
  {
    label: "Dashboard",
    href: "/user/dashboard",
    icon: Home,
  },
  {
    label: "Image Converter",
    href: "/user/tools/image-converter",
    icon: FileImage,
  },
  {
    label: "More Tools Soon",
    href: "#",
    icon: Layers,
  },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-[#030014] text-white">
      {/* Sidebar */}
      <aside className="w-60 p-5 bg-black/40 border-r border-violet-600/30 backdrop-blur-xl">
        <div className="text-xl font-bold text-violet-300 mb-8">
          Incentiv3 User Hub
        </div>

        <div className="space-y-3">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md transition
                    ${
                      active
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                        : "hover:bg-slate-800/70 text-slate-300"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="absolute bottom-5 left-5 flex gap-2">
          <WalletButton />
          <Button
            size="sm"
            className="bg-red-700/50 hover:bg-red-600/50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
