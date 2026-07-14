import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

export const PlacementAnalytics: React.FC = () => {
  const { showToast } = useToast();

  // Date range state
  const [activeRange, setActiveRange] = useState<'today' | '7days' | '30days' | 'academicyear'>('academicyear');

  // AI Summary Alert
  const handleAISummary = () => {
    showToast('Synthesizing AI Placement Executive Summary & Forecasts...', 'success');
  };

  const handleGenerateReport = () => {
    showToast('Compiling placement reports spreadsheets...', 'success');
  };

  const handleExportPDF = () => {
    showToast('Exporting executive PDF summary dossier...', 'success');
  };

  return (
    <div className="w-full text-left">
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-stack-md mb-stack-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Placement Analytics</h2>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            Monitor placement performance, student success, and university hiring outcomes.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs font-semibold shrink-0">
          <button 
            onClick={handleGenerateReport}
            className="px-4 py-2 bg-white text-primary border border-outline-variant/35 rounded-lg hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">description</span> 
            Generate Report
          </button>
          
          <button 
            onClick={handleExportPDF}
            className="px-4 py-2 bg-white text-primary border border-outline-variant/35 rounded-lg hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> 
            Export PDF
          </button>
          
          <button 
            onClick={handleAISummary}
            className="px-5 py-2 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-sm border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> 
            AI Executive Summary
          </button>
        </div>
      </header>

      {/* Date Filters */}
      <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl w-fit mb-stack-lg text-xs font-bold text-on-surface-variant">
        <button 
          onClick={() => setActiveRange('today')}
          className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer border-none ${activeRange === 'today' ? 'bg-white text-primary shadow-sm' : 'bg-transparent hover:text-primary'}`}
        >
          Today
        </button>
        <button 
          onClick={() => setActiveRange('7days')}
          className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer border-none ${activeRange === '7days' ? 'bg-white text-primary shadow-sm' : 'bg-transparent hover:text-primary'}`}
        >
          Last 7 Days
        </button>
        <button 
          onClick={() => setActiveRange('30days')}
          className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer border-none ${activeRange === '30days' ? 'bg-white text-primary shadow-sm' : 'bg-transparent hover:text-primary'}`}
        >
          Last 30 Days
        </button>
        <button 
          onClick={() => setActiveRange('academicyear')}
          className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer border-none ${activeRange === 'academicyear' ? 'bg-white text-primary shadow-sm' : 'bg-transparent hover:text-primary'}`}
        >
          Academic Year
        </button>
        
        <div className="w-[1px] h-4 bg-outline-variant/50 mx-1.5"></div>
        
        <button 
          onClick={() => showToast('Opening calendar date picker...', 'info')}
          className="px-4 py-1.5 rounded-lg text-on-surface-variant flex items-center gap-2 cursor-pointer bg-transparent border-none font-bold"
        >
          <span className="material-symbols-outlined text-[16px]">calendar_today</span> 
          Custom Range
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg text-left">
        {/* KPI Card 1 */}
        <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Total Students</span>
            <span className="text-xs font-bold bg-green-50 px-2 py-0.5 rounded text-green-700">+3.2%</span>
          </div>
          <h3 className="text-2xl font-black text-primary mb-2">12,504</h3>
          <div className="w-full h-8 flex items-end gap-1 mt-2">
            <div className="w-full bg-primary/10 h-1/2 rounded-sm"></div>
            <div className="w-full bg-primary/10 h-2/3 rounded-sm"></div>
            <div className="w-full bg-primary/10 h-3/4 rounded-sm"></div>
            <div className="w-full bg-primary/10 h-1/2 rounded-sm"></div>
            <div className="w-full bg-primary h-5/6 rounded-sm"></div>
          </div>
        </div>

        {/* KPI Card 2 */}
        <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Eligible Students</span>
            <span className="text-on-surface-variant text-[10px] font-semibold">88% Total</span>
          </div>
          <h3 className="text-2xl font-black text-primary mb-2">10,980</h3>
          <div className="w-full h-8 flex items-end gap-1 mt-2">
            <div className="w-full bg-primary/10 h-1/3 rounded-sm"></div>
            <div className="w-full bg-primary/10 h-3/5 rounded-sm"></div>
            <div className="w-full bg-primary h-4/5 rounded-sm"></div>
            <div className="w-full bg-primary/10 h-2/3 rounded-sm"></div>
            <div className="w-full bg-primary/10 h-1/2 rounded-sm"></div>
          </div>
        </div>

        {/* KPI Card 3 */}
        <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Students Placed</span>
            <span className="text-xs font-bold bg-primary-fixed text-primary px-2 py-0.5 rounded">+12.5%</span>
          </div>
          <h3 className="text-2xl font-black text-primary mb-2">8,402</h3>
          <div className="w-full h-8 flex items-end gap-1 mt-2">
            <div className="w-full bg-primary/10 h-2/3 rounded-sm"></div>
            <div className="w-full bg-primary/10 h-1/2 rounded-sm"></div>
            <div className="w-full bg-primary/10 h-3/4 rounded-sm"></div>
            <div className="w-full bg-primary/10 h-5/6 rounded-sm"></div>
            <div className="w-full bg-primary h-full rounded-sm"></div>
          </div>
        </div>

        {/* KPI Card 4 */}
        <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 duration-300 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Placement %</span>
            <span className="text-xs font-bold bg-primary-fixed text-primary px-2 py-0.5 rounded">Goal 90%</span>
          </div>
          <h3 className="text-2xl font-black text-primary mb-2">76.5%</h3>
          <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden mt-4">
            <div className="bg-primary h-full w-[76.5%]"></div>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-stack-lg text-left">
        <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm hover:-translate-y-0.5 duration-300 transition-transform text-xs font-semibold">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">Active Companies</p>
          <h3 className="text-2xl font-black text-primary">214</h3>
          <p className="text-[10px] text-green-600 font-bold mt-1">+17.5% YoY Growth</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm hover:-translate-y-0.5 duration-300 transition-transform text-xs font-semibold">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">Active Drives</p>
          <h3 className="text-2xl font-black text-primary">32</h3>
          <p className="text-[10px] text-on-surface-variant font-medium mt-1">Scheduled for Q4: 18</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm hover:-translate-y-0.5 duration-300 transition-transform text-xs font-semibold">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">Highest Package</p>
          <h3 className="text-2xl font-black text-primary">$240k</h3>
          <p className="text-[10px] text-on-surface-variant font-medium mt-1">Offered by QuantSystems</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm hover:-translate-y-0.5 duration-300 transition-transform text-xs font-semibold">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">Average Package</p>
          <h3 className="text-2xl font-black text-primary">$85.4k</h3>
          <p className="text-[10px] text-on-surface-variant font-medium mt-1">Core Tech Sector Average</p>
        </div>
      </div>

      {/* Placement Funnel Section */}
      <section className="mb-stack-lg text-left">
        <div className="bg-white p-8 rounded-2xl border border-primary/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline-md text-headline-md text-primary font-bold">Placement Conversion Funnel</h3>
            <button 
              onClick={() => showToast('Displaying placement funnel insights metrics...', 'info')}
              className="text-primary font-bold text-xs flex items-center gap-1 cursor-pointer bg-transparent border-none"
            >
              View Details <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-0 font-semibold text-center text-xs">
            {/* Funnel Step 1 */}
            <div className="flex flex-col items-center">
              <div className="bg-primary-container text-white w-full h-24 flex flex-col items-center justify-center p-2 rounded-lg lg:rounded-none">
                <span className="text-sm font-black">12,504</span>
                <span className="text-[9px] uppercase tracking-wider mt-1 opacity-80">Registered</span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-bold mt-2">100%</span>
            </div>
            
            {/* Funnel Step 2 */}
            <div className="flex flex-col items-center">
              <div className="bg-primary-container/90 text-white w-full h-24 flex flex-col items-center justify-center p-2 rounded-lg lg:rounded-none">
                <span className="text-sm font-black">10,980</span>
                <span className="text-[9px] uppercase tracking-wider mt-1 opacity-80">Eligible</span>
              </div>
              <span className="text-[10px] text-error font-bold mt-2">-12%</span>
            </div>

            {/* Funnel Step 3 */}
            <div className="flex flex-col items-center">
              <div className="bg-primary-container/80 text-white w-full h-24 flex flex-col items-center justify-center p-2 rounded-lg lg:rounded-none">
                <span className="text-sm font-black">10,102</span>
                <span className="text-[9px] uppercase tracking-wider mt-1 opacity-80">Applied</span>
              </div>
              <span className="text-[10px] text-error font-bold mt-2">-8%</span>
            </div>

            {/* Funnel Step 4 */}
            <div className="flex flex-col items-center">
              <div className="bg-primary-container/70 text-white w-full h-24 flex flex-col items-center justify-center p-2 rounded-lg lg:rounded-none">
                <span className="text-sm font-black">9,450</span>
                <span className="text-[9px] uppercase tracking-wider mt-1 opacity-80">Shortlisted</span>
              </div>
              <span className="text-[10px] text-error font-bold mt-2">-6%</span>
            </div>

            {/* Funnel Step 5 */}
            <div className="flex flex-col items-center">
              <div className="bg-primary-container/60 text-white w-full h-24 flex flex-col items-center justify-center p-2 rounded-lg lg:rounded-none">
                <span className="text-sm font-black">9,120</span>
                <span className="text-[9px] uppercase tracking-wider mt-1 opacity-80">Interviewed</span>
              </div>
              <span className="text-[10px] text-error font-bold mt-2">-4%</span>
            </div>

            {/* Funnel Step 6 */}
            <div className="flex flex-col items-center">
              <div className="bg-primary-container/50 text-white w-full h-24 flex flex-col items-center justify-center p-2 rounded-lg lg:rounded-none">
                <span className="text-sm font-black">8,650</span>
                <span className="text-[9px] uppercase tracking-wider mt-1 opacity-80">Offered</span>
              </div>
              <span className="text-[10px] text-error font-bold mt-2">-5%</span>
            </div>

            {/* Funnel Step 7 */}
            <div className="flex flex-col items-center">
              <div className="bg-primary-container/40 text-primary w-full h-24 flex flex-col items-center justify-center p-2 rounded-lg lg:rounded-none">
                <span className="text-sm font-black">8,480</span>
                <span className="text-[9px] uppercase tracking-wider mt-1 opacity-80">Accepted</span>
              </div>
              <span className="text-[10px] text-error font-bold mt-2">-2%</span>
            </div>

            {/* Funnel Step 8 */}
            <div className="flex flex-col items-center">
              <div className="bg-primary-container/30 text-primary w-full h-24 flex flex-col items-center justify-center p-2 rounded-lg lg:rounded-none">
                <span className="text-sm font-black">8,402</span>
                <span className="text-[9px] uppercase tracking-wider mt-1 opacity-80">Joined</span>
              </div>
              <span className="text-[10px] text-primary font-bold mt-2">Final 67.2%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-stack-lg text-left">
        {/* Left Column: Primary Charts */}
        <div className="lg:col-span-2 flex flex-col gap-gutter text-xs font-semibold">
          
          {/* Chart 1: Placement Trends */}
          <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-headline-md text-headline-md text-primary font-bold">Placement Trends</h4>
              <div className="flex items-center gap-4 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
                  <span>Placed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-primary-container rounded-full opacity-40"></span>
                  <span>Offers</span>
                </div>
              </div>
            </div>
            
            <div className="w-full h-64 bg-surface-container-low rounded-xl relative overflow-hidden">
              <svg className="w-full h-full p-4" viewBox="0 0 800 200">
                <path d="M0,150 Q100,140 200,100 T400,120 T600,60 T800,40" fill="none" stroke="#023629" strokeWidth="3"></path>
                <path className="opacity-30" d="M0,160 Q100,150 200,110 T400,130 T600,70 T800,50" fill="none" stroke="#023629" strokeDasharray="4,4" strokeWidth="2"></path>
              </svg>
              <div className="absolute bottom-4 left-0 w-full flex justify-around text-[10px] text-on-surface-variant font-bold font-sans">
                <span>AUG</span><span>SEP</span><span>OCT</span><span>NOV</span><span>DEC</span><span>JAN</span><span>FEB</span><span>MAR</span>
              </div>
            </div>
          </div>

          {/* Chart 2: Department Performance */}
          <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm">
            <h4 className="font-headline-md text-headline-md text-primary font-bold mb-6">Department Performance Matrix</h4>
            
            <div className="space-y-4">
              {/* CSE */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-primary font-bold">Computer Science (CSE)</span>
                  <span className="text-on-surface-variant font-medium">96.4% Placed • Avg $112k</span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[96.4%]"></div>
                </div>
              </div>
              
              {/* AI&DS */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-primary font-bold">AI &amp; Data Science</span>
                  <span className="text-on-surface-variant font-medium">94.2% Placed • Avg $108k</span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[94.2%]"></div>
                </div>
              </div>

              {/* IT */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-primary font-bold">Information Technology</span>
                  <span className="text-on-surface-variant font-medium">89.1% Placed • Avg $94k</span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[89.1%] opacity-85"></div>
                </div>
              </div>

              {/* ECE */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-primary font-bold">Electronics (ECE)</span>
                  <span className="text-on-surface-variant font-medium">82.5% Placed • Avg $78k</span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[82.5%] opacity-70"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights & Word Cloud */}
        <div className="flex flex-col gap-gutter text-xs font-semibold">
          {/* AI Placement Insights */}
          <div className="bg-primary text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg height="100%" width="100%"><pattern height="20" id="grid-pattern" patternUnits="userSpaceOnUse" width="20"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"></path></pattern><rect fill="url(#grid-pattern)" height="100%" width="100%"></rect></svg>
            </div>
            
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">AI Executive Insights</h4>
            </div>
            
            <div className="space-y-6 relative z-10 text-xs">
              <div>
                <p className="text-[10px] text-primary-fixed uppercase font-black tracking-widest mb-1">Placement Forecast</p>
                <p className="leading-relaxed text-surface-container font-medium">
                  Projected to reach <span className="font-bold text-primary-fixed">92% placement rate</span> by June based on historical hiring velocity and current pipeline.
                </p>
              </div>
              
              <div className="p-3 bg-primary-container/40 rounded-lg border border-primary-fixed/20">
                <p className="text-[10px] text-primary-fixed uppercase font-black tracking-widest mb-1">Risk Alert</p>
                <p className="leading-relaxed text-primary-fixed font-medium">142 students in Mechanical Dept are "At Risk" due to 0 applications in current cycle.</p>
              </div>
              
              <div>
                <p className="text-[10px] text-primary-fixed uppercase font-black tracking-widest mb-2">Skill Gap Analysis</p>
                <ul className="space-y-2 leading-relaxed font-medium text-surface-container">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-primary-fixed shrink-0">check_circle</span>
                    <span>Demand for 'Rust' increased by 40% this quarter.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-primary-fixed shrink-0">check_circle</span>
                    <span>System Design proficiency is now a top-3 filter.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Skill Analytics */}
          <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm text-left">
            <h4 className="font-bold text-primary uppercase tracking-wider text-xs mb-6">Demanded Skills</h4>
            <div className="flex flex-wrap gap-2 font-bold text-xs">
              <span className="px-3.5 py-2 bg-primary-container text-on-primary-container rounded-lg text-sm">Cloud Architecture</span>
              <span className="px-2.5 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg text-xs">Rust</span>
              <span className="px-2.5 py-1.5 bg-secondary-container/50 text-on-secondary-container rounded-lg text-[11px]">React Native</span>
              <span className="px-3.5 py-2 bg-primary-container/85 text-on-primary-container rounded-lg text-xs">System Design</span>
              <span className="px-2.5 py-1.5 bg-surface-container text-on-surface-variant rounded-lg text-[10px]">Python</span>
              <span className="px-3.5 py-2 bg-primary-container/60 text-on-primary-container rounded-lg text-xs">Kubernetes</span>
              <span className="px-2.5 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg text-xs">GoLang</span>
              <span className="px-2.5 py-1.5 bg-surface-container text-on-surface-variant rounded-lg text-[10px]">Terraform</span>
              <span className="px-3.5 py-2 bg-primary-container text-on-primary-container rounded-lg text-xs">Machine Learning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboards & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-stack-lg text-left text-xs font-semibold">
        {/* Top Recruiters */}
        <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm">
          <h4 className="font-bold text-primary uppercase tracking-wider text-xs mb-6">Top Recruiters</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center font-bold text-primary shrink-0">MS</div>
                <div>
                  <p className="font-bold text-primary text-xs">Microsoft</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">42 Hires • $82k Avg</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary">trending_up</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center font-bold text-primary shrink-0">AMZ</div>
                <div>
                  <p className="font-bold text-primary text-xs">Amazon</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">38 Hires • $79k Avg</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary">trending_up</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center font-bold text-primary shrink-0">GS</div>
                <div>
                  <p className="font-bold text-primary text-xs">Goldman Sachs</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">24 Hires • $110k Avg</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">trending_flat</span>
            </div>
          </div>
        </div>

        {/* Heatmap Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-primary/5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-primary uppercase tracking-wider text-xs">Hiring Density: Dept vs Industry</h4>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span>Low</span>
              <div className="flex h-3 w-20 rounded overflow-hidden shrink-0">
                <div className="flex-1 bg-primary/10"></div>
                <div className="flex-1 bg-primary/30"></div>
                <div className="flex-1 bg-primary/60"></div>
                <div className="flex-1 bg-primary"></div>
              </div>
              <span>High</span>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-2 text-center items-center">
            <div></div>
            <div className="text-[9px] uppercase tracking-tighter font-extrabold text-on-surface-variant">Fintech</div>
            <div className="text-[9px] uppercase tracking-tighter font-extrabold text-on-surface-variant">SaaS</div>
            <div className="text-[9px] uppercase tracking-tighter font-extrabold text-on-surface-variant">E-com</div>
            <div className="text-[9px] uppercase tracking-tighter font-extrabold text-on-surface-variant">Core</div>
            
            <div className="text-[10px] uppercase font-black text-primary text-left">CSE</div>
            <div className="aspect-square bg-primary rounded-sm shadow-sm"></div>
            <div className="aspect-square bg-primary rounded-sm shadow-sm"></div>
            <div className="aspect-square bg-primary/60 rounded-sm shadow-sm"></div>
            <div className="aspect-square bg-primary/30 rounded-sm shadow-sm"></div>
            
            <div className="text-[10px] uppercase font-black text-primary text-left">IT</div>
            <div className="aspect-square bg-primary/60 rounded-sm shadow-sm"></div>
            <div className="aspect-square bg-primary rounded-sm shadow-sm"></div>
            <div className="aspect-square bg-primary rounded-sm shadow-sm"></div>
            <div className="aspect-square bg-primary/10 rounded-sm shadow-sm"></div>
            
            <div className="text-[10px] uppercase font-black text-primary text-left">ECE</div>
            <div className="aspect-square bg-primary/30 rounded-sm shadow-sm"></div>
            <div className="aspect-square bg-primary/10 rounded-sm shadow-sm"></div>
            <div className="aspect-square bg-primary/30 rounded-sm shadow-sm"></div>
            <div className="aspect-square bg-primary rounded-sm shadow-sm"></div>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter text-left text-xs font-semibold">
        <div className="p-6 bg-green-50/50 border border-primary/10 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4 text-primary font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined">emoji_events</span>
            <h5>Achievements</h5>
          </div>
          <ul className="text-on-surface-variant space-y-2 leading-relaxed font-medium text-xs">
            <li>• Highest package record broken ($240k).</li>
            <li>• 12% YoY increase in Tier-1 recruiters.</li>
            <li>• 100% placement for AI&amp;DS first batch.</li>
          </ul>
        </div>
        
        <div className="p-6 bg-red-50/50 border border-error/10 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4 text-error font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined">warning</span>
            <h5>Challenges</h5>
          </div>
          <ul className="text-on-surface-variant space-y-2 leading-relaxed font-medium text-xs">
            <li>• Mechanical Dept placement lags by 15%.</li>
            <li>• Interview-to-Offer ratio dipped in SaaS.</li>
            <li>• Skill gap identified in Distributed Systems.</li>
          </ul>
        </div>

        <div className="p-6 bg-blue-50/50 border border-primary/10 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4 text-primary font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined">lightbulb</span>
            <h5>Recommendations</h5>
          </div>
          <ul className="text-on-surface-variant space-y-2 leading-relaxed font-medium text-xs">
            <li>• Mandatory 'System Design' workshops.</li>
            <li>• Targeted placement drive for Mech Core.</li>
            <li>• Implement AI-led mock interview sessions.</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default PlacementAnalytics;
