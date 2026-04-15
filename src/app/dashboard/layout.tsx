'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Squares2X2Icon, 
  BuildingOffice2Icon,
  UsersIcon, 
  ClockIcon, 
  ChatBubbleLeftRightIcon, 
  Cog8ToothIcon,
  ArrowLeftOnRectangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon },
    { name: 'Institutions', href: '/dashboard/institutions', icon: BuildingOffice2Icon },
    { name: 'Queue', href: '/dashboard/review', icon: ChatBubbleLeftRightIcon },
    { name: 'Users', href: '/dashboard/users', icon: UsersIcon },
    { name: 'History', href: '/dashboard/history', icon: ClockIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Cog8ToothIcon },
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-white overflow-hidden">
      {/* Sidebar — Glassmorphism */}
      <aside className="w-20 lg:w-64 flex-shrink-0 flex flex-col items-center lg:items-start py-8 bg-white/5 border-r border-white/10 backdrop-blur-xl transition-all duration-300 z-50">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 mb-12">
          <div className="p-2 bg-gradient-to-br from-cyber-blue to-vivid-purple rounded-xl flex-shrink-0">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <span className="hidden lg:block font-bold text-xl tracking-wide">Orchestrator</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 w-full px-4 space-y-2">
          {navItems.map((item) => {
            // Exact match for dashboard root, prefix match for sub-pages
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-transparent border-l-2 border-purple-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="hidden lg:block font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Log Out */}
        <div className="w-full px-4 mt-auto">
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all duration-200"
          >
            <ArrowLeftOnRectangleIcon className="w-6 h-6 flex-shrink-0" />
            <span className="hidden lg:block font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full" />
        <div className="relative z-10 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
