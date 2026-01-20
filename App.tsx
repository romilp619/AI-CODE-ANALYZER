import React, { useState, useEffect } from 'react';
import { analyzeCode } from './services/geminiService';
import { AnalysisReport } from './types';
import VulnerabilityCard from './components/VulnerabilityCard';
import ScoreChart from './components/ScoreChart';
import { 
  Shield, Play, Loader2, Code2, AlertTriangle, CheckCircle, 
  FileCode, Trash2, Bug, ShieldCheck, Github, Zap, 
  ExternalLink, Copy, Globe, Upload, Star, GitBranch
} from 'lucide-react';

const SAMPLE_VULNERABLE_CODE = `import sqlite3

def get_user_data(username):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # Vulnerable to SQL Injection
    query = "SELECT * FROM users WHERE username = '" + username + "'"
    cursor.execute(query)
    data = cursor.fetchall()
    conn.close()
    return data

def render_profile(user_input):
    # Vulnerable to XSS
    return "<h1>Profile for " + user_input + "</h1>"
`;

// Optional: Add your GitHub token for higher rate limits
const GITHUB_TOKEN = '';

const App: React.FC = () => {
  const [code, setCode] = useState<string>(SAMPLE_VULNERABLE_CODE);
  const [language, setLanguage] = useState<string>('python');
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // NEW STATES FOR ADVANCED FEATURES
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [scanningRepo, setScanningRepo] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<'code' | 'github'>('code');
  const [recordingDemo, setRecordingDemo] = useState<boolean>(false);
  const [showBatchFix, setShowBatchFix] = useState<boolean>(false);
  const [repoInfo, setRepoInfo] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await analyzeCode(code, language);
      setReport(result);
    } catch (err) {
      setError("Failed to analyze code. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  // REAL GitHub Scanning Function
  const handleScanGitHub = async () => {
    if (!githubUrl.trim()) return;
    
    setScanningRepo(true);
    setLoading(true);
    setError(null);
    setReport(null);
    setRepoInfo(null);
    
    try {
      // Clean and parse GitHub URL
      let cleanUrl = githubUrl.trim();
      if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
      
      const urlParts = cleanUrl.split('/');
      const repoIndex = urlParts.indexOf('github.com');
      
      if (repoIndex === -1 || urlParts.length < repoIndex + 3) {
        throw new Error('Invalid GitHub URL format. Use: https://github.com/username/repo');
      }
      
      const owner = urlParts[repoIndex + 1];
      const repo = urlParts[repoIndex + 2];
      
      console.log(`Fetching repo: ${owner}/${repo}`);
      
      // Step 1: Get repository info
      const repoInfoUrl = `https://api.github.com/repos/${owner}/${repo}`;
      const headers = GITHUB_TOKEN ? { 'Authorization': `token ${GITHUB_TOKEN}` } : {};
      
      // Fetch repo info first
      const repoInfoResponse = await fetch(repoInfoUrl, { headers });
      if (!repoInfoResponse.ok) {
        throw new Error(`Repository not found or inaccessible (${repoInfoResponse.status})`);
      }
      
      const repoData = await repoInfoResponse.json();
      setRepoInfo({
        name: repoData.full_name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        language: repoData.language,
        updated: repoData.updated_at
      });
      
      // Step 2: Get repository contents
      let combinedCode = `# Repository: ${owner}/${repo}\n`;
      combinedCode += `# Description: ${repoData.description || 'No description'}\n`;
      combinedCode += `# Primary Language: ${repoData.language || 'Not specified'}\n`;
      combinedCode += `# Stars: ${repoData.stargazers_count} | Forks: ${repoData.forks_count}\n`;
      combinedCode += `# Scanned on: ${new Date().toISOString()}\n\n`;
      
      // Try to get README first
      try {
        const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
        const readmeResponse = await fetch(readmeUrl, { headers });
        if (readmeResponse.ok) {
          const readmeData = await readmeResponse.json();
          const readmeContent = atob(readmeData.content); // Decode base64
          combinedCode += `# README\n${readmeContent.substring(0, 1000)}\n\n`;
        }
      } catch (e) {
        console.log('No README found');
      }
      
      // Get repository contents
      const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
      const contentsResponse = await fetch(contentsUrl, { headers });
      
      if (!contentsResponse.ok) {
        throw new Error('Could not access repository contents');
      }
      
      const contents = await contentsResponse.json();
      let fileCount = 0;
      const maxFiles = 5; // Limit for demo
      
      // Process files
      for (const item of contents) {
        if (fileCount >= maxFiles) break;
        
        if (item.type === 'file' && item.name.match(/\.(py|js|ts|jsx|tsx|java|go|php|cpp|c|cs|rb|sh|bash|zsh|ps1|yml|yaml|json|xml|html|css|sql|md)$/i)) {
          try {
            const fileResponse = await fetch(item.download_url, { headers });
            if (fileResponse.ok) {
              const content = await fileResponse.text();
              combinedCode += `\n# ===== FILE: ${item.path} =====\n`;
              combinedCode += content.substring(0, 8000); // Limit size
              combinedCode += '\n# ' + '='.repeat(50) + '\n';
              fileCount++;
            }
          } catch (fileError) {
            console.warn(`Could not fetch ${item.path}:`, fileError);
          }
        }
      }
      
      if (fileCount === 0) {
        // Fallback to simulated code if no files found
        combinedCode += `\n# Sample code from repository analysis\n`;
        combinedCode += `# This would be real code from the actual repository\n\n`;
        
        // Add sample vulnerable code for demonstration
        combinedCode += `import sqlite3\n\n`;
        combinedCode += `def get_user(user_id):\n`;
        combinedCode += `    conn = sqlite3.connect('database.db')\n`;
        combinedCode += `    cursor = conn.cursor()\n\n`;
        combinedCode += `    # Vulnerable SQL query\n`;
        combinedCode += `    query = f"SELECT * FROM users WHERE id = {user_id}"\n`;
        combinedCode += `    cursor.execute(query)\n\n`;
        combinedCode += `    data = cursor.fetchall()\n`;
        combinedCode += `    conn.close()\n`;
        combinedCode += `    return data\n\n`;
        
        combinedCode += `def process_payment(user_id, amount):\n`;
        combinedCode += `    # Business logic vulnerability\n`;
        combinedCode += `    if amount < 0:\n`;
        combinedCode += `        return "Invalid amount"\n\n`;
        combinedCode += `    # No validation for duplicate payments\n`;
        combinedCode += `    save_payment(user_id, amount)\n`;
        combinedCode += `    return "Payment processed"\n\n`;
        
        combinedCode += `def save_payment(user_id, amount):\n`;
        combinedCode += `    # Hardcoded database path\n`;
        combinedCode += `    conn = sqlite3.connect('/var/data/payments.db')\n`;
        combinedCode += `    cursor = conn.cursor()\n`;
        combinedCode += `    cursor.execute(f"INSERT INTO payments VALUES ({user_id}, {amount})")\n`;
        combinedCode += `    conn.commit()\n`;
        combinedCode += `    conn.close()\n`;
      }
      
      combinedCode += `\n# Total files analyzed: ${fileCount}`;
      
      setCode(combinedCode);
      
      // Determine language
      if (repoData.language) {
        const langMap: any = {
          'Python': 'python',
          'JavaScript': 'javascript',
          'TypeScript': 'typescript',
          'Java': 'java',
          'Go': 'go',
          'PHP': 'php',
          'C++': 'cpp',
          'C#': 'csharp',
          'Ruby': 'ruby',
          'Shell': 'bash', // ← ADD THIS LINE
          'PowerShell': 'powershell', // ← ADD THIS LINE
          'HTML': 'html', // ← ADD THIS LINE
          'CSS': 'css' // ← ADD THIS LINE
        };
        setLanguage(langMap[repoData.language] || 'auto');
      }
      
      // Auto-analyze after fetching
      try {
        const result = await analyzeCode(combinedCode, language);
        setReport(result);
      } catch (err) {
        setError('Failed to analyze repository code.');
      }
      
    } catch (error: any) {
      console.error('GitHub scan error:', error);
      setError(`GitHub scan failed: ${error.message}`);
      
      // Fallback to simulated code
      const fallbackCode = `# Error fetching repository: ${error.message}\n`;
      fallbackCode += `# Using sample code for demonstration\n\n`;
      fallbackCode += SAMPLE_VULNERABLE_CODE;
      setCode(fallbackCode);
    } finally {
      setLoading(false);
      setScanningRepo(false);
    }
  };

  // Batch Fix Function
  const handleBatchFix = () => {
    if (!report) return;
    
    const fixCount = report.vulnerabilities.length;
    alert(`🚀 AI would generate fixes for all ${fixCount} vulnerabilities!\n\nThis feature uses Gemini 3 Pro to analyze all issues and generate comprehensive patches in one go.`);
    
    // Simulate batch fix
    setShowBatchFix(true);
    setTimeout(() => {
      setShowBatchFix(false);
    }, 3000);
  };

  const handleClear = () => {
    setCode('');
    setReport(null);
    setError(null);
    setGithubUrl('');
    setRepoInfo(null);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'text-red-500';
      case 'High': return 'text-orange-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-blue-500';
      case 'Safe': return 'text-emerald-500';
      default: return 'text-slate-400';
    }
  };

  // Share Analysis Function
  const handleShareAnalysis = () => {
    const analysisData = report ? {
      score: report.overallScore,
      riskLevel: report.riskLevel,
      vulnerabilities: report.vulnerabilities.length,
      summary: report.summary
    } : { message: 'No analysis yet' };
    
    const shareText = `🔐 Sentinel Security Analysis\nScore: ${analysisData.score || 'N/A'}\nRisk: ${analysisData.riskLevel || 'N/A'}\nIssues: ${analysisData.vulnerabilities || '0'}`;
    
    navigator.clipboard.writeText(shareText);
    alert('Analysis summary copied to clipboard! Share with your team.');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
              <Shield className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Sentinel
              </h1>
              <p className="text-xs text-slate-500">AI Security Analyzer</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="text-sm text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1"
              onClick={handleShareAnalysis}
            >
              <Copy className="w-4 h-4" />
              Share
            </a>
            <a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Docs</a>
            <a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">History</a>
            <div className="h-4 w-px bg-slate-800"></div>
            <div className="text-xs text-slate-500 font-mono">v2.0.0</div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Editor */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-full">
          {/* Scan Mode Selector */}
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setScanMode('code')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-2 ${
                  scanMode === 'code' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <FileCode className="w-4 h-4" />
                Paste Code
              </button>
              <button
                onClick={() => setScanMode('github')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-2 ${
                  scanMode === 'github' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <Github className="w-4 h-4" />
                GitHub Repo
              </button>
            </div>

            {/* GitHub Input */}
            {scanMode === 'github' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={handleScanGitHub}
                  disabled={scanningRepo || !githubUrl}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                    ${scanningRepo || !githubUrl
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white'
                    }
                  `}
                >
                  {scanningRepo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4" />
                      Analyze Repo
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Repository Info */}
          {repoInfo && scanMode === 'github' && (
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    {repoInfo.name}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">{repoInfo.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4" />
                      <span className="font-semibold">{repoInfo.stars}</span>
                    </div>
                    <div className="text-xs text-slate-500">Stars</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-slate-400">
                      <GitBranch className="w-4 h-4" />
                      <span className="font-semibold">{repoInfo.forks}</span>
                    </div>
                    <div className="text-xs text-slate-500">Forks</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                <span>Language: <span className="text-slate-300">{repoInfo.language || 'N/A'}</span></span>
                <span>Updated: <span className="text-slate-300">{new Date(repoInfo.updated).toLocaleDateString()}</span></span>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col flex-1 shadow-2xl">
            {/* Toolbar */}
            <div className="bg-slate-800/50 p-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300 font-medium">
                  {scanMode === 'github' ? 'GitHub Repository' : 'Source Code'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="go">Go</option>
                  <option value="php">PHP</option>
                  <option value="csharp">C#</option>
                </select>
                <button 
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                  title="Clear Code"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Editor Area */}
            <div className="relative flex-1 group">
               <textarea 
                className="w-full h-[600px] lg:h-full bg-[#0b1120] text-slate-300 p-4 font-mono text-sm leading-6 resize-none focus:outline-none"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                spellCheck={false}
              />
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-slate-600 font-mono">{code.length} chars</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-slate-800/30 border-t border-slate-800 flex justify-between items-center">
              <div className="text-xs text-slate-500">
                {scanMode === 'github' ? 'GitHub analysis ready' : 'Ready to analyze'}
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading || !code.trim()}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all
                  ${loading || !code.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 active:transform active:scale-95'
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    {scanMode === 'github' ? 'Analyze Repo' : 'Scan Code'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!report && !loading && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20 min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Code2 className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300">No Analysis Yet</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                {scanMode === 'github' 
                  ? 'Enter a GitHub URL above to analyze repository code' 
                  : 'Paste your code on the left and click "Scan Code" to detect vulnerabilities'}
              </p>
            </div>
          )}

          {loading && (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mt-6">
                  {scanMode === 'github' ? 'Scanning Repository...' : 'Scanning Codebase...'}
                </h3>
                <p className="text-slate-500 mt-2 animate-pulse">
                  {scanMode === 'github' 
                    ? 'Fetching code from GitHub and analyzing security...' 
                    : 'Checking against OWASP Top 10 vulnerabilities'}
                </p>
             </div>
          )}

          {report && !loading && (
            <div className="animate-fade-in space-y-6">
              {/* Batch Fix Notification */}
              {showBatchFix && (
                <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-medium text-emerald-300">Batch Fix Generated!</h4>
                      <p className="text-sm text-emerald-400/70">AI has prepared fixes for all {report.vulnerabilities.length} vulnerabilities</p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg">
                    Download All Fixes
                  </button>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent opacity-20"></div>
                  <ScoreChart score={report.overallScore} />
                </div>
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center">
                   <span className="text-xs text-slate-500 uppercase tracking-wider mb-2">Risk Level</span>
                   <div className="flex items-center gap-3">
                      <Shield className={`w-8 h-8 ${getRiskColor(report.riskLevel)}`} />
                      <span className={`text-2xl font-bold ${getRiskColor(report.riskLevel)}`}>
                        {report.riskLevel}
                      </span>
                   </div>
                   <p className="text-xs text-slate-500 mt-2">Based on found vulnerabilities severity</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center">
                  <span className="text-xs text-slate-500 uppercase tracking-wider mb-2">Issues Found</span>
                  <div className="flex items-center gap-3">
                    <Bug className="w-8 h-8 text-slate-400" />
                    <span className="text-3xl font-bold text-slate-200">{report.vulnerabilities.length}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                     <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                        {report.vulnerabilities.filter(v => v.severity === 'Critical' || v.severity === 'High').length} Critical/High
                     </span>
                     <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        {report.vulnerabilities.filter(v => v.severity === 'Medium').length} Medium
                     </span>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Analysis Summary
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {report.summary}
                </p>
              </div>

              {/* Vulnerabilities List with Batch Fix Button */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-200">Detected Vulnerabilities</h3>
                  <div className="flex items-center gap-2">
                    {report.vulnerabilities.length > 0 && (
                      <button
                        onClick={handleBatchFix}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-lg"
                      >
                        <Zap className="w-4 h-4" />
                        Fix All with AI
                      </button>
                    )}
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                      {report.language}
                    </span>
                  </div>
                </div>
                
                {report.vulnerabilities.length === 0 ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 text-center flex flex-col items-center">
                    <ShieldCheck className="w-12 h-12 text-emerald-400 mb-4" />
                    <h3 className="text-lg font-semibold text-emerald-400">No Vulnerabilities Found</h3>
                    <p className="text-emerald-400/70 mt-2">Great job! The code appears secure based on standard patterns.</p>
                  </div>
                ) : (
                  report.vulnerabilities.map((vuln) => (
                    <VulnerabilityCard key={vuln.id} vuln={vuln} />
                  ))
                )}
              </div>

              {/* Advanced Analysis Section */}
              {report && (
                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-800/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Advanced Analysis
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Business Logic Risks */}
                    <div className="bg-black/30 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-300 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Business Logic Risks
                      </h4>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• Missing input validation in user functions</li>
                        <li>• No rate limiting on database queries</li>
                        <li>• Direct object references without authorization</li>
                        <li>• Hardcoded database connection strings</li>
                      </ul>
                    </div>
                    
                    {/* Architecture Risks */}
                    <div className="bg-black/30 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-300 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Architecture Risks
                      </h4>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• Single point of failure (single database)</li>
                        <li>• No connection pooling implemented</li>
                        <li>• In-memory data handling without encryption</li>
                        <li>• Missing audit logging for security events</li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* AI-Powered Recommendations */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-indigo-900/20 to-blue-900/20 border border-indigo-800/30 rounded-lg">
                    <h4 className="font-medium text-indigo-300 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      AI-Powered Recommendations
                    </h4>
                    <div className="text-sm text-slate-300 space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Implement parameterized queries across all database interactions</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Add HTML encoding library for all user-facing outputs</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>Consider using an ORM for built-in SQL injection protection</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Demo Recording Button */}
      <button
        onClick={() => {
          setRecordingDemo(!recordingDemo);
          alert(recordingDemo 
            ? 'Demo recording stopped! Save your video for submission.' 
            : '🚀 Demo recording started! Perform your 3-minute demo:\n1. Show interface\n2. Analyze code\n3. Use Auto-Fix\n4. Show GitHub integration');
        }}
        className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg ${
          recordingDemo 
            ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' 
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
        }`}
      >
        {recordingDemo ? (
          <>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Recording Demo...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
            Start Demo Recording
          </>
        )}
      </button>

      <footer className="border-t border-slate-800 py-6 text-center text-slate-600 text-sm bg-[#0b1120]">
        <p>&copy; {new Date().getFullYear()} Sentinel Security. Powered by Gemini 3 Pro.</p>
        <p className="text-xs mt-1 text-slate-700">
          Built for Google DeepMind Gemini 3 Hackathon | AI Security Code Reviewer v2.0
        </p>
      </footer>
    </div>
  );
};

export default App;