import { Card, CardContent } from "@heroui/react";
import { AlertTriangle, ClipboardCheck, HardDrive, UsersRound, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import StatusChip from "../components/StatusChip.jsx";
import { dashboardApi } from "../lib/api.js";

const METRIC_ITEMS = [
  { key: "todayInspections", label: "今日巡检数", icon: ClipboardCheck, suffix: "项" },
  { key: "openAlerts", label: "未处理告警数", icon: AlertTriangle, suffix: "条" },
  { key: "onlineDutyUsers", label: "值班在线人数", icon: UsersRound, suffix: "人" },
  { key: "faultCloseRate", label: "故障关闭率", icon: Wrench, suffix: "%" },
  { key: "assetNormalRate", label: "资产正常率", icon: HardDrive, suffix: "%" },
];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    dashboardApi.metrics().then(setMetrics);
  }, []);

  return (
    <div className="dashboard-page">
      <section className="workbench-hero">
        <div>
          <span>值班工作台</span>
          <h2>巡检、告警、故障处理集中掌控</h2>
          <p>关键指标随业务数据实时刷新，异常巡检会自动沉淀为告警与故障记录。</p>
        </div>
        <div className="hero-side">
          <strong>{metrics?.pendingTasks ?? "-"}</strong>
          <span>待推进巡检任务</span>
        </div>
      </section>

      <section className="metric-grid">
        {METRIC_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.key} className="metric-card" shadow="none">
              <CardContent>
                <div className="metric-icon">
                  <Icon size={20} />
                </div>
                <span>{item.label}</span>
                <strong>
                  {metrics ? metrics[item.key] : "-"}
                  <small>{item.suffix}</small>
                </strong>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="dashboard-grid">
        <Card className="panel-card chart-card" shadow="none">
          <CardContent>
            <div className="panel-title">
              <h3>近 7 日巡检与告警</h3>
              <span>按真实数据库统计</span>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={metrics?.trend || []}>
                  <defs>
                    <linearGradient id="inspection" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.26} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="alert" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="inspection" name="巡检" stroke="#0f766e" fill="url(#inspection)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="alert" name="告警" stroke="#d97706" fill="url(#alert)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="panel-card list-card" shadow="none">
          <CardContent>
            <div className="panel-title">
              <h3>最新告警</h3>
              <span>待运维人员处理</span>
            </div>
            <div className="compact-list">
              {(metrics?.latestAlerts || []).map((item) => (
                <div key={item.id} className="compact-item">
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.asset__name || "未关联资产"}</span>
                  </div>
                  <StatusChip value={item.status} label={item.status === "closed" ? "已关闭" : item.status === "processing" ? "处理中" : "待处理"} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="panel-card list-card" shadow="none">
          <CardContent>
            <div className="panel-title">
              <h3>近期巡检任务</h3>
              <span>排班与执行状态</span>
            </div>
            <div className="compact-list">
              {(metrics?.recentTasks || []).map((item) => (
                <div key={item.id} className="compact-item">
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.asset__name} · {item.scheduled_date}</span>
                  </div>
                  <StatusChip value={item.status} label={item.status === "completed" ? "已完成" : item.status === "pending" ? "待执行" : item.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
