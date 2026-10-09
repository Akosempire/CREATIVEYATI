const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const token = process.env.CLOUDFLARE_STREAM_API_TOKEN?.trim();
if (!account || !token) throw new Error("Cloudflare Stream credentials missing");
const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/stream?per_page=1`, {headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(20000)});
const body = await response.json().catch(()=>({}));
console.log(JSON.stringify({check:"Cloudflare Stream access",status:response.status,success:body.success===true,codes:(body.errors||[]).map(e=>e.code)}));
if (!response.ok || !body.success) process.exit(1);
