import { stripe } from "@/lib/stripe";
import { createOrRetriveCustomer } from "@/lib/stripe/adminTasks";
import { getURL } from "@/lib/utils";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Could not find the user");
    const customer = await createOrRetriveCustomer({
      email: user.email || "",
      uuid: user.id || "",
    });
    if (!customer) throw new Error("Could not find this customer");
    const { url } = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${getURL()}/dashboard`,
    });
    return NextResponse.json({ url });
  } catch (error) {
    console.log("Error in createPortal POST", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
