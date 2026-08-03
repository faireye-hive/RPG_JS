import React, { useState } from 'react';
import { X, Terminal, Copy, Check, Globe, Layers } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface GitHubPagesGuideModalProps {
  onClose: () => void;
}

const GithubIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const GitHubPagesGuideModal: React.FC<GitHubPagesGuideModalProps> = ({ onClose }) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyToClipboard = (text: string, stepIdx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIdx);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const steps = [
    {
      title: "1. Install gh-pages helper package",
      code: "npm install -D gh-pages",
      desc: "Adds the gh-pages deployment utility to your dev dependencies."
    },
    {
      title: "2. Add deploy script to package.json",
      code: `"scripts": {\n  "predeploy": "npm run build",\n  "deploy": "gh-pages -d dist"\n}`,
      desc: "This automatically builds static output into dist/ and pushes it to gh-pages branch."
    },
    {
      title: "3. Run deploy command",
      code: "npm run deploy",
      desc: "Your game will be built and published directly to your GitHub repository Pages!"
    }
  ];

  const githubActionYaml = `name: Deploy to GitHub Pages

on:
  push:
    branches: [main, master]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col my-8 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono">
            <GithubIcon className="w-5 h-5 text-cyan-400" /> DEPLOY TO GITHUB PAGES
          </h2>
          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-xs sm:text-sm text-slate-300 overflow-y-auto pr-1">
          
          <div className="p-3.5 bg-cyan-950/40 rounded-xl border border-cyan-800/40 text-cyan-200 text-xs flex items-start gap-2.5">
            <Globe className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-cyan-300 mb-0.5">Configured for relative paths!</strong>
              Your <code className="bg-cyan-900/60 px-1 py-0.5 rounded font-mono">vite.config.ts</code> uses <code className="bg-cyan-900/60 px-1 py-0.5 rounded font-mono">base: './'</code> so assets load perfectly on subpaths like <code className="bg-cyan-900/60 px-1 py-0.5 rounded font-mono">username.github.io/Javascript-RPG/</code>!
            </div>
          </div>

          {/* Quick Steps */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5 font-mono">
              <Terminal className="w-4 h-4 text-emerald-400" /> Quick Deploy Method
            </h3>

            {steps.map((step, idx) => (
              <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">{step.title}</span>
                  <button
                    onClick={() => copyToClipboard(step.code, idx)}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    {copiedStep === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">{step.desc}</p>
                <pre className="p-2.5 bg-slate-900 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto border border-slate-800">
                  {step.code}
                </pre>
              </div>
            ))}
          </div>

          {/* Alternative GitHub Actions */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-400" /> Automated GitHub Action (.github/workflows/deploy.yml)
              </span>
              <button
                onClick={() => copyToClipboard(githubActionYaml, 99)}
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-mono transition-colors cursor-pointer"
              >
                {copiedStep === 99 ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied YAML
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" /> Copy Workflow
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Create <code className="bg-slate-900 px-1 rounded font-mono">.github/workflows/deploy.yml</code> in your repository for automatic deployment on every push to main!
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm rounded-xl transition-all cursor-pointer"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
