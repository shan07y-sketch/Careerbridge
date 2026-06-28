import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressChart } from '../../components/charts/ProgressChart';
import { AIChart } from '../../components/charts/AIChart';

export const MockInterviewReport: React.FC = () => {
  const navigate = useNavigate();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const mockMetrics = {
    communication: 92,
    technical: 84,
    problemSolving: 88,
    confidence: 78,
    behavioral: 90,
  };

  const metricExplanations: Record<string, string> = {
    communication: "Evaluates filler word frequency, clarity, pronunciation correctness, and dynamic volume ranges.",
    technical: "Scans candidate answer content against engineering taxonomy, core patterns, and React framework specifications.",
    problemSolving: "Checks logic structures, debugging progression (STAR method), and edge cases analysis details.",
    confidence: "Assesses speaking pace consistency, micro-pause gaps, and tone stability indices.",
    behavioral: "Measures alignment with corporate core values, empathy tags, and constructive team resolution narratives."
  };

  const questionFeedbackList = [
    {
      q: 'Explain how you would optimize rendering performance in a React 19 application with nested lists?',
      strength: 'Strong explanation of rendering lifecycle, use of memoization, and batching.',
      gap: 'Could explain custom hooks abstractions and virtual lists for very long grids.',
      score: 88,
      confidence: 84,
      pacing: '130 words/min (Optimal)'
    },
    {
      q: 'Describe a time you had to resolve a complex CSS alignment conflict on a production dashboard.',
      strength: 'Clear problem-solving progression (STAR method), excellent breakdown of layout diagnostics.',
      gap: 'Ensure to mention flex-basis values explicitly to demonstrate granular CSS mechanics.',
      score: 92,
      confidence: 90,
      pacing: '120 words/min (Optimal)'
    }
  ];

  return (
    <PageLayout>
      {/* Header */}
      <section className="text-left">
        <h1 className="font-display text-headline-lg text-primary dark:text-primary-fixed mb-2">AI Interview Report</h1>
        <p className="font-body-lg text-on-surface-variant">
          Detailed metrics feedback compiled from your simulated practice round.
        </p>
      </section>

      {/* Main Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter text-left items-start">
        {/* Left Column: Overall score and Radar analysis */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-8 flex flex-col md:flex-row items-center gap-8 justify-around">
            <ProgressChart 
              percent={87} 
              size={130} 
              label="Overall"
            />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary font-bold">verified_user</span>
                <h3 className="font-headline-md text-primary dark:text-primary-fixed">AI Performance Summary</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
                You demonstrated strong core communication scores ({mockMetrics.communication}%) and robust coding principles, 
                but confidence indices dropped slightly during technical bottlenecks. 
                We recommend checking out Design Systems and CSS specificity guidelines.
              </p>
              
              <div className="flex gap-3">
                <Button 
                  size="sm"
                  onClick={() => navigate('/student/mock-interview')}
                >
                  Start New Session
                </Button>
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/student/dashboard')}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </Card>

          {/* Actionable Learning Resources */}
          <Card className="space-y-4">
            <h3 className="font-headline-md text-primary dark:text-primary-fixed flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">menu_book</span> Recommended Learning Pathways
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-primary mb-1">React 19 Memoization Hooks</h4>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">Learn about automatic rendering caching, compiler boundaries, and dependency optimizations.</p>
                </div>
                <a 
                  href="https://react.dev" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-auto"
                >
                  Explore Documentation <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
              </div>
              
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-primary mb-1">Advanced CSS Grid & Flexbox Alignment</h4>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">Master sizing constraints, shrink behaviors, basis limits, and alignment specificity overrides.</p>
                </div>
                <a 
                  href="https://developer.mozilla.org" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-auto"
                >
                  Open MDN Guides <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
              </div>
            </div>
          </Card>

          {/* Question by question feedback */}
          <div className="space-y-4">
            <h3 className="font-headline-md text-primary dark:text-primary-fixed">Transcript & Critique</h3>
            {questionFeedbackList.map((item, idx) => (
              <Card key={idx} className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-bold text-primary dark:text-primary-fixed">Question {idx + 1} Critique</span>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">
                      Pacing: {item.pacing}
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      Score: {item.score}%
                    </span>
                  </div>
                </div>
                <p className="font-bold text-xs text-primary dark:text-primary-fixed leading-snug">{item.q}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-on-surface-variant pt-2">
                  <div className="bg-green-50/50 dark:bg-primary-container/10 p-3 rounded-lg border border-green-200/50">
                    <p className="font-bold text-green-700 mb-1">Key Strengths</p>
                    <p>{item.strength}</p>
                  </div>
                  <div className="bg-red-50/50 dark:bg-error-container/10 p-3 rounded-lg border border-red-200/50">
                    <p className="font-bold text-error mb-1">Opportunities for Improvement</p>
                    <p>{item.gap}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: AI Radar Web Chart & Metric explanations */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="flex flex-col items-center">
            <h4 className="font-bold text-label-md text-primary uppercase tracking-wider mb-2">Metrics Radar</h4>
            <AIChart 
              metrics={mockMetrics}
              size={280}
            />
          </Card>

          {/* Explainability Block */}
          <Card className="space-y-4">
            <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Metrics Explainability</h4>
            <div className="space-y-3">
              {Object.keys(mockMetrics).map((key) => (
                <div 
                  key={key} 
                  className="relative group p-3 bg-surface bg-surface-container rounded-lg border border-primary/5 text-xs text-left cursor-pointer"
                  onMouseEnter={() => setActiveTooltip(key)}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold capitalize text-primary dark:text-primary-fixed">{key}</span>
                    <span className="text-[10px] text-on-surface-variant/80 flex items-center gap-0.5">
                      Explain <span className="material-symbols-outlined text-[12px]">help</span>
                    </span>
                  </div>
                  {activeTooltip === key && (
                    <div className="mt-2 text-[11px] text-on-surface-variant leading-relaxed p-2 bg-white dark:bg-surface-container-low border border-primary/10 rounded shadow-md z-10 animate-fade-in">
                      {metricExplanations[key]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <div className="h-10"></div>
    </PageLayout>
  );
};

export default MockInterviewReport;
