import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    env: { 
      hasGeminiKey: !!(process.env.GEMINI_API_KEY || process.env.API_KEY),
      nodeEnv: process.env.NODE_ENV 
    } 
  });
});

// Initialize Gemini Client
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
  console.warn("WARNING: No GEMINI_API_KEY found in environment!");
} else {
  console.log("GEMINI_API_KEY is configured.");
}

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

// API: Analyze Code
app.post("/api/analyze", async (req, res) => {
  const { code, languageHint } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: "Code cannot be empty." });
  }

  const modelId = "gemini-3-flash-preview";

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
      }
    });

    const text = response.text;
    
    if (!text) {
      throw new Error("No response from Gemini.");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze code" });
  }
});

// API: Generate Fix
app.post("/api/fix", async (req, res) => {
  const { vulnerability, code } = req.body;

  if (!vulnerability || !code) {
    return res.status(400).json({ error: "Vulnerability and code context required." });
  }

  const modelId = "gemini-3-flash-preview";

  const prompt = `
    You are a Security Engineer. Provide a secure fix for the following vulnerability.
    
    Vulnerability: ${vulnerability.title}
    Description: ${vulnerability.description}
    Vulnerable Code:
    \`\`\`
    ${vulnerability.codeSnippet}
    \`\`\`
    
    Context:
    \`\`\`
    ${code}
    \`\`\`
    
    Provide a JSON response with the following structure:
    {
      "fix": "The secure code block",
      "explanation": "A brief explanation of the fix"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fix: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["fix", "explanation"]
        }
      }
    });

    const text = response.text;
    const data = JSON.parse(text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Gemini Fix Error:", error);
    res.status(500).json({ error: "Failed to generate fix" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Catch-all for SPA: use app.use instead of app.get('*') to avoid Express 5 PathError
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
