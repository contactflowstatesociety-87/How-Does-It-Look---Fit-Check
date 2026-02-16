
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Helper to convert File to inlineData part for Gemini API
const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

// Helper to parse MIME type and base64 data from a data URL
const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

// Helper to convert data URL to inlineData part for Gemini API
const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

// Extract image data from GenerateContentResponse
const handleApiResponse = (response: GenerateContentResponse): string => {
    if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No candidates returned from the model. This may be due to safety filters.");
    }

    for (const candidate of response.candidates) {
        if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    const { mimeType, data } = part.inlineData;
                    return `data:${mimeType};base64,${data}`;
                }
            }
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        throw new Error(`Generation stopped unexpectedly. Reason: ${finishReason}.`);
    }

    const textFeedback = response.text?.trim();
    const errorMessage = textFeedback 
        ? `The model responded with text instead of an image: "${textFeedback}"`
        : "No image was returned. Please try a different prompt or image.";
    throw new Error(errorMessage);
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash-image';

export const generateModelImage = async (userImage: File): Promise<string> => {
    const userImagePart = await fileToPart(userImage);
    const prompt = "You are an expert fashion photographer AI. Transform the person in this image into a full-body fashion model photo for an e-commerce catalog. The background must be a clean, neutral studio backdrop (light gray, #f0f0f0). Preserve the person's identity, unique facial features, body proportions, and current accessories (hats, glasses, sunglasses) with 100% fidelity. Do not change their hair, skin tone, or existing clothing style in this step. The output must be photorealistic and extremely sharp. Return ONLY the final image.";
    
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [userImagePart, { text: prompt }] },
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const garmentImagePart = await fileToPart(garmentImage);
    const prompt = `### MISSION: 100% PRECISION VIRTUAL TRY-ON
You are an advanced cloth-to-person transfer system. Your objective is absolute structural and color fidelity to the 'garment image' and the 'model image'.

### STEP 1: GARMENT SEGMENTATION & SELECTIVE TARGETING
- Identify the garment(s) in the 'garment image'. 
- **STRICT SELECTIVITY:** Only replace the pixels of the corresponding category on the model.
- **ISOLATION RULE:** If you are adding a JACKET/TOP, you MUST NOT change the model's pants, shoes, or accessories (hat/sunglasses). If the model is wearing olive joggers, they MUST remain olive joggers in the final image.
- **ISOLATION RULE:** If you are adding PANTS, you MUST NOT change the model's shirt, shoes, or accessories.

### STEP 2: STRUCTURAL FIDELITY (REPLACE, DO NOT RE-COLOR)
- **DISREGARD ORIGINAL CUT:** Completely ignore the cut of the person's original clothes. If the model is wearing joggers with elastic cuffs, but the 'garment image' is a straight-leg slack, the final output MUST be a straight-leg slack.
- **NO HALLUCINATIONS:** Strictly prohibited from adding elastic cuffs, drawstrings, or extra pockets that are not in the product photo. The leg opening and hem must match the 'garment image' 100%.

### STEP 3: COLOR & TEXTURE CALIBRATION
- **COLOR PRECISION:** Sample the exact HEX color from the 'garment image'. The output garment must match this specific hue perfectly.
- **LIGHTING NEUTRALITY:** Do not allow the environment lighting in the 'model image' to shift the color. The fabric must look true-to-life as seen in a professional product shot.
- **FABRIC FIDELITY:** Replicate the texture (twill, stretch, knit) exactly as seen in the garment image.

### STEP 4: IDENTITY & SCENE PRESERVATION
- The person's face, hair, skin, sunglasses, hat, and background MUST remain a pixel-perfect match to the 'model image'.

Return ONLY the high-resolution generated image. NO TEXT.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
    });
    return handleApiResponse(response);
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
    const prompt = `You are an expert fashion photographer AI. Regenerate this exact person in this exact outfit from a new perspective: "${poseInstruction}". 
    
**RULES:**
1. Keep the clothing structure (e.g., straight-leg cut), fabric texture, and specific colors 100% identical.
2. Do not revert slacks back to joggers.
3. Keep the person's identity, face, and accessories (hat/sunglasses) identical.
4. Return ONLY the final image.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [tryOnImagePart, { text: prompt }] },
    });
    return handleApiResponse(response);
};
