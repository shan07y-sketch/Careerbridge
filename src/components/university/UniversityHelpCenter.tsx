import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { UniversityService } from '../../services';

const FAQ_SECTIONS: { question: string; answer: string }[] = [
  {
    question: 'How do I verify a student for placement?',
    answer: 'Go to Students, find the student in the registry, and change their Verification Status using the dropdown in the table. Status changes are audit-logged and take effect immediately.'
  },
  {
    question: 'How do I schedule a campus placement drive?',
    answer: 'Go to Campus Drives and click "Create Campus Drive". Fill in the title, location, description, drive date/time, and registration deadline, then publish. It appears immediately on the university dashboard and to eligible students.'
  },
  {
    question: 'How is the Placement Rate on my dashboard calculated?',
    answer: 'Placement Rate = (students with verification status "Placed" / total students at your university) x 100, computed live from your student registry -- it is not a fixed or estimated number.'
  },
  {
    question: 'Where do the companies on the Companies page come from?',
    answer: 'The Companies page lists every company that has actually received an application from one of your students, with real application, hire, and open-role counts. There is no manual partner list to maintain.'
  },
  {
    question: 'How do I message students?',
    answer: 'Use the Messaging Center to select recipients (by department or individually) and send an announcement. Each recipient receives a real notification in their account.'
  },
  {
    question: 'How do I generate a placement report?',
    answer: 'Go to Reports and click "Generate & Download Report". This downloads three CSV files built from your live analytics: a summary, a department breakdown, and year-over-year hiring trends.'
  }
];

export const UniversityHelpCenter: React.FC = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const filteredFaqs = FAQ_SECTIONS.filter(
    f => f.question.toLowerCase().includes(searchTerm.toLowerCase()) || f.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!subject.trim() || message.trim().length < 10) {
      showToast('Please provide a subject and at least 10 characters describing the issue.', 'info');
      return;
    }
    setIsSubmitting(true);
    try {
      await UniversityService.submitSupportRequest(subject.trim(), message.trim());
      setSubmitted(true);
      setSubject('');
      setMessage('');
      showToast('Support request submitted.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit support request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full text-left">
      <div className="mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Help Center</h1>
        <p className="font-body-md text-on-surface-variant text-sm mt-1">
          Guidance on using the University Portal, and a direct line to support.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary/5">
            <div className="relative text-xs mb-4">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface rounded-xl border border-outline/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold"
                placeholder="Search help articles..."
                type="text"
                aria-label="Search help articles"
              />
            </div>

            {filteredFaqs.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic">No help articles match your search.</p>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map(faq => (
                  <details key={faq.question} className="border border-outline-variant/20 rounded-xl p-4 group">
                    <summary className="font-bold text-primary text-xs cursor-pointer list-none flex justify-between items-center">
                      {faq.question}
                      <span className="material-symbols-outlined text-outline group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <p className="text-[11px] text-on-surface-variant font-medium mt-3 leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary/5">
            <h3 className="font-bold text-primary text-sm uppercase tracking-wider mb-4">Contact Support</h3>
            {submitted ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-primary text-4xl mb-2">check_circle</span>
                <p className="text-xs font-bold text-primary">Request submitted</p>
                <p className="text-[11px] text-on-surface-variant mt-1">Our team will follow up by email.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-primary text-xs font-bold hover:underline cursor-pointer bg-transparent border-none"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full px-4 py-2.5 bg-surface rounded-lg border border-outline/10 outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold"
                  aria-label="Support subject"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={5}
                  className="w-full px-4 py-3 bg-surface rounded-lg border border-outline/10 outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold resize-none"
                  aria-label="Support message"
                />
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full px-5 py-2.5 bg-primary text-on-primary rounded-lg font-bold cursor-pointer border-none disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <span className="w-4 h-4 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin" />}
                  Submit Request
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityHelpCenter;
