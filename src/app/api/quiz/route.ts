import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
// @ts-ignore
import pdfParse from 'pdf-parse';

// Initialize the Gemini AI client
// This expects GEMINI_API_KEY in the environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server is missing GEMINI_API_KEY environment variable. Please add it to .env.local' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;
    const numQuestions = formData.get('numQuestions') as string;
    const difficulty = formData.get('difficulty') as string;

    if (!file || !numQuestions || !difficulty) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Extract Text from PDF natively in Node.js
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let fullText = "";
    try {
      // pdf-parse v1.1.1 uses a promise-based function directly on the buffer
      const pdfData = await pdfParse(buffer);
      fullText = pdfData.text;
    } catch (parseErr) {
      console.error("PDF Parsing error:", parseErr);
      return NextResponse.json({ error: 'Failed to extract text from PDF.' }, { status: 400 });
    }

    if (!fullText || fullText.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract any readable text from this PDF.' }, { status: 400 });
    }

    // Limit text to roughly 100,000 characters to prevent token limits 
    const processedText = fullText.slice(0, 100000); 

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            questions: {
              type: SchemaType.ARRAY,
              description: "A list of quiz questions generated from the text.",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  question: { type: SchemaType.STRING, description: "The quiz question." },
                  options: { 
                    type: SchemaType.ARRAY, 
                    description: "Exactly 4 options for the multiple choice question.",
                    items: { type: SchemaType.STRING } 
                  },
                  correctIdx: { 
                    type: SchemaType.INTEGER, 
                    description: "The index (0-3) of the correct option in the options array." 
                  },
                  explanation: { 
                    type: SchemaType.STRING, 
                    description: "A detailed educational explanation of why the correct answer is right according to the text." 
                  },
                  topic: {
                    type: SchemaType.STRING,
                    description: "The core concept or topic this question evaluates (e.g. 'Binary Trees', 'Thermodynamics', 'Grammar')."
                  }
                },
                required: ["question", "options", "correctIdx", "explanation", "topic"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const prompt = `You are an expert tutor. I will provide you with the raw text extracted from a student's study document. 
Your goal is to generate exactly ${numQuestions} multiple-choice questions from this text.
The difficulty of the questions should be: ${difficulty}. 
Ensure the questions are accurate and directly reference the provided text.

Document Text:
"""
${processedText}
"""`;

    // Only pass pure string prompt, abandoning risky Multimodal PDF binary uploading!
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse the JSON string returned by Gemini
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("AI Quiz Auth Error:", error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate quiz from AI.' },
      { status: 500 }
    );
  }
}
