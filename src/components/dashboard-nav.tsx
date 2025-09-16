
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  FileText,
  LayoutDashboard,
  Settings,
  Zap,
  BatteryCharging,
  DollarSign,
  Maximize,
  TrendingUp,
  MessageCircle,
  Wind,
  Bot,
  Combine,
  BrainCircuit,
  ListChecks,
  CalendarClock,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { type: 'divider', label: 'AI Tools'},
  { href: "/chat", label: "المساعد الذكي", icon: MessageCircle },
  { href: "/live-simulation", label: "المحاكاة الحية", icon: Wind },
  { href: "/design-optimizer", label: "حاسبة حجم النظام", icon: BrainCircuit },
  { href: "/field-inspector", label: "المفتش الميداني", icon: Camera },
  { type: 'divider', label: 'Calculators'},
  { href: "/string-configuration", label: "تهيئة السلاسل", icon: Settings },
  { href: "/area-calculator", label: "حاسبة المساحة", icon: Maximize },
  { href: "/battery-storage", label: "حاسبة البطاريات", icon: BatteryCharging },
  { href: "/wire-sizing", label: "حجم الأسلاك", icon: Zap },
  { type: 'divider', label: 'Data & Reports'},
  { href: "/pricing", label: "بيانات التسعير", icon: DollarSign },
  { href: "/report", label: "التقرير", icon: FileText },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu className="p-2">
      {navItems.map((item, index) => (
        item.type === 'divider' ? (
           <div key={`divider-${index}`} className="text-xs text-sidebar-foreground/50 font-semibold uppercase tracking-wider px-2 pt-4 pb-1 group-data-[collapsible=icon]:hidden">
            {item.label}
          </div>
        ) : (
        <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={{ children: item.label }}
              className="justify-start"
            >
              <Link href={item.href!}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
        )
      ))}
    </SidebarMenu>
  );
}
