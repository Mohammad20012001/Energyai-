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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/string-configuration", label: "String Config", icon: Settings },
  { href: "/panel-calculator", label: "Panel Calculator", icon: Calculator },
  { href: "/wire-sizing", label: "Wire Sizing", icon: Zap },
  { href: "/inverter-sizing", label: "Inverter Sizing", icon: BatteryCharging },
  { href: "/pricing", label: "Pricing Data", icon: DollarSign },
  { href: "/report", label: "Report", icon: FileText },
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
