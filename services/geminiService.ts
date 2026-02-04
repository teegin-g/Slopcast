import { GoogleGenAI } from "@google/genai";
import { DealMetrics, TypeCurveParams, PricingAssumptions } from "../types";

function getAiClient(): GoogleGenAI | null {
  const apiKey =
    (process.env.GEMINI_API_KEY as string | undefined) ??
    (process.env.API_KEY as string | undefined) ??
    "";

  // Avoid crashing the whole app on load if no key is configured.
  if (!apiKey || apiKey.trim().length === 0) return null;

  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    // If the SDK throws on bad/missing key, degrade gracefully.
    console.error("Gemini client init error:", e);
    return null;
  }
}

export const generateDealAnalysis = async (
  metrics: DealMetrics,
  tc: TypeCurveParams,
  pricing: PricingAssumptions,
  selectedWellCount: number
): Promise<string> => {
  
  const ai = getAiClient();
  if (!ai) {
    return "AI analysis is unavailable (missing Gemini API key). Add GEMINI_API_KEY to your local env and reload.";
  }

  const prompt = `
    Act as a Senior Investment Analyst for an Oil & Gas Private Equity firm.
    Evaluate the following deal metrics for a drilling program in the Permian Basin.

    **Deal Parameters:**
    - Well Count: ${selectedWellCount}
    - Total CAPEX: $${(metrics.totalCapex / 1e6).toFixed(1)} MM
    - Estimated Ultimate Recovery (EUR): ${(metrics.eur / 1e3).toFixed(0)} MBOE
    - NPV10: $${(metrics.npv10 / 1e6).toFixed(1)} MM
    - ROI (Cash on Cash): ${(metrics.eur * pricing.oilPrice * pricing.nri / metrics.totalCapex).toFixed(2)}x (Approx)
    - Payout: ${metrics.payoutMonths} Months

    **Assumptions Used:**
    - Oil Price: $${pricing.oilPrice}/bbl
    - NRI: ${(pricing.nri * 100).toFixed(1)}%
    - IP Rate: ${tc.qi} bopd
    - Initial Decline: ${tc.di}%
    
    Please provide a concise (max 200 words) executive summary. 
    1. Highlight the attractiveness of the deal (NPV, Payout).
    2. Identify 1 major risk factor based on the high-level inputs.
    3. Provide a clear "Go / No-Go" recommendation.
    
    Format nicely with bolding where appropriate.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating analysis. Please check API Key configuration.";
  }
};
