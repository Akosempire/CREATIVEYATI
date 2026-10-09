import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
const mocks={
 '@/lib/supabase/server':'export const getAdminUser=async()=>globalThis.actor;export const createSupabaseServiceClient=()=>globalThis.db;',
 '@/lib/cloudflare-stream':'export const streamConfigured=()=>globalThis.configured;',
 '@/lib/stream-reference':'export const streamVideoId=()=>null;',
 '@/lib/course-stream-upload':'export const courseStreamUpload=async()=>{globalThis.streamCalls++;if(globalThis.denied)throw new Error("Cloudflare denied Stream access");return {provider:"cloudflare"};}'
};
registerHooks({resolve(s,c,next){if(mocks[s])return {url:'data:text/javascript,'+encodeURIComponent(mocks[s]),shortCircuit:true};return next(s,c);}});
const {POST}=await import('../app/api/admin/course-video/route.js');
globalThis.actor={id:'admin'};globalThis.configured=true;globalThis.streamCalls=0;
globalThis.db={storage:{from:()=>{throw new Error('Unexpected Supabase upload')}}};
const request=(overrides={})=>POST(new Request('https://site.test/api/admin/course-video',{method:'POST',body:JSON.stringify({action:'sign',courseId:'11111111-1111-4111-8111-111111111111',lessonId:'22222222-2222-4222-8222-222222222222',fileSize:67*1024*1024,fileName:'test.mov',mimeType:'video/quicktime',...overrides})}));
process.env.COURSE_VIDEO_UPLOAD_PROVIDER='supabase';
assert.equal((await (await request()).json()).provider,'cloudflare');
assert.equal((await request({fileSize:3*1024**3})).status,400);
globalThis.denied=true;assert.equal((await request()).status,502);
globalThis.configured=false;assert.equal((await request()).status,503);
globalThis.actor=null;assert.equal((await request()).status,401);
assert.equal(globalThis.streamCalls,2);
console.log('PASS: MOV signs with Cloudflare, rejects oversize/unauthenticated requests, no Supabase fallback on denied or missing Stream configuration');
