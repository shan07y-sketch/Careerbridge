import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Smooth scroll logic triggered by react-router-dom hash location changes
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
      }
    } else if (location.pathname === '/') {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const handleNav = (hash: string) => {
    navigate(hash);
    if (location.hash === hash) {
      const id = hash.replace('#', '');
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMobileNav = (hash: string) => {
    setIsMobileMenuOpen(false);
    handleNav(hash);
  };
  
  // Simulated AI Career Coach Interaction
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Your resume is strong, but adding more metrics to your 'Project' section could increase your match rate by 15%." },
    { role: 'user', text: "That's helpful! Can you show me some examples?" }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          text: `Sure! Instead of writing 'Developed features for the app', try: 'Implemented modular layout widths and a responsive sidebar drawer using Tailwind, improving mobile usability scores by 25% across all 15 key student pages.'` 
        }
      ]);
    }, 1000);
  };

  return (
    <div className="bg-background text-on-background font-body-md overflow-x-hidden min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/20">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex justify-between items-center h-20">
          <div className="flex items-center gap-12">
            <Link 
              to="/#" 
              onClick={() => {
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="font-display text-headline-md font-bold text-primary flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary text-2xl font-bold">polyline</span>
              CareerBridge
            </Link>
            <nav className="hidden lg:flex items-center gap-8">
              <Link 
                to="/#hero" 
                onClick={() => handleNav('#hero')} 
                className="text-primary font-bold border-b-2 border-primary pb-1 font-label-md text-label-md"
              >
                Home
              </Link>
              <Link 
                to="/#features" 
                onClick={() => handleNav('#features')} 
                className="text-on-surface-variant font-medium hover:text-primary transition-all duration-300 font-label-md text-label-md"
              >
                Features
              </Link>
              <Link 
                to="/#how-it-works" 
                onClick={() => handleNav('#how-it-works')} 
                className="text-on-surface-variant font-medium hover:text-primary transition-all duration-300 font-label-md text-label-md"
              >
                How It Works
              </Link>
              <Link 
                to="/#universities" 
                onClick={() => handleNav('#universities')} 
                className="text-on-surface-variant font-medium hover:text-primary transition-all duration-300 font-label-md text-label-md"
              >
                Universities
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/auth')}
              className="hidden md:block text-primary font-bold hover:opacity-80 transition-all duration-300 font-label-md text-label-md"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/role-selection')}
              className="bg-primary-container text-on-primary px-6 py-2.5 rounded-lg font-bold hover:shadow-lg transition-all duration-300 font-label-md text-label-md active:scale-95"
            >
              Start Your Journey
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-primary flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container"
            >
              <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Responsive Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-surface border-b border-outline-variant/30 py-6 px-margin-mobile flex flex-col gap-4 animate-[fadeInUp_0.3s_ease-out]">
            <Link 
              className="text-primary font-bold text-lg" 
              to="/#hero"
              onClick={() => handleMobileNav('#hero')}
            >
              Home
            </Link>
            <Link 
              className="text-on-surface-variant font-medium text-lg" 
              to="/#features"
              onClick={() => handleMobileNav('#features')}
            >
              Features
            </Link>
            <Link 
              className="text-on-surface-variant font-medium text-lg" 
              to="/#how-it-works"
              onClick={() => handleMobileNav('#how-it-works')}
            >
              How It Works
            </Link>
            <Link 
              className="text-on-surface-variant font-medium text-lg" 
              to="/#universities"
              onClick={() => handleMobileNav('#universities')}
            >
              Universities
            </Link>
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/auth');
              }}
              className="text-primary font-bold text-lg text-left mt-2 py-2 border-t border-outline-variant/10"
            >
              Sign In
            </button>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section 
          id="hero"
          className="pt-24 md:pt-32 pb-32 overflow-hidden"
          style={{
            background: 'radial-gradient(circle at top right, rgba(233, 223, 200, 0.4) 0%, rgba(249, 250, 247, 1) 60%)'
          }}
        >
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 space-y-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-container/50 rounded-full text-on-secondary-container font-label-sm text-label-sm border border-primary/5">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <span className="tracking-wide uppercase font-bold text-[10px]">The Future of Intelligent Recruitment</span>
              </div>
              
              <h1 className="font-display text-display text-primary leading-tight text-4xl md:text-5xl lg:text-6xl font-extrabold">
                One Platform.<br />
                Three Communities.<br />
                <span className="text-on-primary-container">Endless Opportunities.</span>
              </h1>
              
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                CareerBridge is an AI-powered platform connecting students, universities and employers through intelligent recruitment, career development and professional networking.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <button 
                  onClick={() => navigate('/role-selection')}
                  className="bg-primary-container text-on-primary font-bold px-10 py-4 rounded-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-300"
                >
                  Start Your Journey
                </button>
                <Link 
                  to="/#features"
                  onClick={() => handleNav('#features')}
                  className="bg-secondary-container/40 text-primary font-bold px-10 py-4 rounded-lg border border-primary/10 hover:bg-secondary-container transition-all duration-300 flex items-center justify-center cursor-pointer"
                >
                  Explore Platform
                </Link>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
              <div className="absolute -z-10 inset-0 bg-primary/5 blur-[120px] rounded-full scale-125"></div>
              <img 
                alt="CareerBridge 3D Isometric Illustration" 
                className="w-full h-auto drop-shadow-2xl rounded-xl transition-all duration-300 hover:scale-[1.02]" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWMSkLDEaCOtEdDD9HCwRX0hdNRLQhiPNtkwKwVG1fhwp7qLNGu4Y4rKmU5pPUp1YfElMvLUDYnQInBYTNgvaksVb89udQPSppxzh5ULk-ZQn6-l1c9XUYDRUmesmmoRB-1lFxhm8sPENQdoj134MtfyQmyNPrsTIUVAqpiZg7dBVF0CTBHdPA6DDEM-wj8JGXZP00cx4zhUfnIzXEUY30KbgWx8eTz-QDzUS-mIQiU0EApLbMm3osHlTDepJkJVzWahZmV6ipwDc"
              />
            </div>
          </div>
        </section>

        {/* Platform Preview Section */}
        <section className="py-32 bg-surface-container-low overflow-hidden">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center mb-24">
            <h2 className="font-display text-[40px] leading-[48px] text-primary mb-6 font-bold">Experience CareerBridge</h2>
            <p className="text-on-surface-variant text-body-lg max-w-3xl mx-auto">
              A unified interface designed for impact. Track readiness, analyze resumes, and find matches in seconds.
            </p>
          </div>
          
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="bg-surface-container-lowest rounded-[24px] p-6 md:p-10 shadow-[0_32px_64px_rgba(2,54,41,0.08)] border border-outline-variant/20 scale-[1.02]">
              <div className="grid grid-cols-12 gap-8">
                {/* Sidebar Mock */}
                <div className="hidden lg:flex lg:col-span-1 flex-col gap-10 py-6 border-r border-outline-variant/10">
                  <div className="w-12 h-12 bg-primary rounded-lg mx-auto flex items-center justify-center text-white shadow-lg cursor-pointer">
                    <span className="material-symbols-outlined">dashboard</span>
                  </div>
                  <div className="w-12 h-12 text-on-surface-variant/30 mx-auto flex items-center justify-center cursor-pointer hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">work</span>
                  </div>
                  <div className="w-12 h-12 text-on-surface-variant/30 mx-auto flex items-center justify-center cursor-pointer hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">school</span>
                  </div>
                  <div className="w-12 h-12 text-on-surface-variant/30 mx-auto flex items-center justify-center mt-auto cursor-pointer hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">settings</span>
                  </div>
                </div>
                
                {/* Main Content Mock */}
                <div className="col-span-12 lg:col-span-11 grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Column */}
                  <div className="space-y-8">
                    <div className="bg-surface p-8 rounded-lg border border-outline-variant/30 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-sm text-primary uppercase tracking-wider">Career Readiness</h4>
                        <span className="material-symbols-outlined text-primary-container text-xl">insights</span>
                      </div>
                      <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle className="text-surface-container-high" cx="80" cy="80" fill="transparent" r="72" stroke="currentColor" strokeWidth="10"></circle>
                          <circle className="text-primary-container" cx="80" cy="80" fill="transparent" r="72" stroke="currentColor" strokeDasharray="452.4" strokeDashoffset="67.8" strokeLinecap="round" strokeWidth="10"></circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-extrabold text-primary">85%</span>
                          <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mt-1">High Potential</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-surface p-8 rounded-lg border border-outline-variant/30 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-sm text-primary uppercase tracking-wider">AI Resume Analysis</h4>
                        <span className="text-xs font-bold text-on-primary-container px-2 py-0.5 bg-primary-container/10 rounded">Live</span>
                      </div>
                      <div className="space-y-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/5 rounded flex items-center justify-center text-primary-container">
                            <span className="material-symbols-outlined">description</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-bold">ATS Compatibility</span>
                              <span className="text-xs font-bold">92%</span>
                            </div>
                            <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                              <div className="h-full bg-primary-container w-[92%] rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Middle Column */}
                  <div className="space-y-8">
                    <div className="bg-surface p-8 rounded-lg border border-outline-variant/30 shadow-sm h-full flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-8">
                          <h4 className="font-bold text-sm text-primary uppercase tracking-wider">Job Recommendations</h4>
                          <button onClick={() => navigate('/role-selection')} className="text-xs text-primary-container font-bold hover:underline">See All</button>
                        </div>
                        <div className="space-y-5">
                          <div 
                            onClick={() => navigate('/role-selection')}
                            className="p-4 bg-white rounded-lg border border-outline-variant/20 flex items-center gap-4 hover:translate-y-[-4px] transition-all duration-300 cursor-pointer"
                          >
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">G</div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-primary">Google &bull; Product Intern</p>
                              <p className="text-[10px] text-on-surface-variant font-medium mt-1">Mountain View, CA</p>
                            </div>
                            <span className="material-symbols-outlined text-primary-container/40">chevron_right</span>
                          </div>
                          
                          <div 
                            onClick={() => navigate('/role-selection')}
                            className="p-4 bg-white rounded-lg border border-outline-variant/20 flex items-center gap-4 hover:translate-y-[-4px] transition-all duration-300 cursor-pointer"
                          >
                            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 font-bold text-lg">A</div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-primary">Adobe &bull; UX Designer</p>
                              <p className="text-[10px] text-on-surface-variant font-medium mt-1">Remote</p>
                            </div>
                            <span className="material-symbols-outlined text-primary-container/40">chevron_right</span>
                          </div>
                          
                          <div 
                            onClick={() => navigate('/role-selection')}
                            className="p-4 bg-white rounded-lg border border-outline-variant/20 flex items-center gap-4 hover:translate-y-[-4px] transition-all duration-300 border-primary-container/20 bg-primary-container/[0.02] cursor-pointer"
                          >
                            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 font-bold text-lg">Z</div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-primary">Zoho &bull; SWE Intern</p>
                              <p className="text-[10px] text-on-primary-container font-bold mt-1">Offer Pending</p>
                            </div>
                            <span className="material-symbols-outlined text-primary-container">verified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column (Simulated AI Career Coach) */}
                  <div className="space-y-8">
                    <div className="bg-primary-container rounded-lg p-8 text-white h-full flex flex-col shadow-xl">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-lg">smart_toy</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm tracking-wide">AI Career Coach</h4>
                          <span className="text-[10px] text-white/60">Online</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-4 overflow-y-auto max-h-[180px] custom-scrollbar pr-2 mb-4">
                        {messages.map((msg, i) => (
                          <div 
                            key={i} 
                            className={`p-3.5 rounded-lg text-xs leading-relaxed max-w-[90%] ${
                              msg.role === 'ai' 
                                ? 'bg-white/10 rounded-tl-none mr-auto' 
                                : 'bg-white/25 rounded-tr-none ml-auto'
                            }`}
                          >
                            <p>{msg.text}</p>
                          </div>
                        ))}
                      </div>
                      
                      <form onSubmit={handleSendMessage} className="mt-auto relative pt-4 border-t border-white/10">
                        <input 
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          className="w-full bg-white/10 border-none rounded-lg py-3 pl-4 pr-10 text-xs text-white placeholder-white/50 focus:ring-1 focus:ring-white/40 focus:outline-none" 
                          placeholder="Ask anything..." 
                          type="text"
                        />
                        <button type="submit" className="absolute right-3 top-[26px] text-white/70 hover:text-white transition-all">
                          <span className="material-symbols-outlined text-lg">send</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
                
                {/* Bottom Strip */}
                <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                  <div className="bg-surface p-6 rounded-lg border border-outline-variant/30 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center text-primary-container shadow-inner">
                        <span className="material-symbols-outlined">event_available</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">Upcoming Interviews</p>
                        <p className="text-[11px] text-on-surface-variant mt-1">Technical Round &bull; Microsoft &bull; Tomorrow, 2:00 PM</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/role-selection')}
                      className="bg-primary-container text-white text-[10px] px-4 py-2 rounded font-bold hover:opacity-90 transition-all duration-300"
                    >
                      Join Room
                    </button>
                  </div>
                  
                  <div className="bg-surface p-6 rounded-lg border border-outline-variant/30 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-tertiary-container/10 rounded-lg flex items-center justify-center text-tertiary">
                        <span className="material-symbols-outlined">notifications_active</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">Application Tracker</p>
                        <p className="text-[11px] text-on-surface-variant mt-1">3 applications updated since your last visit</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center text-primary relative">
                      <span className="material-symbols-outlined text-lg">notifications</span>
                      <span className="absolute top-0 right-0 w-3 h-3 bg-error rounded-full border-2 border-surface"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why CareerBridge Section */}
        <section id="features" className="py-section-gap bg-surface">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <h2 className="font-display text-[40px] leading-[48px] text-primary mb-24 text-center font-bold">Why Choose CareerBridge?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center p-10 bg-white rounded-lg border border-outline-variant/20 hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-300 group">
                <div className="w-20 h-20 bg-primary-container/5 text-primary-container rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary-container group-hover:text-white transition-all duration-300 shadow-sm">
                  <span className="material-symbols-outlined text-4xl">psychology</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-4 font-semibold">AI Career Guidance</h3>
                <p className="text-on-surface-variant text-body-md leading-relaxed">
                  Personalized roadmaps and skill assessments driven by state-of-the-art career intelligence models.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-10 bg-white rounded-lg border border-outline-variant/20 hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-300 group">
                <div className="w-20 h-20 bg-primary-container/5 text-primary-container rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary-container group-hover:text-white transition-all duration-300 shadow-sm">
                  <span className="material-symbols-outlined text-4xl">handshake</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-4 font-semibold">Industry Connections</h3>
                <p className="text-on-surface-variant text-body-md leading-relaxed">
                  Direct access to a curated network of top-tier employers and innovative high-growth startups.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-10 bg-white rounded-lg border border-outline-variant/20 hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-300 group">
                <div className="w-20 h-20 bg-primary-container/5 text-primary-container rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary-container group-hover:text-white transition-all duration-300 shadow-sm">
                  <span className="material-symbols-outlined text-4xl">business_center</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-4 font-semibold">Placement Management</h3>
                <p className="text-on-surface-variant text-body-md leading-relaxed">
                  Streamlined dashboard for universities to track, manage, and boost student placement success metrics.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-10 bg-white rounded-lg border border-outline-variant/20 hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-300 group">
                <div className="w-20 h-20 bg-primary-container/5 text-primary-container rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary-container group-hover:text-white transition-all duration-300 shadow-sm">
                  <span className="material-symbols-outlined text-4xl">groups</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-4 font-semibold">Professional Networking</h3>
                <p className="text-on-surface-variant text-body-md leading-relaxed">
                  A verified professional space for students and alumni to connect and mentor within their community.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-10 bg-white rounded-lg border border-outline-variant/20 hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-300 group">
                <div className="w-20 h-20 bg-primary-container/5 text-primary-container rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary-container group-hover:text-white transition-all duration-300 shadow-sm">
                  <span className="material-symbols-outlined text-4xl">analytics</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-4 font-semibold">Resume Analysis</h3>
                <p className="text-on-surface-variant text-body-md leading-relaxed">
                  Deep-learning analysis of resumes against job descriptions to ensure maximum ATS compatibility.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-10 bg-white rounded-lg border border-outline-variant/20 hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-300 group">
                <div className="w-20 h-20 bg-primary-container/5 text-primary-container rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary-container group-hover:text-white transition-all duration-300 shadow-sm">
                  <span className="material-symbols-outlined text-4xl">record_voice_over</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-4 font-semibold">Interview Preparation</h3>
                <p className="text-on-surface-variant text-body-md leading-relaxed">
                  Interactive AI sessions that simulate real interviews with instant feedback on performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-section-gap bg-surface-container-lowest">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <h2 className="font-display text-[40px] leading-[48px] text-primary mb-32 text-center font-bold">How It Works</h2>
            
            <div className="relative">
              <div className="hidden md:block absolute top-14 left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-outline-variant/40"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-20 md:gap-16">
                <div className="relative text-center flex flex-col items-center z-10 px-6">
                  <div className="w-28 h-28 bg-primary-container text-white rounded-full flex items-center justify-center font-bold text-4xl mb-12 shadow-[0_12px_40px_rgba(2,54,41,0.25)] border-8 border-white">1</div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-5 font-semibold">Create Your Profile</h3>
                  <p className="text-on-surface-variant text-body-md leading-relaxed max-w-xs">
                    Build a comprehensive digital identity that showcases your skills, projects, and verified achievements.
                  </p>
                </div>
                
                <div className="relative text-center flex flex-col items-center z-10 px-6">
                  <div className="w-28 h-28 bg-primary-container text-white rounded-full flex items-center justify-center font-bold text-4xl mb-12 shadow-[0_12px_40px_rgba(2,54,41,0.25)] border-8 border-white">2</div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-5 font-semibold">Discover Opportunities</h3>
                  <p className="text-on-surface-variant text-body-md leading-relaxed max-w-xs">
                    Our AI matchmaker identifies roles that perfectly align with your current skills and career aspirations.
                  </p>
                </div>
                
                <div className="relative text-center flex flex-col items-center z-10 px-6">
                  <div className="w-28 h-28 bg-primary-container text-white rounded-full flex items-center justify-center font-bold text-4xl mb-12 shadow-[0_12px_40px_rgba(2,54,41,0.25)] border-8 border-white">3</div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-5 font-semibold">Build Your Career</h3>
                  <p className="text-on-surface-variant text-body-md leading-relaxed max-w-xs">
                    Engage directly with verified employers and land the role that starts your journey to professional success.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ecosystem Section */}
        <section id="ecosystem" className="py-section-gap">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center mb-24">
            <h2 className="font-display text-[40px] leading-[48px] text-primary mb-6 font-bold">Built for Every User</h2>
            <p className="text-on-surface-variant text-body-lg">Empowering the three pillars of the recruitment ecosystem.</p>
          </div>
          
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Students Card */}
              <div className="bg-white rounded-lg overflow-hidden border border-outline-variant/30 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full hover:translate-y-[-4px]">
                <div 
                  className="h-80 bg-cover bg-center" 
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCec34AsqiIjXf3Qjw333dHUPzUaaniAzgobQzvknYiF1OeCs8LHWw0E-4U1IrkjrsUD_NV_uyCkE1M6p7-jcop7c36QGLPtCHM7GOO3aP3B7fDnig2k3y-KAtsmmL4U0C72K6URC2fG-mWDCtJmloirzZZbQSIw32X3sgB0U45dJ2D7d9zpZDISDimCsefLxHixt7O5gr0Zo8C9dVzdipJIVEIPPqCxtTy9EGVoZpGAI3OdxsJeRL-0OkZ6nCy8FT6PHsOB0jQcHk')" }}
                ></div>
                <div className="p-12 flex-1 flex flex-col">
                  <h3 className="text-primary font-headline-lg text-headline-lg mb-6 font-semibold">Students</h3>
                  <p className="text-on-surface-variant text-body-md mb-10 flex-1 leading-relaxed">
                    Take control of your future with AI-driven coaching, verified skills, and direct access to top-tier internship and job opportunities.
                  </p>
                  <button 
                    onClick={() => navigate('/auth?role=student')}
                    className="bg-primary-container text-white font-bold px-8 py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary transition-all duration-300 w-full shadow-md active:scale-95"
                  >
                    Explore Opportunities
                  </button>
                </div>
              </div>
              
              {/* Employers Card */}
              <div className="bg-white rounded-lg overflow-hidden border border-outline-variant/30 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full hover:translate-y-[-4px]">
                <div 
                  className="h-80 bg-cover bg-center" 
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDn6qTsJgMgOQIzhhNU9_xpHmABlv6xXUIq9PSV5aYyfwWsYl1x7CTKO5FMgD581ToaXFlqHt0gIqoCgM77qAMOHzx2Od2_0IKB8Wj28nHplVEsaqCu_aPTlcSEVm65SpwF3nGWjOlQ-1V1cabnJWc9z0ROOuy1NYOCtQaaZQ7VCNbHP98lLIAg4vmPd-4fty7lCItrfuqxv2LKwFHdGXlHYK0cJbDe9n-Gn-zsPHGFiqfD8pcrUwmUDXEkOnc5mRs0OL6nbriZVHs')" }}
                ></div>
                <div className="p-12 flex-1 flex flex-col">
                  <h3 className="text-primary font-headline-lg text-headline-lg mb-6 font-semibold">Employers</h3>
                  <p className="text-on-surface-variant text-body-md mb-10 flex-1 leading-relaxed">
                    Source, filter, and hire high-potential talent with precision using our matching engine and verified skill profiles.
                  </p>
                  <button 
                    onClick={() => navigate('/auth?role=employer')}
                    className="bg-primary-container text-white font-bold px-8 py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary transition-all duration-300 w-full shadow-md active:scale-95"
                  >
                    Hire Top Talent
                  </button>
                </div>
              </div>
              
              {/* Universities Card */}
              <div id="universities" className="bg-white rounded-lg overflow-hidden border border-outline-variant/30 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full hover:translate-y-[-4px]">
                <div 
                  className="h-80 bg-cover bg-center" 
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCbMSpH6Y6JsMje9GTgQL65Ykn5vxMf9WFylKqfQbDRopKruPW11D_vxSf7lhAFdAj3vqYi8L1cfX_DGPzsoLGoyaUXO0LBPaOmqfZvUMwzyFVWSkhZWTUCrmkluTmrnsskLAeFksTz5OgG3HXMyJaM4hoEqesp-9NhuQW_SnoVwy9q0WqfXduU4B5bLmRVXN_9oR-PCOvLRaZ9JnCn1IdK_oXkcOCnAQ1h8z_6nOehpeVpVCvj3zB4N8lWNYwMw0WtWNjgA-EZ-rU')" }}
                ></div>
                <div className="p-12 flex-1 flex flex-col">
                  <h3 className="text-primary font-headline-lg text-headline-lg mb-6 font-semibold">Universities</h3>
                  <p className="text-on-surface-variant text-body-md mb-10 flex-1 leading-relaxed">
                    Enhance institutional prestige with data-driven career services that significantly improve placement rates and readiness.
                  </p>
                  <button 
                    onClick={() => navigate('/auth?role=university')}
                    className="bg-primary-container text-white font-bold px-8 py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary transition-all duration-300 w-full shadow-md active:scale-95"
                  >
                    Partner With Us
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-section-gap">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="bg-primary-container rounded-[32px] p-16 md:p-24 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[140px]"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-container rounded-full blur-[140px]"></div>
              </div>
              <div className="relative z-10">
                <h2 className="font-display text-[48px] leading-[56px] text-white mb-8 font-bold">Start Building Your Career Today</h2>
                <p className="text-primary-fixed text-body-lg mb-14 max-w-3xl mx-auto opacity-90 leading-relaxed text-on-primary-container">
                  Join CareerBridge and experience a smarter way to connect students, universities and employers through one intelligent platform.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <button 
                    onClick={() => navigate('/role-selection')}
                    className="bg-white text-primary-container font-extrabold px-12 py-5 rounded-lg hover:translate-y-[-4px] transition-all duration-300 shadow-xl active:scale-95"
                  >
                    Start Your Journey
                  </button>
                  <Link 
                    to="/#features"
                    onClick={() => handleNav('#features')}
                    className="bg-white/10 text-white font-bold px-12 py-5 rounded-lg border border-white/30 hover:bg-white/20 transition-all duration-300 active:scale-95 flex items-center justify-center cursor-pointer"
                  >
                    Explore Platform
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="footer-contact" className="bg-surface border-t border-outline-variant/30 mt-auto">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-20">
            <div className="lg:col-span-2 space-y-8">
              <Link 
                to="/#"
                onClick={() => {
                  navigate('/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="font-display text-headline-md font-bold text-primary flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-primary text-2xl font-bold">polyline</span>
                CareerBridge
              </Link>
              <p className="text-on-surface-variant text-body-md max-w-sm leading-relaxed">
                Connecting the next generation of talent with global industry leaders through AI-powered career intelligence.
              </p>
              
              <div className="flex gap-4">
                <a 
                  className="w-11 h-11 rounded-full border border-outline-variant/40 flex items-center justify-center text-primary-container hover:bg-primary-container hover:text-white transition-all duration-300 shadow-sm" 
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img alt="LinkedIn" className="w-5 h-5 opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDK6vQd69ZJFYP4aNdy3p3pZJXheepLLt--AG8NEMHHiaRx57ntuspv0W6orPMcs8jHULJIOByD3-GJCfg7cM5zPHHlouB_BRaN-KApnuuOXM8oGsTX9QPIw9beLZXUGr3fSZaRV-duAzU8YLVjqLgS0VDL0atJq67uOW9kDjJg9lq3TvBAg9Rabg0uPfIjjqMNg1-zM8oyKvYytUq4dI11T9oNGpaRyNUu2R5SmSY0X1-Ig6W8MY8rXDFEBaOX_NJ0Gc6aQZJmNBU" />
                </a>
                <a 
                  className="w-11 h-11 rounded-full border border-outline-variant/40 flex items-center justify-center text-primary-container hover:bg-primary-container hover:text-white transition-all duration-300 shadow-sm" 
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img alt="X" className="w-4 h-4 opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLnbP1gABbKpCL_pZf4U0Try1hxuG0EzVDp8Pkkk40ol42XmsDsOQe_mp2Z_AjY8EWJAS2dNA-T0YvG0_erNOF6sgUA4JTCEg6ZJxLpf8nT2K_gAa5XjEmkf0B3EqYH-RVpvT5gktAR6xOUZ98nEl6EVBsxfxUNkcRx8S32CZHF4Y6vqBdJ6Nh-bYWSfHiOWDMOsbDNuya3z0lOw6JS2R8132_De78dOA0C7mZj4GgIhLe6RrX7sAlx97SmvPt00pZyUHZ6pUfQtA" />
                </a>
                <a 
                  className="w-11 h-11 rounded-full border border-outline-variant/40 flex items-center justify-center text-primary-container hover:bg-primary-container hover:text-white transition-all duration-300 shadow-sm" 
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img alt="GitHub" className="w-5 h-5 opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDklyNqJv-3216koLEHlYh_kjDAPfGx9RWZ7HWEQXMA58erw5QEk3UYEGHbpGFMeTgii2uVJvljv6qBxRuknrIHZSuik-DpYMM_edWd1janzJcZl5Qtaa8m43tRkk0AYtaezyZfavTxNtAIp-2N8LQn0AYiEDumN0sRaLs7CXYQ--DHX7qBiGvD4jXEx_bGp985FzH8L1wV9JnmoQX08lhZGK_npFQJQnAWDFORnQ6TrnOjbzXdMbzFz-_aLJkw3TZtXR9fy4u3aXw" />
                </a>
              </div>
            </div>
            
            <div>
              <h5 className="text-primary font-extrabold mb-8 uppercase tracking-widest text-xs">Platform</h5>
              <ul className="space-y-5">
                <li><Link className="text-on-surface-variant hover:text-primary-container transition-all duration-300 text-sm font-medium" to="/#features" onClick={() => handleNav('#features')}>AI Career Coach</Link></li>
                <li><Link className="text-on-surface-variant hover:text-primary-container transition-all duration-300 text-sm font-medium" to="/role-selection">Resume Builder</Link></li>
                <li><Link className="text-on-surface-variant hover:text-primary-container transition-all duration-300 text-sm font-medium" to="/role-selection">Mock Interviews</Link></li>
                <li><Link className="text-on-surface-variant hover:text-primary-container transition-all duration-300 text-sm font-medium" to="/role-selection">Skill Assessment</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-primary font-extrabold mb-8 uppercase tracking-widest text-xs">Resources</h5>
              <ul className="space-y-5">
                <li><Link className="text-on-surface-variant hover:text-primary-container transition-all duration-300 text-sm font-medium" to="/role-selection">Success Stories</Link></li>
                <li><Link className="text-on-surface-variant hover:text-primary-container transition-all duration-300 text-sm font-medium" to="/role-selection">Career Blog</Link></li>
                <li><Link className="text-on-surface-variant hover:text-primary-container transition-all duration-300 text-sm font-medium" to="/role-selection">Documentation</Link></li>
                <li><Link className="text-on-surface-variant hover:text-primary-container transition-all duration-300 text-sm font-medium" to="/#footer-contact" onClick={() => handleNav('#footer-contact')}>Support Center</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-primary font-extrabold mb-8 uppercase tracking-widest text-xs">Subscribe</h5>
              <p className="text-on-surface-variant text-[13px] mb-6 leading-relaxed">Weekly career insights delivered to your inbox.</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
                <input 
                  className="bg-white border border-outline-variant/30 rounded-lg px-4 py-3 focus:border-primary-container focus:ring-0 text-sm shadow-sm" 
                  placeholder="Email address" 
                  type="email"
                />
                <button className="bg-primary-container text-white font-bold py-3 rounded-lg hover:opacity-95 transition-all duration-300 text-sm shadow-md">Subscribe</button>
              </form>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-outline-variant/30 text-on-surface-variant text-[12px] font-medium">
            <p>&copy; 2026 CareerBridge AI. All rights reserved.</p>
            <div className="flex gap-10">
              <Link className="hover:text-primary-container transition-all duration-300" to="/legal/terms">Terms of Service</Link>
              <Link className="hover:text-primary-container transition-all duration-300" to="/legal/privacy">Privacy Policy</Link>
              <a 
                className="hover:text-primary-container transition-all duration-300 cursor-pointer" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('#footer-contact');
                }}
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
