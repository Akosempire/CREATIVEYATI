import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PublicHeader from "@/Components/PublicHeader";
import PaymentButton from "@/Components/PaymentButton";
import { getSiteContent } from "@/lib/data/site";
import { getPublicCourseById, coursePrice, formatMoney } from "@/lib/data/courses";
import { getStudentUser, createSupabaseServiceClient } from "@/lib/supabase/server";
export const metadata={title:"Complete your enrolment"};
export default async function CheckoutPage({params}) {
 const {courseId}=await params,user=await getStudentUser();
 if(!user)redirect("/login?next="+encodeURIComponent("/checkout/"+courseId));
 const [course,site]=await Promise.all([getPublicCourseById(courseId),getSiteContent()]);
 if(!course)notFound();
 const service=createSupabaseServiceClient();
 const {data:enrolment}=service?await service.from("enrolments").select("id").eq("student_id",user.id).eq("course_id",course.id).eq("active",true).maybeSingle():{data:null};
 if(enrolment)redirect("/learn/"+course.slug);
 const price=coursePrice(course),discount=Math.max(0,course.priceMinor-price);
 const modules=course.sections||[],lessons=modules.flatMap(module=>module.lessons||[]);
 return <main className="public-page"><PublicHeader site={site}/><div className="checkout-layout"><section className="checkout-panel"><p className="eyebrow">YOUR COURSE</p>{course.coverImageUrl&&<Image src={course.coverImageUrl} alt="" width={640} height={360} unoptimized/>}<h1>{course.title}</h1><p>{course.shortDescription||course.description}</p><p>{modules.length} modules / {lessons.length} lessons</p><Link className="inline-link" href={"/courses/"+course.slug}>Review curriculum</Link><dl><div><dt>Course price</dt><dd>{formatMoney(course.priceMinor,course.currency)}</dd></div>{discount>0&&<div><dt>Discount</dt><dd>-{formatMoney(discount,course.currency)}</dd></div>}<div><dt><strong>Total before coupon</strong></dt><dd><strong>{price===0?"Free":formatMoney(price,course.currency)}</strong></dd></div></dl></section>
 <section className="checkout-panel"><div className="checkout-steps"><span>1. Account verified</span><strong>2. Enrolment</strong><span>3. Start learning</span></div><h2>{price===0?"You're ready to learn.":"Complete your enrolment."}</h2><p>{price===0?"Confirm your details to join this course.":"After your payment is confirmed, your course and receipt appear in your dashboard."}</p>
 {!user.email_confirmed_at?<p className="form-error"><Link href={"/verify-email?next="+encodeURIComponent("/checkout/"+courseId)}>Verify your email to continue.</Link></p>:<form className="checkout-form"><label>Email<input value={user.email||""} readOnly/></label>{price>0&&<label>Coupon code (optional)<input name="couponCode" autoComplete="off"/><small>Valid discounts are applied before opening checkout.</small></label>}<PaymentButton courseId={course.id} isFree={price===0}/></form>}
 <p className="secure-note">{price===0?"No payment details required.":"Payments are processed by Bachs. We never collect your card details."}</p><p><Link className="inline-link" href="/contact">Need help with your purchase?</Link></p></section></div></main>;
}
