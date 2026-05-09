import { Button, Card, CardContent } from "@heroui/react";
import { KeyRound, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Field, TextInput } from "../components/FormFields.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotify } from "../context/NotificationContext.jsx";
import { authApi } from "../lib/api.js";
import { ROLE_LABELS } from "../lib/options.js";
import { parseForm, profileSchema } from "../lib/schemas.js";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const notify = useNotify();
  const [form, setForm] = useState({ display_name: "", department: "", email: "", phone: "", new_password: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      display_name: user?.display_name || "",
      department: user?.department || "",
      email: user?.email || "",
      phone: user?.phone || "",
      new_password: "",
    });
  }, [user]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = parseForm(profileSchema, form);
      const data = await authApi.updateMe(payload);
      updateUser(data);
      setForm((current) => ({ ...current, new_password: "" }));
      notify.success("个人资料已更新");
    } catch (error) {
      if (!error._isBusinessError) notify.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <Card className="profile-summary" shadow="none">
        <CardContent>
          <div className="profile-avatar">
            <UserRound size={30} />
          </div>
          <div>
            <h2>{user?.display_name || user?.username}</h2>
            <p>{ROLE_LABELS[user?.role]} · {user?.department || "运维中心"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="profile-form-card" shadow="none">
        <CardContent>
          <div className="panel-title">
            <h3>个人资料</h3>
            <span>修改后页面右上角信息会同步更新</span>
          </div>
          <form className="profile-form" onSubmit={submit}>
            <div className="profile-grid">
              <Field label="姓名" required>
                <TextInput value={form.display_name} maxLength={40} onChange={(value) => setForm((current) => ({ ...current, display_name: value }))} />
              </Field>
              <Field label="部门">
                <TextInput value={form.department} maxLength={40} onChange={(value) => setForm((current) => ({ ...current, department: value }))} />
              </Field>
              <Field label="手机号">
                <TextInput value={form.phone} maxLength={11} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} placeholder="可为空，填写需符合手机号格式" />
              </Field>
              <Field label="邮箱">
                <TextInput value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} placeholder="可为空，填写需符合邮箱格式" />
              </Field>
              <Field label="新密码" className="password-field">
                <TextInput type="password" value={form.new_password} onChange={(value) => setForm((current) => ({ ...current, new_password: value }))} placeholder="不修改请留空" />
              </Field>
            </div>
            <div className="profile-actions">
              <Button type="submit" color="primary" isLoading={saving} startContent={form.new_password ? <KeyRound size={16} /> : <Save size={16} />}>
                保存修改
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
