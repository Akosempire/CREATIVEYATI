import { saveEmailSettings, testEmailSettings } from "@/app/admin/actions";
import { getStoredEmailSettings } from "@/lib/data/settings";

export default async function EmailSettings({ searchParams }) {
  const [settings, query] = await Promise.all([getStoredEmailSettings(), searchParams]);
  const hasApiKey = Boolean(process.env.SENDHIIV_API_KEY);
  return <>
    <div className="admin-title"><p>SETTINGS</p><h1>Email delivery</h1><p className="admin-lede">Notifications are sent through Sendhiiv. The server holds the Sendhiiv API key in SENDHIIV_API_KEY; this page only stores who mail is sent from and who receives enquiry alerts.</p></div>
    {query.saved && <p className="success-note">Email delivery settings updated.</p>}
    {query.tested && <p className="success-note">Test email sent successfully.</p>}
    {query.error && <p className="form-error">{query.error}</p>}
    {!hasApiKey && <p className="form-error">SENDHIIV_API_KEY is not set on the server, so no email can be sent yet.</p>}
    <form className="admin-form" action={saveEmailSettings}>
      <label className="check-label form-wide"><input name="enabled" type="checkbox" defaultChecked={settings.enabled} /> Enable enquiry email notifications</label>
      <label>From name<input name="fromName" defaultValue={settings.fromName} placeholder="CreativeYati Portfolio" /></label>
      <label>From email<input name="fromEmail" type="email" defaultValue={settings.fromEmail} /></label>
      <label className="form-wide">Notification recipient<input name="recipientEmail" type="email" defaultValue={settings.recipientEmail} /></label>
      <button className="button">Save email settings</button>
    </form>
    <form className="admin-test-form" action={testEmailSettings}><button className="button button-secondary" type="submit" disabled={!settings.enabled || !hasApiKey}>Send test email</button><small>Save first, then send a live test through Sendhiiv to the notification recipient.</small></form>
  </>;
}
