import { Button, Input } from "@heroui/react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import FormModal from "../components/FormModal.jsx";
import { Field, TextInput } from "../components/FormFields.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotify } from "../context/NotificationContext.jsx";
import { authApi } from "../lib/api.js";
import { loginSchema, parseForm, registerSchema } from "../lib/schemas.js";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", password: "", display_name: "", email: "", phone: "" });
  const [registerOpen, setRegisterOpen] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const { login } = useAuth();
  const notify = useNotify();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const payload = parseForm(loginSchema, form);
      await login(payload);
      notify.success("登录成功");
      navigate("/", { replace: true });
    } catch (error) {
      if (!error._isBusinessError) notify.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    try {
      setRegisterLoading(true);
      const payload = parseForm(registerSchema, registerForm);
      await authApi.register(payload);
      notify.success("注册成功，请等待管理员分配权限");
      setRegisterOpen(false);
      setRegisterForm({ username: "", password: "", display_name: "", email: "", phone: "" });
    } catch (error) {
      if (!error._isBusinessError) notify.error(error.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-brand-panel">
          <div className="brand-badge">
            <ShieldCheck size={18} />
            运维值班与资产巡检门户
          </div>
          <div className="login-copy">
            <h1>让值班、巡检、故障处理形成可追踪闭环</h1>
            <p>面向机房、资产和告警现场的统一工作入口，帮助值班员接收任务、运维工程师处理异常、管理人员掌握运行质量。</p>
          </div>
          <div className="login-metrics">
            <div>
              <strong>24h</strong>
              <span>值班在线</span>
            </div>
            <div>
              <strong>5类</strong>
              <span>资产状态</span>
            </div>
            <div>
              <strong>闭环</strong>
              <span>异常追踪</span>
            </div>
          </div>
          <div className="login-preview">
            <div className="preview-row">
              <span>今日巡检</span>
              <b>待执行 8 项</b>
            </div>
            <div className="preview-progress">
              <i style={{ width: "68%" }} />
            </div>
            <div className="preview-grid">
              <div>
                <small>告警处理</small>
                <strong>处理中</strong>
              </div>
              <div>
                <small>资产状态</small>
                <strong>稳定</strong>
              </div>
            </div>
          </div>
        </section>
        <section className="login-form-panel">
          <div className="login-form-card">
            <div>
              <h2>登录值班门户</h2>
              <p>请输入账号信息进入工作台</p>
            </div>
            <form onSubmit={submit} className="login-form">
              <Input
                label="用户名"
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                startContent={<UserRound size={18} />}
                variant="bordered"
                isRequired
              />
              <Input
                label="密码"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                type={showPwd ? "text" : "password"}
                startContent={<LockKeyhole size={18} />}
                endContent={
                  <button type="button" className="password-eye" onClick={() => setShowPwd((value) => !value)} aria-label={showPwd ? "隐藏密码" : "显示密码"}>
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                variant="bordered"
                isRequired
              />
              <Button type="submit" color="primary" size="lg" isLoading={loading}>
                进入门户
              </Button>
            </form>
            <div className="login-foot">
              <span>新成员需要账号？</span>
              <button type="button" onClick={() => setRegisterOpen(true)}>
                申请注册
              </button>
            </div>
          </div>
        </section>
      </div>

      <FormModal open={registerOpen} title="申请注册账号" loading={registerLoading} onClose={() => setRegisterOpen(false)} onSubmit={submitRegister} submitText="提交申请" width="620px">
        <div className="form-grid two">
          <Field label="用户名" required>
            <TextInput value={registerForm.username} onChange={(value) => setRegisterForm((current) => ({ ...current, username: value }))} placeholder="请输入用户名" />
          </Field>
          <Field label="密码" required>
            <TextInput value={registerForm.password} type="password" onChange={(value) => setRegisterForm((current) => ({ ...current, password: value }))} placeholder="至少 6 位" />
          </Field>
          <Field label="姓名">
            <TextInput value={registerForm.display_name} onChange={(value) => setRegisterForm((current) => ({ ...current, display_name: value }))} placeholder="请输入姓名" />
          </Field>
          <Field label="手机号">
            <TextInput value={registerForm.phone} onChange={(value) => setRegisterForm((current) => ({ ...current, phone: value }))} placeholder="可选，11 位手机号" />
          </Field>
          <Field label="邮箱" className="span-2">
            <TextInput value={registerForm.email} onChange={(value) => setRegisterForm((current) => ({ ...current, email: value }))} placeholder="可选，填写后需符合邮箱格式" />
          </Field>
        </div>
      </FormModal>
    </div>
  );
}
