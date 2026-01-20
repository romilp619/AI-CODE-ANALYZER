export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  line: number;
  description: string;
  codeSnippet: string;
  recommendation: string;
  fixedCode: string;
  cwe?: string; // Common Weakness Enumeration ID
}

// ADD THIS NEW INTERFACE FOR AI FIXES
export interface AIFixResponse {
  id: string;
  originalCode: string;
  fixedCode: string;
  explanation: string;
  confidence: number;
  timestamp: number;
}

// ADD THIS FOR BUSINESS LOGIC ANALYSIS
export interface BusinessLogicIssue {
  id: string;
  title: string;
  description: string;
  category: 'Authentication' | 'Authorization' | 'Business Workflow' | 'Data Integrity' | 'Race Condition';
  impact: string;
  recommendation: string;
  exampleScenario: string;
}

// UPDATE AnalysisReport to include new fields
export interface AnalysisReport {
  overallScore: number; // 0-100
  riskLevel: 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';
  summary: string;
  vulnerabilities: Vulnerability[];
  businessLogicIssues?: BusinessLogicIssue[]; // ADD THIS
  architectureRisks?: string[]; // ADD THIS
  scanDurationMs: number;
  language: string;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  fileName: string;
  score: number;
  riskLevel: string;
}

// ADD THIS FOR GEMINI CONFIG
export interface GeminiConfig {
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}