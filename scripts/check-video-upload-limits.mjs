import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
const mocks={
 '@/lib/supabase/server':'export const getAdminUser=async()=>globalThis.actor;export const createSupabaseServiceClient=()=>globalThis.db;',
 '@/lib/cloudflare-stream':'export const streamConfigured=()=>false;',
 '@/lib/stream-reference':'export const streamVideoId=()=>null;',
 '@/lib/course-stream-upload':'export const courseStreamUpload=()=>{throw new Error("not used")};'
};
registerHooks({resolve(s,c,next){if(mocks[s])return {url:'data:text/javascript,'+encodeURIComponent(mocks[s]),shortCircuit:true};return next(s,c);}});
const {POST}=await import('../app/api/admin/course-video/route.js');
process.env.COURSE_VIDEO_UPLOAD_PROVIDER='supabase';
let limit=1024,mimes=['video/mp4'],signed=0;
globalThis.actor={id:'admin'};
globalThis.db={storage:{getBucket:async()=>({data:{file_size_limit:limit,allowed_mime_types:mimes}}),from:()=>({createSignedUploadUrl:async()=>{signed++;return {data:{signedUrl:'https://storage.test/signed'}}}})}};
const request=()=>POST(new Request('https://site.test/api/admin/course-video',{method:'POST',body:JSON.stringify({action:'sign',courseId:'11111111-1111-4111-8111-111111111111',lessonId:'22222222-2222-4222-8222-222222222222',fileSize:2048,fileName:'test.mp4',mimeType:'video/mp4'})}));
assert.equal((await request()).status,413);assert.equal(signed,0);
limit=4096;mimes=['video/webm'];assert.equal((await request()).status,400);assert.equal(signed,0);
mimes=['video/*'];assert.equal((await request()).status,200);assert.equal(signed,1);
globalThis.actor=null;assert.equal((await request()).status,401);assert.equal(signed,1);
console.log('PASS: reject bucket size/type mismatch before signing, accept matching configuration, enforce admin');
