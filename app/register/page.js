import Link from "next/link";
import AuthLayout from "@/Components/AuthLayout";
import SubmitButton from "@/Components/SubmitButton";
import { studentRegister } from "@/app/student-actions";
import { safeNext } from "@/lib/auth/redirect";
export const metadata={title:"Create your account"};
export default async function RegisterPage({searchParams}) {
 const query=await searchParams,next=safeNext(query.next);
 return <AuthLayout title="Make your next move." description="Create your account, verify your email and start learning.">
 {query.error&&<p role="alert" className="form-error">{query.error}</p>}
 <form className="admin-form fm-auth-form" action={studentRegister}><input type="hidden" name="next" value={next}/><label>Full name<input name="fullName" autoComplete="name" maxLength={120} required/><small>This name appears on your certificate.</small></label><label>Email<input name="email" type="email" autoComplete="email" required/></label><label>Password<input name="password" type="password" autoComplete="new-password" minLength={12} required/><small>Use at least 12 characters.</small></label><label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required/></label><SubmitButton pendingLabel="Creating account...">Create account</SubmitButton></form>
 <p className="fm-auth-alt">Already registered? <Link href={"/login?next="+encodeURIComponent(next)}>Sign in</Link></p></AuthLayout>;
}
