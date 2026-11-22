import { can } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { actorForWrite, fail, messageBody, textOnlyMessagingPayload, uuid, rpcFail } from "@/lib/messaging-write";
import { NextResponse } from "next/server";

const categories = ["scheduling","training","general","other"];
export async function POST(request: Request) {
 const auth=await actorForWrite(request);
 if(auth.error) return auth.error;
 if(!can(auth.actor!,"view_management")) return fail("Staff access required",403);
 let payload:unknown;
 try {payload=await request.json();} catch {return fail("Invalid JSON",400);}
 if(!payload||typeof payload!=="object") return fail("Invalid request",400);
 const input=payload as Record<string,unknown>;
 if(!textOnlyMessagingPayload(request,input)) return fail("Only JSON text messages are supported",415);
 if(!uuid(input.recipientId)||!uuid(input.idempotencyKey)||!messageBody(input.body)
 ||!categories.includes(input.category as string)||typeof input.title!=="string"
 ||!input.title.trim()||input.title.length>120) return fail("Invalid message",400);
 const {data,error}=await getDb().rpc("message_staff_start_conversation",{
  p_session_token:auth.token!,p_recipient_id:input.recipientId,
  p_category:input.category,p_title:input.title.trim(),p_body:input.body.trim(),
  p_idempotency_key:input.idempotencyKey,
 });
 if(error) return rpcFail(error,"New conversation unavailable");
 return NextResponse.json({conversationId:data},{status:201});
}
