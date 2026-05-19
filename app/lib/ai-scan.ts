/**
 * AI Scan powered by Gemini API
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FoodEntry } from './nutrition';

export interface ScanResult {
  confidence: 'high' | 'medium' | 'low';
  items: {
    name: string;
    servingDescription: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }[];
  total: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  notes: string;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

/**
 * Scan food photo using Gemini API
 */
export async function scanFoodPhoto(_imageUri: string, base64?: string | null): Promise<ScanResult> {
  if (!base64) {
    throw new Error("No image data provided for scanning.");
  }

  if (!GEMINI_API_KEY) {
    // If no API key is provided, return empty data (as requested)
    return {
      confidence: 'low',
      items: [],
      total: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      notes: 'No Gemini API Key found in EXPO_PUBLIC_GEMINI_API_KEY.',
    };
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `Analyze this food image and provide nutritional information. 
Format your response exactly as a JSON object matching this schema:
{
  "confidence": "high" | "medium" | "low",
  "items": [
    {
      "name": "string",
      "servingDescription": "string",
      "calories": number,
      "proteinG": number,
      "carbsG": number,
      "fatG": number
    }
  ],
  "total": {
    "calories": number,
    "proteinG": number,
    "carbsG": number,
    "fatG": number
  },
  "notes": "string"
}
Ensure the output is valid JSON without any markdown formatting like \`\`\`json.`;

  const imageParts = [
    {
      inlineData: {
        data: base64,
        mimeType: "image/jpeg",
      },
    },
  ];

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown formatting
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
    }

    const scanResult: ScanResult = JSON.parse(text);
    return scanResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze image with Gemini API");
  }
}

/**
 * Convert scan result items to food entries
 */
export function scanResultToEntries(
  result: ScanResult,
  mealType: FoodEntry['mealType'] = 'lunch',
  imageUri?: string,
): Omit<FoodEntry, 'id' | 'timestamp' | 'date'>[] {
  return result.items.map(item => ({
    name: item.name,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    servingDescription: item.servingDescription,
    mealType,
    imageUri,
    confidence: result.confidence,
    notes: result.notes,
  }));
}

