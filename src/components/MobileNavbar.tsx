
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Menu,
  LayoutDashboard, 
  MessageCircle, 
  FileText, 
  Settings, 
  Activity,
  Camera,
  BarChart3,
  Brain,
  Bell,
  X
} from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: "Live Monitoring",
    url: "/dashboard/monitoring",
    icon: Activity,
    badge: "Live",
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
    badge: null,
  },
  {
    title: "Health Records",
    url: "/dashboard/health",
    icon: FileText,
    badge: null,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
    badge: null,
  },
];

const quickActions = [
  {
    title: "AI Assistant",
    url: "/dashboard/chat",
    icon: MessageCircle,
    badge: null,
  },
  {
    title: "Camera Analysis",
    url: "/dashboard/camera",
    icon: Camera,
    badge: null,
  },
  {
    title: "Stress Alerts",
    url: "/dashboard/alerts",
    icon: Bell,
    badge: null,
  },
];

export function MobileNavbar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">StressGuard</h2>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 bg-slate-900 text-white border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">StressGuard</h2>
                  <p className="text-sm text-slate-400">AI-Powered Monitoring</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Main Navigation */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Main Navigation</h3>
                <div className="space-y-1">
                  {navigationItems.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge 
                          className={`text-xs ${
                            item.badge === "Live" 
                              ? "bg-red-500/20 text-red-400 border-red-500/30" 
                              : item.badge === "New"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Quick Actions</h3>
                <div className="space-y-1">
                  {quickActions.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge 
                          className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
