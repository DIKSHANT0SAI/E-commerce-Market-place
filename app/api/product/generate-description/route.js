// Import the functionality we need from other libraries.
import { getAuth } from "@clerk/nextjs/server"; // Used to check if a user is logged in.
import { NextResponse } from "next/server"; // Used to send responses from our API.
import { GoogleGenerativeAI } from "@google/generative-ai"; // The official library to talk to Google's AI.

// This is our main API function. It runs every time a 'POST' request is made to this file's URL.
export async function POST(request) {
  try {
    // --- Step 1: Connect to Google AI ---
    // Fail clearly if the key isn't configured (otherwise the SDK errors deep in the call).
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { success: false, message: "AI description isn't configured (missing GOOGLE_API_KEY)." },
        { status: 503 }
      );
    }
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    // Use a CURRENT Gemini model. "gemini-1.5-flash-latest" is being retired by Google and
    // now returns a 404. "gemini-2.0-flash" is fast, free-tier eligible, and current.
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // --- Step 2: Check if the User is Logged In ---
    // We use Clerk to see if the person making the request is a real, logged-in user.
    const { userId } = getAuth(request);
    if (!userId) {
      // If they are not logged in, we stop everything and send an error message.
      return NextResponse.json({ success: false, message: 'Not authenticated' });
    }

    // --- Step 3: Get Product Details from the Frontend ---
    // The details of the product (name, price, etc.) are sent from the browser.
    // We read those details from the incoming request.
    const { name, category, price, offerPrice } = await request.json();

    // --- Step 4: Make Sure We Have the Necessary Details ---
    // We check if the essential product details were actually sent.
    if (!name || !category || !price) {
      // If not, we stop and send an error.
      return NextResponse.json({ 
        success: false, 
        message: 'Product name, category, and price are required' 
      });
    }

    // --- Step 5: Create the Instructions for the AI ---
    // This is the most important part. We write a detailed "prompt" that tells the AI exactly what to do.
    // We include the product details and rules for the kind of description we want.
    const prompt = `Generate a compelling product description for an e-commerce website. 

Product Details:
- Name: ${name}
- Category: ${category}
- Price: ₹${price}
${offerPrice ? `- Offer Price: ₹${offerPrice}` : ''}

Requirements:
- Write 2-3 sentences (50-80 words)
- Make it engaging and persuasive
- Include key features and benefits
- Use e-commerce friendly language
- Focus on value proposition
- Keep it professional but approachable

Generate only the description, no additional text.`;

    // --- Step 6: Send the Instructions to the AI and Get the Result ---
    // We send our prompt to the Google Gemini model and wait for it to generate the text.
    const result = await model.generateContent(prompt);
    // We get the AI's response.
    const response = await result.response;
    // We pull out just the text part of the response and remove any extra spaces.
    const generatedDescription = response.text().trim();

    // --- Step 7: Send the Generated Description Back to the Browser ---
    // We send a success message along with the new description back to the frontend.
    return NextResponse.json({
      success: true,
      description: generatedDescription
    });

  } catch (error) {
    // --- Step 8: Handle Any Errors ---
    // If any part of our 'try' block fails, the code jumps here.
    // We log the error to the server console so we can see what went wrong.
    console.error('AI Description Generation Error (Google Gemini):', error);

    // Surface the real reason (e.g. "model not found", "API key invalid", "quota exceeded")
    // so failures are debuggable instead of a silent generic message.
    return NextResponse.json({
      success: false,
      message: `Couldn't generate description: ${error?.message || 'please try again.'}`,
    });
  }
} 