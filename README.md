# 🔐 Sentinel - AI Security Code Analyzer

Sentinel is a next-generation, AI-powered security code auditor built to identify, analyze, and remediate vulnerabilities in real-time. Levering the power of **Google Gemini 3 Pro**, Sentinel provides professional-grade security assessments for modern developers.

![Sentinel Header](https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070)

## 🚀 Key Features

- **🧠 Deep AI Analysis**: Utilizes cutting-edge LLMs to detect complex vulnerabilities beyond simple regex patterns, including Business Logic flaws and Architectural risks.
- **📋 OWASP Top 10 Focused**: Comprehensive scanning for SQL Injection, XSS, CSRF, Insecure Deserialization, and more.
- **🔗 GitHub Integration**: Directly scan public repositories by pasting a URL. Browse and analyze codebases without leaving the app.
- **🛠️ Instant Remediation**: Don't just find bugs—fix them. Sentinel provides AI-generated, secure code patches for every identified issue.
- **📊 Security Dashboard**: Track your project's security health with scores, risk metrics, and trend visualizers.
- **🛡️ Compliance Mapping**: Automatically check code against global standards like GDPR, PCI-DSS, HIPAA, and ISO 27001.
- **🧪 AI-Verified Testing**: Simulated testing environments that verify if a proposed fix actually mitigates the threat.
- **📄 Professional Export**: Generate detailed JSON security reports for compliance audits and team sharing.

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Backend**: Node.js (Express)
- **AI Engine**: Google Gemini API (@google/genai)
- **Visualization**: Recharts / Custom D3 Components

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the project** (or download the source)
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 📖 How to Use

1. **Select Mode**: Choose between "Paste Code" or "GitHub Repo".
2. **Input Source**: 
   - Paste your source code (Python, JS, TS, Java, etc.) or 
   - Provide a GitHub repository URL (e.g., `https://github.com/username/repo`).
3. **Analyze**: Click **Scan Code**.
4. **Review**: Check the security score and detailed vulnerability cards.
5. **Fix**: Click **"Get Fix"** on any vulnerability to see the recommended AI patch.
6. **Export**: Use the **Export** button to save a report of your scan.

## 🔒 Security & Privacy

Sentinel is designed with security in mind. All code analysis is processed through secure server-side API calls. For production environments, ensure you use a dedicated API key with appropriate rate limiting and quotas.

---


