'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { STRATEGIC_INTAKE_PROMPT, STATE_DISRUPTOR_PROMPT, BRAIN_DUMP_TRIAGE_PROMPT } from './prompts';

const apiKey = process.env.GEMINI_API_KEY || '';

export interface GeneratedTask {
  title: string;
  category: string;
  hormoziScore: number;
  magicWords: string;
}

export async function generateActionPlan(goal: string, categories: string[]): Promise<GeneratedTask[]> {
  if (!apiKey) {
    throw new Error("Gemini API Key missing. Please configure it in .env.local");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    }, { apiVersion: 'v1beta' });

    const prompt = STRATEGIC_INTAKE_PROMPT(categories, goal);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Find the first [ and last ] to extract JSON array
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    
    if (start === -1 || end === -1) {
      console.error("Gemini failed to return JSON array. Raw response:", text);
      throw new Error("AI Strategic Planner failed to format results. Please try a simpler goal.");
    }

    const jsonText = text.substring(start, end + 1);
    
    try {
      return JSON.parse(jsonText) as GeneratedTask[];
    } catch (parseError) {
      console.error("JSON Parse Error. Cleaned text:", jsonText);
      throw new Error("AI Strategic Planner returned malformed data.");
    }
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    const msg = error.message || "Unknown error";
    // Fallback if possible, but for Strategic Intake we might want a real error
    throw new Error(`Strategic Intake failed: ${msg}`);
  }
}

export async function generateStateDisruptor(logs: string[]): Promise<string> {
  if (!apiKey) {
     return "State Disruptor: API Key missing. I can't disrupt your state until you fix your configuration.";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    }, { apiVersion: 'v1beta' });

    const prompt = STATE_DISRUPTOR_PROMPT(logs);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("State Disruptor Error:", error);
    return "State Disruptor: Error analyzing your reality. Specifically, what is preventing you from succeeding right now?";
  }
}
export async function parseBulkTasks(text: string, categories: string[]): Promise<GeneratedTask[]> {
  if (!apiKey) {
    throw new Error("Gemini API Key missing. Please configure it in .env.local");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    }, { apiVersion: 'v1beta' });

    const prompt = BRAIN_DUMP_TRIAGE_PROMPT(categories, text);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawResponse = response.text();
    
    // Find the first [ and last ] to extract JSON array
    const start = rawResponse.indexOf('[');
    const end = rawResponse.lastIndexOf(']');
    
    if (start === -1 || end === -1) {
      console.error("Gemini failed to return JSON array. Raw response:", rawResponse);
      throw new Error("AI failed to format tasks correctly. Try a shorter list.");
    }

    const jsonText = rawResponse.substring(start, end + 1);
    
    try {
      return JSON.parse(jsonText) as GeneratedTask[];
    } catch (parseError) {
      console.error("JSON Parse Error. Cleaned text:", jsonText);
      throw new Error("AI returned malformed data. Please try again.");
    }
  } catch (error: any) {
    console.error("Bulk Parsing Error:", error);
    // Be more specific if possible
    const msg = error.message || "Unknown error";
    throw new Error(`AI Triage failed: ${msg}`);
  }
}
