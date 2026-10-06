import { redirect } from "next/navigation";
import AuthLayout from "@/Components/AuthLayout";
import AuthenticatorSetup from "@/Components/AuthenticatorSetup";
import { getAdminIdentity, createSupabaseAuthClient } from "@/lib/supabase/server";
import { logout } from "@/app/admin/actions";
export default async function MfaPage() {
 if(!await getAdminIdentity())redirect("/admin/login");
 const supabase=await createSupabaseAuthClient();
 const {data,error}=await supabase.auth.mfa.listFactors();
 const factor=data?.totp.find(f=>f.status==="verified");
 return <AuthLayout admin title={factor?"One more step.":"Protect your workspace."} description={factor?"Enter the current code from your authenticator app.":"Set up two-factor authentication before accessing the admin workspace."}>{error?<p role="alert">Unable to load security settings. Refresh to try again.</p>:<AuthenticatorSetup factorId={factor?.id}/>}<form className="fm-auth-alt" action={logout}><button type="submit">Sign out</button></form></AuthLayout>;
}
