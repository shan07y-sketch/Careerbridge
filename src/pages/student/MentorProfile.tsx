import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Mentor } from '../../types';
import { NetworkService } from '../../services';
import { useToast } from '../../contexts/ToastContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

export const MentorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    const loadMentor = async () => {
      if (!id) return;
      try {
        const items = await NetworkService.getMentors();
        const found = items.find((m: Mentor) => m.id === id);
        if (found) setMentor(found);
      } catch (err) {
        console.error('Failed to load mentor profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMentor();
  }, [id]);

  const handleBook = () => {
    if (!selectedSlot) {
      showToast('Please select a booking slot first', 'error');
      return;
    }
    showToast(`Session successfully booked for ${selectedSlot}!`, 'success');
    navigate('/student/dashboard');
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="space-y-6 text-left">
          <Skeleton variant="rect" height={150} />
          <Skeleton variant="rect" height={200} />
        </div>
      </PageLayout>
    );
  }

  if (!mentor) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-primary">Mentor profile not found</h2>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/student/network')}>
            Back to Network
          </Button>
        </div>
      </PageLayout>
    );
  }

  const mockSlots = [
    'Tuesday, Oct 14 at 2:00 PM',
    'Tuesday, Oct 14 at 4:30 PM',
    'Thursday, Oct 16 at 10:00 AM',
    'Thursday, Oct 16 at 1:30 PM'
  ];

  return (
    <PageLayout>
      <div className="space-y-6 text-left">
        {/* Profile Card */}
        <section className="bg-white dark:bg-surface-container-lowest rounded-2xl p-8 border border-primary/5 shadow-sm flex flex-col md:flex-row gap-6 items-center">
          <img 
            className="w-24 h-24 rounded-full object-cover border-2 border-primary-fixed shrink-0" 
            alt={mentor.name} 
            src={mentor.avatar} 
          />
          <div className="flex-grow text-center md:text-left space-y-2">
            <h1 className="font-display text-headline-lg text-primary dark:text-primary-fixed leading-tight">{mentor.name}</h1>
            <p className="text-on-surface-variant font-label-md">
              {mentor.role} at <span className="font-bold text-primary dark:text-primary-fixed">{mentor.companyName}</span>
            </p>
            <div className="flex items-center justify-center md:justify-start gap-1 text-xs text-on-surface-variant/70">
              <span className="material-symbols-outlined text-[16px] fill-1 text-primary">star</span>
              <span className="font-bold text-primary">{mentor.rating}</span>
              <span>({mentor.reviewsCount} reviews)</span>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/student/messages')}
            leftIcon={<span className="material-symbols-outlined">chat</span>}
          >
            Chat Mentor
          </Button>
        </section>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Details */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="space-y-4">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed">Biography</h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {mentor.bio}
              </p>
            </Card>

            <Card className="space-y-4">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed">Expertise Areas</h3>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.map((exp) => (
                  <span 
                    key={exp}
                    className="bg-secondary-container/40 dark:bg-primary-container/20 text-primary dark:text-primary-fixed px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Calendar Selector */}
          <div className="lg:col-span-5">
            <Card className="space-y-6">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed">Book 1:1 Advising Session</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Select an available slot below to confirm a 30-minute career development roundtable.
              </p>

              {/* Slot buttons */}
              <div className="space-y-3">
                {mockSlots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full text-left p-4 rounded-xl border text-xs font-bold transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-outline-variant/10 bg-surface dark:bg-surface-container hover:border-primary text-on-surface-variant'
                      }`}
                      type="button"
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              <Button 
                className="w-full py-3" 
                onClick={handleBook}
                disabled={!selectedSlot}
              >
                Confirm Appointment
              </Button>
            </Card>
          </div>
        </div>
      </div>
      <div className="h-10"></div>
    </PageLayout>
  );
};
export default MentorProfile;
