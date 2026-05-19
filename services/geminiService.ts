import { AnalysisReport } from "../types";

export const analyzeCode = async (code: string, languageHint?: string): Promise<AnalysisReport> => {
  if (!code.trim()) {
    throw new Error("Code cannot be empty.");
  }

  const startTime = Date.now();

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, languageHint }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to analyze code");
    }

    const data = await response.json();
    
    return {
      ...data,
      scanDurationMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error("Analysis Proxy Error:", error);
    throw error;
  }
};

export const generateAIFix = async (vulnerability: any, code: string): Promise<{fix: string, explanation: string}> => {
  try {
    const response = await fetch("/api/fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vulnerability, code }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate fix");
    }

    return await response.json();
  } catch (error) {
    console.error("Fix Proxy Error:", error);
    throw error;
  }
};
