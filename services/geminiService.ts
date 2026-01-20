import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisReport } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallScore: {
      type: Type.NUMBER,
      description: "A security score from 0 to 100, where 100 is perfectly secure and 0 is critically vulnerable.",
    },
    riskLevel: {
      type: Type.STRING,
      enum: ["Safe", "Low", "Medium", "High", "Critical"],
      description: "The overall risk level of the provided code.",
    },
    summary: {
      type: Type.STRING,
      description: "A concise executive summary of the security findings.",
    },
    language: {
      type: Type.STRING,
      description: "The programming language detected.",
    },
    vulnerabilities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique identifier for the issue" },
          title: { type: Type.STRING, description: "Short title of the vulnerability (e.g., SQL Injection)" },
          severity: { 
            type: Type.STRING, 
            enum: ["Critical", "High", "Medium", "Low", "Info"],
            description: "Severity level of the vulnerability"
          },
          line: { type: Type.INTEGER, description: "Line number where the issue starts" },
          description: { type: Type.STRING, description: "Detailed explanation of why this is a vulnerability" },
          codeSnippet: { type: Type.STRING, description: "The specific vulnerable code segment" },
          recommendation: { type: Type.STRING, description: "Actionable advice to fix the issue" },
          fixedCode: { type: Type.STRING, description: "Example of how the code should look after fixing" },
          cwe: { type: Type.STRING, description: "CWE ID if applicable (e.g., CWE-89)" },
        },
        required: ["id", "title", "severity", "line", "description", "recommendation", "fixedCode"],
      },
    },
  },
  required: ["overallScore", "riskLevel", "summary", "vulnerabilities", "language"],
};

export const analyzeCode = async (code: string, languageHint?: string): Promise<AnalysisReport> => {
  if (!code.trim()) {
    throw new Error("Code cannot be empty.");
  }

  const startTime = Date.now();
  const modelId = "gemini-3-pro-preview"; // Using Pro for complex reasoning and code analysis

  const prompt = `
    You are an expert Security Code Auditor and Penetration Tester. 
    Analyze the following source code for security vulnerabilities.
    Focus on the OWASP Top 10, including but not limited to:
    - Injection (SQL, NoSQL, Command, etc.)
    - Broken Authentication
    - Sensitive Data Exposure (Hardcoded secrets, PII)
    - XML External Entities (XXE)
    - Broken Access Control
    - Security Misconfiguration
    - Cross-Site Scripting (XSS)
    - Insecure Deserialization
    
    Provide a strict assessment. If the code is secure, explain why.
    
    Language Hint: ${languageHint || "Auto-detect"}
    
    Source Code:
    \`\`\`
    ${code}
    \`\`\`
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 4096 }, // Enable thinking for deeper analysis
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini.");
    }

    const data = JSON.parse(text);
    
    return {
      ...data,
      scanDurationMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
