import { Avatar, Button } from "@heroui/react";
import { AlertTriangle, BarChart3, ClipboardCheck, FileClock, HardDrive, Home, LogOut, Menu, ShieldCheck, UserRound, Wrench } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { MODULE_ACCESS, ROLE_LABELS } from "../lib/options.js";

const NAV_ITEMS = [
  { key: "dashboard", label: "值班主页", path: "/", icon: Home },
  { key: "assets", label: "资产台账", path: "/assets", icon: HardDrive },
  { key: "inspections", label: "巡检任务", path: "/inspections", icon: ClipboardCheck },
  { key: "faults", label: "故障登记", path: "/faults", icon: Wrench },
  { key: "duty", label: "值班记录", path: "/duty", icon: FileClock },
  { key: "alerts", label: "告警通知", path: "/alerts", icon: AlertTriangle },
  { key: "logs", label: "操作日志", path: "/logs", icon: BarChart3 },
  { key: "profile", label: "个人中心", path: "/profile", icon: UserRound },
];

export default function Shell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const allowed = MODULE_ACCESS[user?.role] || [];
  const pageTitle = NAV_ITEMS.find((item) => item.path === location.pathname)?.label || "值班主页";
  const visibleItems = NAV_ITEMS.filter((item) => allowed.includes(item.key));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <strong>运维值班门户</strong>
            <span>资产巡检与故障闭环</span>
          </div>
        </div>
        <nav>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.key} to={item.path} end={item.path === "/"} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="top-title">
            <Menu size={20} />
            <div>
              <h1>{pageTitle}</h1>
              <span>{ROLE_LABELS[user?.role] || "运维人员"} · {user?.display_name || user?.username}</span>
            </div>
          </div>
          <div className="top-user">
            <Avatar name={user?.display_name || user?.username} size="sm" />
            <div>
              <strong>{user?.display_name || user?.username}</strong>
              <span>{ROLE_LABELS[user?.role]}</span>
            </div>
            <Button variant="flat" color="danger" startContent={<LogOut size={16} />} onPress={logout}>
              退出
            </Button>
          </div>
        </header>
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
