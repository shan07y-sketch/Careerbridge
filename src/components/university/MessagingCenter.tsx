import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';

interface Conversation {
  id: string;
  name: string;
  role: string;
  companyOrDept: string;
  avatarLetter: string;
  avatarColor: string;
  lastMessage: string;
  timeStr: string;
  unreadCount: number;
  online: boolean;
  responsiveness: string;
  totalHires: number;
  avgResponse: string;
}

interface Message {
  id: string;
  sender: 'me' | 'them';
  content: string;
  time: string;
  file?: {
    name: string;
    size: string;
    type: string;
  };
}

export const MessagingCenter: React.FC = () => {
  const { showToast } = useToast();

  // Mock database of conversations
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      name: 'Sarah Jenkins',
      role: 'Senior Recruiter',
      companyOrDept: 'Google',
      avatarLetter: 'SJ',
      avatarColor: 'bg-blue-600 text-white',
      lastMessage: 'The interview shortlist for the upcoming summer internship...',
      timeStr: '10:42 AM',
      unreadCount: 0,
      online: true,
      responsiveness: '82%',
      totalHires: 14,
      avgResponse: '2.4h'
    },
    {
      id: '2',
      name: 'Ankit Verma',
      role: 'Student',
      companyOrDept: 'Computer Science',
      avatarLetter: 'AV',
      avatarColor: 'bg-primary/10 text-primary',
      lastMessage: 'Thank you for the guidance on the resume review.',
      timeStr: 'Yesterday',
      unreadCount: 2,
      online: false,
      responsiveness: '95%',
      totalHires: 0,
      avgResponse: '1.2h'
    },
    {
      id: '3',
      name: 'Dr. Robert Miller',
      role: 'Faculty',
      companyOrDept: 'Dept. Head',
      avatarLetter: 'RM',
      avatarColor: 'bg-secondary-container text-on-secondary-container',
      lastMessage: 'Approval for the placement seminar schedule.',
      timeStr: 'Oct 24',
      unreadCount: 0,
      online: true,
      responsiveness: '90%',
      totalHires: 0,
      avgResponse: '3.1h'
    },
    {
      id: '4',
      name: 'Priya Sharma',
      role: 'HR Director',
      companyOrDept: 'Microsoft',
      avatarLetter: 'PS',
      avatarColor: 'bg-primary-fixed text-primary',
      lastMessage: "We'd like to extend 5 offer letters to the selected candidates.",
      timeStr: 'Oct 23',
      unreadCount: 0,
      online: false,
      responsiveness: '88%',
      totalHires: 22,
      avgResponse: '1.8h'
    }
  ]);

  const [activeConvId, setActiveConvId] = useState('1');
  const [filterTab, setFilterTab] = useState<'all' | 'students' | 'recruiters' | 'faculty'>('all');
  
  // Input message draft
  const [msgDraft, setMsgDraft] = useState('');

  // Messages database indexed by conversation ID
  const [conversationsMessages, setConversationsMessages] = useState<Record<string, Message[]>>({
    '1': [
      {
        id: '101',
        sender: 'them',
        content: "Hello Team, I've just reviewed the portfolios for the UX Design candidates. I'm quite impressed with the depth of work from the CareerBridge students.",
        time: '10:40 AM'
      },
      {
        id: '102',
        sender: 'them',
        content: 'Attached is the shortlist for the first round of technical interviews. Can we schedule these for next Tuesday?',
        time: '10:41 AM',
        file: {
          name: 'Shortlisted_Candidates_UX_2024.pdf',
          size: '2.4 MB',
          type: 'PDF Document'
        }
      },
      {
        id: '103',
        sender: 'me',
        content: 'Thank you, Sarah. That\'s great to hear! I\'ve shared the file with the respective department heads for scheduling. We will confirm the slots by EOD today.',
        time: '10:45 AM'
      }
    ],
    '2': [
      {
        id: '201',
        sender: 'them',
        content: 'Good afternoon, Director. I have updated my resume with the Google Cloud practitioner certification details.',
        time: 'Yesterday'
      },
      {
        id: '202',
        sender: 'me',
        content: 'Excellent, Ankit. I will review it shortly. Keep the profile format standard.',
        time: 'Yesterday'
      },
      {
        id: '203',
        sender: 'them',
        content: 'Thank you for the guidance on the resume review.',
        time: 'Yesterday'
      }
    ],
    '3': [
      {
        id: '301',
        sender: 'them',
        content: 'Sent the approval sheet for the slot requests. Please review the company guest list.',
        time: 'Oct 24'
      }
    ],
    '4': [
      {
        id: '401',
        sender: 'them',
        content: 'The recruitment numbers for this batch look promising.',
        time: 'Oct 23'
      }
    ]
  });

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];
  const activeMessages = conversationsMessages[activeConvId] || [];

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat area when messages load or change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSendMessage = () => {
    if (!msgDraft.trim()) return;

    const newMsg: Message = {
      id: String(Date.now()),
      sender: 'me',
      content: msgDraft,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversationsMessages(prev => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMsg]
    }));

    // Update last message in conversation list
    setConversations(prev => 
      prev.map(c => c.id === activeConvId ? { ...c, lastMessage: msgDraft, timeStr: 'Just now' } : c)
    );

    setMsgDraft('');
    showToast('Message sent.', 'success');
  };

  const handleAIRewrite = () => {
    if (!msgDraft.trim()) {
      showToast('Please type a draft message first to rewrite.', 'info');
      return;
    }
    // Simulate AI formal rewrite
    const formalRewrite = `Dear ${activeConv.name},\n\nThank you for reaching out. We have successfully processed your query and will update you with the finalized schedules shortly. Please let us know if any further changes are required.\n\nBest regards,\nDirector of Placements`;
    setMsgDraft(formalRewrite);
    showToast('AI formal rewrite applied successfully.', 'success');
  };

  const handleSuggestedReply = (reply: string) => {
    setMsgDraft(reply);
    showToast('Suggested reply loaded.', 'info');
  };

  const handleConfirmSlots = () => {
    showToast('Interview slot schedule confirmed and notifications broadcasted to candidates!', 'success');
  };

  const handleModifySlots = () => {
    showToast('Opening proposed schedule calendar editor...', 'info');
  };

  const filteredConversations = conversations.filter(c => {
    if (filterTab === 'students') return c.role.toLowerCase() === 'student';
    if (filterTab === 'recruiters') return c.role.toLowerCase().includes('recruiter') || c.role.toLowerCase().includes('hr');
    if (filterTab === 'faculty') return c.role.toLowerCase() === 'faculty';
    return true;
  });

  return (
    <div className="w-full text-left flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Messaging Center</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Communicate with students, recruiters, companies, faculty coordinators, and placement teams from one centralized workspace.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs font-semibold shrink-0">
          <button 
            onClick={() => showToast('Analyzing conversation insights logs...', 'success')}
            className="flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg font-bold hover:bg-secondary-fixed transition-colors cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            AI Summary
          </button>
          
          <button 
            onClick={() => showToast('Opening conversation wizard...', 'info')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-opacity cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Conversation
          </button>
        </div>
      </div>

      {/* Header Quick Actions */}
      <div className="flex gap-2 overflow-x-auto pb-4 text-xs font-semibold">
        <button 
          onClick={() => showToast('Drafting announcement broadcast...', 'info')}
          className="whitespace-nowrap px-4 py-2 bg-white border border-primary/10 rounded-full flex items-center gap-2 text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">campaign</span> Broadcast Announcement
        </button>
        <button 
          onClick={() => showToast('Opening message scheduler...', 'info')}
          className="whitespace-nowrap px-4 py-2 bg-white border border-primary/10 rounded-full flex items-center gap-2 text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">schedule</span> Schedule Message
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-stack-lg text-left">
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col gap-1">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Active Chats</span>
          <span className="text-primary text-xl font-extrabold">1,248</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col gap-1">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Unread</span>
          <span className="text-error text-xl font-extrabold">42</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col gap-1">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Broadcasts</span>
          <span className="text-primary text-xl font-extrabold">15</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col gap-1">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Company Chats</span>
          <span className="text-primary text-xl font-extrabold">184</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col gap-1">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Student Chats</span>
          <span className="text-primary text-xl font-extrabold">942</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col gap-1">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Faculty Chats</span>
          <span className="text-primary text-xl font-extrabold">76</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col gap-1">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">AI Assisted</span>
          <span className="text-primary text-xl font-extrabold">312</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex flex-col gap-1">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Messages Today</span>
          <span className="text-primary text-xl font-extrabold">4.2k</span>
        </div>
      </div>

      {/* Workspace Area */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[600px] h-[750px]">
        {/* Left Column: Conversation List */}
        <div className="w-full lg:w-80 flex flex-col bg-white rounded-2xl border border-primary/5 shadow-sm overflow-hidden shrink-0">
          <div className="p-4 border-b border-primary/5 shrink-0 text-left">
            <div className="flex items-center justify-between mb-4 text-xs font-bold">
              <h3 className="text-primary text-base">Conversations</h3>
              <button 
                onClick={() => showToast('Conversation sorting settings opened.', 'info')}
                className="p-1 hover:bg-surface-container-low rounded-md cursor-pointer bg-transparent border-none"
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">filter_list</span>
              </button>
            </div>
            
            <div className="flex gap-1.5 text-[10px] font-bold overflow-x-auto pb-1">
              <span 
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${filterTab === 'all' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-secondary-container/40'}`}
              >
                All
              </span>
              <span 
                onClick={() => setFilterTab('students')}
                className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${filterTab === 'students' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-secondary-container/40'}`}
              >
                Students
              </span>
              <span 
                onClick={() => setFilterTab('recruiters')}
                className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${filterTab === 'recruiters' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-secondary-container/40'}`}
              >
                Recruiters
              </span>
              <span 
                onClick={() => setFilterTab('faculty')}
                className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${filterTab === 'faculty' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-secondary-container/40'}`}
              >
                Faculty
              </span>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar divide-y divide-primary/5">
            {filteredConversations.map((c) => (
              <div 
                key={c.id} 
                onClick={() => {
                  setActiveConvId(c.id);
                  // Clear unread badge locally for demonstration
                  setConversations(prev => prev.map(item => item.id === c.id ? { ...item, unreadCount: 0 } : item));
                }}
                className={`p-4 cursor-pointer transition-colors text-left flex gap-3 ${
                  c.id === activeConvId 
                    ? 'bg-surface-container-low border-l-4 border-l-primary' 
                    : 'hover:bg-surface-container-low/30'
                }`}
              >
                <div className="relative shrink-0 font-bold">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm ${c.avatarColor}`}>
                    {c.avatarLetter}
                  </div>
                  {c.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-grow min-w-0 font-semibold text-xs text-left">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-on-surface truncate">{c.name}</h4>
                    <span className="text-[10px] text-on-surface-variant shrink-0 font-medium font-sans">{c.timeStr}</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant font-bold truncate mt-0.5">{c.role} • {c.companyOrDept}</p>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-on-surface-variant truncate font-medium text-[11px] flex-grow pr-2">{c.lastMessage}</p>
                    {c.unreadCount > 0 && (
                      <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-black font-sans shrink-0">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Chat Window */}
        <div className="flex-grow flex flex-col bg-white rounded-2xl border border-primary/5 shadow-sm overflow-hidden min-w-0">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-primary/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${activeConv.avatarColor}`}>
                {activeConv.avatarLetter}
              </div>
              <div className="text-xs font-semibold">
                <h3 className="font-bold text-primary text-sm">{activeConv.name}</h3>
                <p className="text-on-surface-variant flex items-center gap-1 text-[10px] mt-0.5 font-bold">
                  {activeConv.online ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                      <span>Online • {activeConv.role} at {activeConv.companyOrDept}</span>
                    </>
                  ) : (
                    <span>Offline • {activeConv.role} at {activeConv.companyOrDept}</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button onClick={() => showToast('Calling audio connection...', 'info')} className="p-2 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer bg-transparent border-none text-primary"><span className="material-symbols-outlined text-[20px]">call</span></button>
              <button onClick={() => showToast('Initializing videocam interface...', 'info')} className="p-2 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer bg-transparent border-none text-primary"><span className="material-symbols-outlined text-[20px]">videocam</span></button>
              <button onClick={() => showToast('Opening internal messages finder...', 'info')} className="p-2 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer bg-transparent border-none text-primary"><span className="material-symbols-outlined text-[20px]">search</span></button>
              <button onClick={() => showToast('More settings options loaded.', 'info')} className="p-2 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer bg-transparent border-none text-primary"><span className="material-symbols-outlined text-[20px]">more_vert</span></button>
            </div>
          </div>

          {/* Chat Messages list */}
          <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar bg-surface-bright/50">
            <div className="flex justify-center">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container px-3 py-1 rounded-full">Today</span>
            </div>

            {activeMessages.map((m) => (
              <div 
                key={m.id} 
                className={`flex gap-3 max-w-[85%] ${m.sender === 'me' ? 'ml-auto flex-col items-end' : 'text-left items-end'}`}
              >
                {m.sender === 'them' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${activeConv.avatarColor}`}>
                    {activeConv.avatarLetter}
                  </div>
                )}
                
                <div className="flex flex-col gap-1">
                  {m.file && (
                    <div className="bg-white border border-primary/5 p-3 rounded-xl flex items-center gap-4 shadow-sm group hover:border-primary/20 transition-all text-xs font-semibold mb-1 cursor-pointer">
                      <div className="w-10 h-10 bg-red-50 text-red-600 rounded flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[28px]">description</span>
                      </div>
                      <div className="flex-grow text-left">
                        <p className="font-bold text-on-surface text-xs leading-normal">{m.file.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{m.file.size} • {m.file.type}</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`Downloading file ${m.file?.name}...`, 'success');
                        }}
                        className="p-1.5 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer bg-transparent border-none flex"
                      >
                        <span className="material-symbols-outlined text-[20px] text-on-surface-variant">download</span>
                      </button>
                    </div>
                  )}

                  <div className={`p-4 text-xs font-semibold ${
                    m.sender === 'me' 
                      ? 'bg-primary text-white chat-bubble-sent shadow-sm text-left' 
                      : 'bg-white border border-primary/5 text-on-surface chat-bubble-received shadow-sm'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                  
                  <span className={`text-[10px] text-on-surface-variant font-medium mt-0.5 ${m.sender === 'me' ? 'mr-1' : 'ml-1'}`}>{m.time}</span>
                </div>
              </div>
            ))}

            {/* Custom Proposed Schedule Card for Google (Sarah Jenkins ID '1') */}
            {activeConvId === '1' && (
              <div className="flex justify-center py-2 text-xs font-semibold">
                <div className="bg-white border-2 border-dashed border-primary/25 rounded-2xl p-6 w-[360px] text-center shadow-md">
                  <span className="material-symbols-outlined text-primary text-[42px] mb-1">event_available</span>
                  <h4 className="font-bold text-primary text-sm">Interview Slots Proposed</h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Google Summer Internship 2024</p>
                  
                  <div className="space-y-2 my-4 text-left">
                    <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                      <span className="font-bold">Tuesday, Nov 12</span>
                      <span className="text-[10px] font-medium">10:00 AM - 01:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                      <span className="font-bold">Wednesday, Nov 13</span>
                      <span className="text-[10px] font-medium">02:00 PM - 05:00 PM</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={handleModifySlots}
                      className="flex-1 py-2 border border-primary text-primary rounded-lg font-bold hover:bg-surface-container-low transition-colors cursor-pointer bg-white"
                    >
                      Modify
                    </button>
                    <button 
                      onClick={handleConfirmSlots}
                      className="flex-grow py-2 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-opacity cursor-pointer border-none"
                    >
                      Confirm All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Composer Area */}
          <div className="p-4 border-t border-primary/5 bg-white shrink-0">
            <div className="flex flex-col gap-2 bg-surface-container-low rounded-xl p-2 border border-primary/10 text-xs font-semibold">
              <textarea 
                value={msgDraft}
                onChange={(e) => setMsgDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full bg-transparent border-none focus:ring-0 text-xs resize-none min-h-[50px] max-h-[120px] p-2 outline-none" 
                placeholder="Type your message or use @ to mention someone..." 
                rows={2}
              />
              
              <div className="flex items-center justify-between border-t border-primary/5 pt-2 px-1">
                <div className="flex items-center gap-1">
                  <button onClick={() => showToast('Choose file attachment...', 'info')} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-white rounded-lg transition-all cursor-pointer bg-transparent border-none flex"><span className="material-symbols-outlined text-base">attach_file</span></button>
                  <button onClick={() => showToast('Choose image asset...', 'info')} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-white rounded-lg transition-all cursor-pointer bg-transparent border-none flex"><span className="material-symbols-outlined text-base">image</span></button>
                  <button onClick={() => showToast('Select emoji...', 'info')} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-white rounded-lg transition-all cursor-pointer bg-transparent border-none flex"><span className="material-symbols-outlined text-base">emoji_emotions</span></button>
                  
                  <div className="h-4 w-[1px] bg-primary/10 mx-1"></div>
                  
                  <button 
                    onClick={handleAIRewrite}
                    className="flex items-center gap-1 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-lg font-bold hover:bg-secondary-fixed transition-colors border-none cursor-pointer text-[10px]"
                  >
                    <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
                    AI Rewrite
                  </button>
                </div>
                
                <button 
                  onClick={handleSendMessage}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-sm cursor-pointer border-none"
                >
                  Send
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Context Info */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 text-xs font-semibold text-left">
          {/* Recruiter Details Card */}
          <div className="bg-white rounded-2xl border border-primary/5 p-6 shadow-sm text-center">
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 border-4 border-secondary-container flex items-center justify-center font-bold text-lg ${activeConv.avatarColor}`}>
              {activeConv.avatarLetter}
            </div>
            <h3 className="font-bold text-primary text-base leading-normal">{activeConv.name}</h3>
            <p className="text-on-surface-variant font-bold text-[10px] mt-0.5">{activeConv.role} • {activeConv.companyOrDept}</p>
            
            <div className="flex justify-center gap-4 mt-6">
              <div className="flex flex-col items-center">
                <span className="font-extrabold text-primary">{activeConv.responsiveness}</span>
                <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold mt-0.5">Responsiveness</span>
              </div>
              <div className="w-[1px] bg-primary/10 h-10"></div>
              <div className="flex flex-col items-center">
                <span className="font-extrabold text-primary">{activeConv.totalHires}</span>
                <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold mt-0.5">Total Hires</span>
              </div>
              <div className="w-[1px] bg-primary/10 h-10"></div>
              <div className="flex flex-col items-center">
                <span className="font-extrabold text-primary">{activeConv.avgResponse}</span>
                <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold mt-0.5">Avg Response</span>
              </div>
            </div>
          </div>

          {/* AI Assistant Context Card */}
          <div className="bg-primary-container text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-on-primary-container/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h4 className="font-bold text-secondary-fixed uppercase tracking-wider text-[10px]">AI Assistant Panel</h4>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 mb-4 text-xs font-semibold">
                <p className="font-bold text-white mb-1.5">Conversation Summary</p>
                <p className="leading-relaxed opacity-95 text-surface-container text-[11px] font-medium">
                  {activeConvId === '1' 
                    ? 'Sarah is confirming UX design shortlist applicants and proposing interview dates for next Tuesday. Five students from your portal have been moved to the final round.'
                    : `Active dialog thread with student ${activeConv.name} regarding verification updates and recruitment profile certifications.`}
                </p>
              </div>

              {activeConvId === '1' && (
                <div className="space-y-2">
                  <p className="text-[10px] text-primary-fixed uppercase font-black tracking-wider mb-2">Suggested Replies</p>
                  <button 
                    onClick={() => handleSuggestedReply('Confirmed. Tuesday works for the team. Sending invites now.')}
                    className="w-full text-left p-3 rounded-lg border border-white/20 text-[11px] font-bold text-white hover:bg-white/10 transition-colors cursor-pointer bg-transparent"
                  >
                    "Confirmed. Tuesday works for the team. Sending invites now."
                  </button>
                  <button 
                    onClick={() => handleSuggestedReply('Can we move the slots to Wednesday? Tuesday is graduation day.')}
                    className="w-full text-left p-3 rounded-lg border border-white/20 text-[11px] font-bold text-white hover:bg-white/10 transition-colors cursor-pointer bg-transparent"
                  >
                    "Can we move the slots to Wednesday? Tuesday is graduation day."
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Shared Assets folder */}
          <div className="bg-white rounded-2xl border border-primary/5 p-6 shadow-sm flex-grow overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 text-xs font-bold shrink-0">
              <h4 className="text-primary uppercase tracking-wider">Shared Assets</h4>
              <button onClick={() => showToast('Viewing shared attachment vault...', 'info')} className="text-primary cursor-pointer bg-transparent border-none">View All</button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-1 text-center font-bold">
              <div 
                onClick={() => showToast('Opening resume preview...', 'info')}
                className="aspect-square bg-surface-container-low rounded-lg overflow-hidden relative cursor-pointer flex flex-col items-center justify-center p-3 border border-outline-variant/10 hover:border-primary transition-all"
              >
                <span className="material-symbols-outlined text-outline text-[32px]">picture_as_pdf</span>
                <span className="text-[8px] text-on-surface-variant truncate mt-2 w-full">Resume_SJ.pdf</span>
              </div>
              
              <div 
                onClick={() => showToast('Opening offer letter preview...', 'info')}
                className="aspect-square bg-surface-container-low rounded-lg overflow-hidden relative cursor-pointer flex flex-col items-center justify-center p-3 border border-outline-variant/10 hover:border-primary transition-all"
              >
                <span className="material-symbols-outlined text-outline text-[32px]">verified_user</span>
                <span className="text-[8px] text-on-surface-variant truncate mt-2 w-full">Offer_Letter.pdf</span>
              </div>

              <div 
                onClick={() => showToast('Opening event flyer preview...', 'info')}
                className="aspect-square bg-surface-container-low rounded-lg overflow-hidden relative cursor-pointer flex flex-col items-center justify-center p-3 border border-outline-variant/10 hover:border-primary transition-all"
              >
                <span className="material-symbols-outlined text-outline text-[32px]">campaign</span>
                <span className="text-[8px] text-on-surface-variant truncate mt-2 w-full">Drive_Flyer.png</span>
              </div>

              <div 
                onClick={() => showToast('Opening schedule grid preview...', 'info')}
                className="aspect-square bg-surface-container-low rounded-lg overflow-hidden relative cursor-pointer flex flex-col items-center justify-center p-3 border border-outline-variant/10 hover:border-primary transition-all"
              >
                <span className="material-symbols-outlined text-outline text-[32px]">calendar_month</span>
                <span className="text-[8px] text-on-surface-variant truncate mt-2 w-full">Slots_Grid.xlsx</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingCenter;
