import PasswordFields from "@/Components/PasswordFields";
import { redirect } from "next/navigation";
import AuthLayout from "@/Components/AuthLayout";
import SubmitButton from "@/Components/SubmitButton";
import { updateStudentPassword } from "@/app/student-actions";
import { getStudentUser } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/redirect";
import { canResetPassword } from "@/lib/auth/recovery";
export default async function UpdatePasswordPage({searchParams}) {
 const query=await searchParams,next=safeNext(query.next);
 const user=await getStudentUser();
 if(!user||!await canResetPassword(user.id))redirect("/reset-password?message=Open+the+reset+link+from+your+email+first.");
 return <AuthLayout title="Choose a new password." description="Use a unique password of at least 12 characters.">{query.error&&<p role="alert" className="form-error">{query.error}</p>}<form className="admin-form fm-auth-form" action={updateStudentPassword}><input type="hidden" name="next" value={next}/><PasswordFields label="New password"/><SubmitButton pendingLabel="Updating...">Update password</SubmitButton></form></AuthLayout>;
}
