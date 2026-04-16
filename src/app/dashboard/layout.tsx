'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  Squares2X2Icon, 
  BuildingOffice2Icon,
  UsersIcon, 
  ClockIcon, 
  ChatBubbleLeftRightIcon, 
  Cog8ToothIcon,
  ArrowLeftOnRectangleIcon,
  SparklesIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon },
    { name: 'Institutions', href: '/dashboard/institutions', icon: BuildingOffice2Icon },
    { name: 'Queue', href: '/dashboard/review', icon: ChatBubbleLeftRightIcon },
    { name: 'Users', href: '/dashboard/users', icon: UsersIcon },
    { name: 'History', href: '/dashboard/history', icon: ClockIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Cog8ToothIcon },
  ];

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white overflow-hidden transition-colors duration-300">
      {/* Desktop Sidebar — Glassmorphism */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col items-start py-8 bg-white/50 dark:bg-white/5 border-r border-slate-200 dark:border-white/10 backdrop-blur-xl transition-all duration-300 z-50">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 mb-12">
          <div className="p-2 bg-gradient-to-br from-cyber-blue to-vivid-purple rounded-xl flex-shrink-0">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-wide">Orchestrator</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 w-full px-4 space-y-2">
          {navItems.map((item) => {
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
                    ? 'bg-gradient-to-r from-purple-500/10 dark:from-purple-500/20 to-transparent border-l-2 border-purple-500 text-purple-700 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:dark:text-white hover:bg-slate-100 hover:dark:bg-white/5'
                }`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme & Log Out */}
        <div className="w-full px-4 mt-auto space-y-2">
          <ThemeToggle fullWidth />
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:dark:text-red-400 hover:bg-red-50 hover:dark:bg-white/5 rounded-xl transition-all duration-200"
          >
            <ArrowLeftOnRectangleIcon className="w-6 h-6 flex-shrink-0" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-[#020617]/90 backdrop-blur-lg border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-br from-cyber-blue to-vivid-purple rounded-lg">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Orchestrator</span>
        </div>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-50 dark:bg-[#020617] border-r border-slate-200 dark:border-white/10 backdrop-blur-xl transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-cyber-blue to-vivid-purple rounded-lg">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Orchestrator</span>
          </div>
          <button
            onClick={closeMobileMenu}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeMobileMenu}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/10 dark:from-purple-500/20 to-transparent border-l-2 border-purple-500 text-purple-700 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:dark:text-white hover:bg-slate-100 hover:dark:bg-white/5'
                }`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Theme & Log Out */}
        <div className="px-4 py-4 border-t border-slate-200 dark:border-white/10 space-y-2 mt-auto">
          <ThemeToggle fullWidth />
          <button
            onClick={() => {
              closeMobileMenu();
              signOut({ callbackUrl: '/auth/signin' });
            }}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:dark:text-red-400 hover:bg-red-50 hover:dark:bg-white/5 rounded-xl transition-all duration-200"
          >
            <ArrowLeftOnRectangleIcon className="w-6 h-6 flex-shrink-0" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile when menu is open */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative pt-14 lg:pt-0">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full" />
        <div className="relative z-10 p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
