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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  // { href: "/chat", label: "المساعد الذكي", icon: MessageCircle },
  { href: "/string-configuration", label: "تهيئة السلاسل", icon: Settings },
  { href: "/panel-calculator", label: "حاسبة الألواح", icon: Calculator },
  { href: "/area-calculator", label: "حاسبة المساحة", icon: Maximize },
  { href: "/financial-viability", label: "الجدوى الاقتصادية", icon: TrendingUp },
  { href: "/wire-sizing", label: "حجم الأسلاك", icon: Zap },
  { href: "/inverter-sizing", label: "حجم العاكس", icon: BatteryCharging },
  { href: "/pricing", label: "بيانات التسعير", icon: DollarSign },
  { href: "/report", label: "التقرير", icon: FileText },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu className="p-2">
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} legacyBehavior passHref>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={{ children: item.label }}
              className="justify-start"
            >
              <a>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
