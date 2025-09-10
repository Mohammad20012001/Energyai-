"use client";

import * as React from "react";
import { Sun, PanelRight, User, Wind, LogOut } from "lucide-react";
import { ReportProvider } from "@/context/ReportContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { handleSignOut } from "@/app/actions/auth";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/dashboard-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";


function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();

  const onSignOut = async () => {
    await handleSignOut();
    router.push('/login');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <User />
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user ? (
          <>
            <DropdownMenuLabel>حسابي</DropdownMenuLabel>
            <DropdownMenuLabel className="font-normal text-xs text-muted-foreground -mt-2">{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/projects">مشاريعي</Link></DropdownMenuItem>
            <DropdownMenuItem>الإعدادات</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </>
        ) : (
           <>
            <DropdownMenuLabel>أنت زائر</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/login">تسجيل الدخول</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/signup">إنشاء حساب</Link></DropdownMenuItem>
           </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


function InnerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = React.usePathname();

  React.useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/signup') {
       router.replace('/login');
    }
  }, [user, loading, router, pathname]);

  if (loading && pathname !== '/login' && pathname !== '/signup') {
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <Sun className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!user && pathname !== '/login' && pathname !== '/signup') {
    return null;
  }
  
  if (user && (pathname === '/login' || pathname === '/signup')) {
      router.replace('/');
      return (
        <div className="flex h-screen w-full items-center justify-center">
          <Sun className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  if (pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <ReportProvider>
        <Sidebar side="left" collapsible="icon" className="border-r border-sidebar-border">
          <SidebarHeader className="h-16 items-center justify-center p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-full text-primary hover:bg-primary/10 hover:text-primary"
                asChild
              >
                <Link href="/">
                  <Sun className="size-5" />
                </Link>
              </Button>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <h2 className="font-headline text-lg font-bold text-sidebar-foreground">
                  Jordan Solar Architect
                </h2>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <DashboardNav />
          </SidebarContent>
          <SidebarFooter>
            {/* Footer content if needed */}
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <SidebarTrigger>
              <PanelRight />
            </SidebarTrigger>
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </ReportProvider>
    </SidebarProvider>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <InnerLayout>{children}</InnerLayout>
    </AuthProvider>
  )
}
