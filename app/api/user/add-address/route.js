
import connectDB from "@/config/db";
import Address from "@/models/address";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request){
     try {
        const {userId} = getAuth(request);
        if (!userId) {
          return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        }

        const {address} = await request.json();
        const required = ['fullName', 'phoneNumber', 'pincode', 'area', 'city', 'state'];
        if (!address || required.some((f) => !address[f] || !String(address[f]).trim())) {
          return NextResponse.json({ success: false, message: "Please fill all address fields." }, { status: 400 });
        }

        await connectDB();
        // Persist only known fields (don't spread arbitrary client keys into the DB).
        const newAddress = await Address.create({
          userId,
          fullName: address.fullName,
          phoneNumber: address.phoneNumber,
          pincode: address.pincode,
          area: address.area,
          city: address.city,
          state: address.state,
        });

        return NextResponse.json({success:true,message:"Address added successfully",newAddress})
     } catch (error) {
        return NextResponse.json({success:false,message:error.message});
     }
}