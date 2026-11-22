import { can, getCurrentCoach } from "@/lib/auth";
import { getDb } from "@/lib/supabase";
import { NextResponse } from "next/server";
export async function GET() {
 const actor=await getCurrentCoach();
 if(!actor) return NextResponse.json({error:"Authentication required"},{status:401});
 if(!can(actor,"view_management")) return NextResponse.json({error:"Staff access required"},{status:403});
 if(process.env.ECCP_MESSAGING_ENABLED!=="true") return NextResponse.json({error:"Messaging unavailable"},{status:503});
 const {data,error}=await getDb().from("coaches").select("id,full_name").eq("admin_role","coach").order("full_name").limit(250);
 if(error) return NextResponse.json({error:"Recipients unavailable"},{status:503});
 return NextResponse.json({recipients:(data??[]).map(c=>({id:c.id,name:c.full_name}))},{headers:{"Cache-Control":"no-store"}});
}
