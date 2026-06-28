import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';

export const EventDetails: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [hasRSVPMock, setHasRSVPMock] = useState(false);

  const eventData = {
    title: 'FinTech Careers Roundtable 2026',
    organizer: 'CareerBridge & Industry Partners',
    date: 'Friday, Oct 17, 2026',
    time: '3:00 PM - 5:00 PM EST',
    location: 'Virtual Webinar (Zoom)',
    description: 'Join technical leaders from Stripe, Affirm, and Plaid to discuss current hiring cycles, resume priorities, and mock interview preparations for Full-stack developers. There will be a live Q&A session.',
    speakers: [
      { name: 'Sarah Jenkins', role: 'Staff Engineer at Stripe', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAV7PlryerdfNR62z0QXwpzts1zUPNCc8ypKunl_UVLBPGL5A3cOZ7eY3-Xc8T2pCiGCpotBlGY3xHgahQ8HLBH6GC_ZbasGSIwQ2xPZt8RRTeNG_nqqaIaL--QXlrKQS7UUB9YVn87HboklgkpReF_YRjpUoo0a15ijXC6JPw_iLW7why4mIvmnL9bL6VjSaApZc38SS3lQHq8HiojElUV3DKzp86ZBCL8M6xGMOxTuX8Wdx4US7AlzAB-FOSvJ5U5kVtCgPDCSoY' },
      { name: 'Marcus Brody', role: 'Recruitment Lead at Affirm', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCXU5xjenIEosKGfgSZWDcUlD30S-8cKlcuY1HssRTHwAYNoqQrADimgrdQqVwM3-2S5GMzbm8ZarOeUaYurvoRyov7mAYYTQuT7vwRInWhtCJKBQHi2iJXcusY5CXK0T2DruBjo0eOUyG-R9-HHi_BDvniY8zTREpLB7nTCcKZR0d7uW9HInvkx34smee3mmY97MghGtx2n5109B_9dSfIUaM4lykXqb2A759nOPJzm93AMJU0UyIZqQgWPMNzzUxzQZ7_gl2LpM' }
    ]
  };

  const handleRSVP = () => {
    setHasRSVPMock(true);
    showToast('RSVP submitted successfully! We\'ve sent a calendar invite.', 'success');
  };

  return (
    <PageLayout>
      <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider mb-4 text-left">
        <span className="cursor-pointer hover:underline" onClick={() => navigate('/student/dashboard')}>Dashboard</span>
        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
        <span className="text-primary">Event Registration</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter text-left items-start">
        {/* Main Details Panel */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-8 space-y-6">
            <div>
              <span className="px-3 py-1 bg-secondary-container text-primary text-[10px] font-bold uppercase rounded-full tracking-wider">
                Career Seminar
              </span>
              <h1 className="font-display text-headline-lg text-primary dark:text-primary-fixed mt-3">
                {eventData.title}
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">Organized by {eventData.organizer}</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-primary/5">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed">About the Event</h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {eventData.description}
              </p>
            </div>

            {/* Speakers list */}
            <div className="space-y-4 pt-6 border-t border-primary/5">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed">Featured Speakers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventData.speakers.map((speaker) => (
                  <div key={speaker.name} className="flex items-center gap-3 p-3 bg-surface-container-low dark:bg-surface-container rounded-xl">
                    <img className="w-10 h-10 rounded-full object-cover border" alt={speaker.name} src={speaker.avatar} />
                    <div>
                      <h4 className="font-bold text-xs text-primary dark:text-primary-fixed">{speaker.name}</h4>
                      <p className="text-[10px] text-on-surface-variant leading-snug">{speaker.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Side Panel Reservation details */}
        <div className="lg:col-span-4">
          <Card className="space-y-6">
            <h4 className="font-bold text-label-md text-primary uppercase tracking-wider">Schedule & RSVP</h4>
            
            <div className="space-y-3 text-xs text-on-surface-variant">
              <div className="flex gap-2.5 items-start">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5">calendar_today</span>
                <div>
                  <span className="font-bold text-primary block">Date</span>
                  <span>{eventData.date}</span>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5">schedule</span>
                <div>
                  <span className="font-bold text-primary block">Time</span>
                  <span>{eventData.time}</span>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5">location_on</span>
                <div>
                  <span className="font-bold text-primary block">Location</span>
                  <span>{eventData.location}</span>
                </div>
              </div>
            </div>

            <Button
              className="w-full py-3"
              onClick={handleRSVP}
              disabled={hasRSVPMock}
            >
              {hasRSVPMock ? 'RSVP Confirmed' : 'Register for Event'}
            </Button>
          </Card>
        </div>
      </div>
      <div className="h-10"></div>
    </PageLayout>
  );
};
export default EventDetails;
