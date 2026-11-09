import {unsubscribeMarketing} from './unsubscribe-action';
import PublicHeader from '@/Components/PublicHeader';
export const metadata={title:'Email preferences',robots:{index:false,follow:false}};
export default async function Unsubscribe({searchParams}){const q=await searchParams;return <><PublicHeader /><main className="public-note public-page"><h1>Email preferences</h1>{q.done?<p>You will no longer receive marketing newsletters. Course and payment notifications remain enabled.</p>:<form action={unsubscribeMarketing}><input type="hidden" name="token" value={q.token||''}/><p>Stop marketing newsletters from AI Video Creator?</p><button className="button">Unsubscribe</button></form>}</main></>;}
