import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PublicHeader from "@/Components/PublicHeader";
import CheckoutForm from "@/Components/CheckoutForm";
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
 const verified=Boolean(user.email_confirmed_at);
 const steps=[
   {label:"Account verified",state:verified?"done":"current"},
   {label:"Enrolment",state:verified?"current":"upcoming"},
   {label:"Start learning",state:"upcoming"},
 ];

 return <main className="public-page learning-store learning-checkout"><PublicHeader site={site}/><header className="checkout-heading learning-container"><Link className="inline-link" href={"/courses/"+course.slug}>&larr; Back to course</Link><p className="eyebrow">ONE STEP CLOSER TO YOUR NEXT CHAPTER</p><h1>Make it yours.</h1><p>Your next creative project starts here.</p></header><div className="checkout-layout">
  <aside className="checkout-summary">
    <p className="eyebrow">01 / YOUR COURSE</p>
    {course.coverImageUrl&&<Image src={course.coverImageUrl} alt={`${course.title} cover`} width={640} height={360} unoptimized/>}
    <h2>{course.title}</h2>
    <p className="checkout-summary-copy">{course.shortDescription||course.description}</p>
    <p className="checkout-summary-meta">{modules.length} module{modules.length===1?"":"s"} / {lessons.length} lesson{lessons.length===1?"":"s"}</p>
    <Link className="inline-link" href={"/courses/"+course.slug}>Review curriculum</Link>
    <dl className="checkout-totals">
      <div><dt>Course price</dt><dd>{formatMoney(course.priceMinor,course.currency)}</dd></div>
      {discount>0&&<div><dt>Discount</dt><dd>-{formatMoney(discount,course.currency)}</dd></div>}
      <div className="checkout-total"><dt>Total before coupon</dt><dd>{price===0?"Free":formatMoney(price,course.currency)}</dd></div>
    </dl>
  </aside>

  <section className="checkout-panel">
    <ol className="checkout-stepper">{steps.map((step,index)=><li key={step.label} data-state={step.state} aria-current={step.state==="current"?"step":undefined}><span className="checkout-stepper-mark" aria-hidden="true">{step.state==="done"?"✓":index+1}</span><span>{step.label}</span></li>)}</ol>
    <p className="eyebrow">02 / YOUR ENROLMENT</p><h2>Ready for your next chapter?</h2>
    <p className="checkout-lede">{price===0?"Confirm your email below to enrol in this free course.":"Confirm your email, review the total, and continue to secure payment."}</p>
    {!verified
      ? <p className="form-error"><Link href={"/verify-email?next="+encodeURIComponent("/checkout/"+courseId)}>Verify your email to continue.</Link></p>
      : <CheckoutForm courseId={course.id} email={user.email||""} currency={course.currency} amountMinor={price} isFree={price===0}/>}
    <p className="secure-note">{price===0?"No payment details required.":"Secure payment processed by Bachs. We never collect your card details."}</p>
    <p className="checkout-support"><Link className="inline-link" href="/contact">Need help with your purchase?</Link></p>
  </section>
 </div></main>;
}
