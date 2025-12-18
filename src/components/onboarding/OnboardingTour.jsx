import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';

const roleBasedTours = {
  CompanyAdmin: [
    {
      target: '[data-tour="sidebar-users"]',
      title: 'Manage Users',
      content: 'Add, suspend, and manage user roles from the Users page. This is where you control who has access to your system.',
      placement: 'right'
    },
    {
      target: '[data-tour="sidebar-jobs"]',
      title: 'View All Jobs',
      content: 'Monitor all jobs across your company. Track progress, update statuses, and oversee the entire workflow.',
      placement: 'right'
    },
    {
      target: '[data-tour="sidebar-fires"]',
      title: 'Fire Alerts',
      content: 'Review incoming fire alerts, convert them to leads, and assign them to your sales team for quick response.',
      placement: 'right'
    },
    {
      target: '[data-tour="new-job"]',
      title: 'Create New Jobs',
      content: 'Start new restoration jobs here. Fill in property details, assign team members, and begin tracking progress.',
      placement: 'bottom'
    }
  ],
  SalesRep: [
    {
      target: '[data-tour="sidebar-fires"]',
      title: 'Fire Alerts',
      content: 'Your main dashboard for new opportunities. Review alerts, schedule visits, and convert promising leads into jobs.',
      placement: 'right'
    },
    {
      target: '[data-tour="sidebar-jobs"]',
      title: 'Your Jobs',
      content: 'Track your active jobs, update homeowners, and move cases through the restoration process.',
      placement: 'right'
    },
    {
      target: '[data-tour="new-job"]',
      title: 'Create Jobs',
      content: 'Convert fire alerts or create new jobs directly. Capture all property and homeowner information here.',
      placement: 'bottom'
    }
  ],
  Homeowner: [
    {
      target: '[data-tour="sidebar-jobs"]',
      title: 'Your Jobs',
      content: 'View your restoration job details, timeline, and updates. Everything about your property restoration is here.',
      placement: 'right'
    },
    {
      target: '[data-tour="job-timeline"]',
      title: 'Job Timeline',
      content: 'Follow your job progress through each step. You\'ll see updates, photos, and important milestones.',
      placement: 'bottom'
    }
  ],
  default: [
    {
      target: '[data-tour="sidebar-jobs"]',
      title: 'Jobs Dashboard',
      content: 'View and manage jobs relevant to your role. Click on any job to see detailed information.',
      placement: 'right'
    }
  ]
};

export default function OnboardingTour({ user, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const tour = roleBasedTours[user?.business_role] || roleBasedTours.default;
  const step = tour[currentStep];

  useEffect(() => {
    // Show tour after a brief delay to let page render
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!step) return;

    const targetElement = document.querySelector(step.target);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'rounded');
    }

    return () => {
      if (targetElement) {
        targetElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'rounded');
      }
    };
  }, [currentStep, step]);

  const handleNext = () => {
    if (currentStep < tour.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await base44.auth.updateMe({ 
        onboarding_completed: true,
        onboarding_step: tour.length 
      });
      setIsVisible(false);
      setTimeout(onComplete, 300);
    } catch (error) {
      console.error('Failed to update onboarding status:', error);
      onComplete();
    }
  };

  const handleSkip = async () => {
    try {
      await base44.auth.updateMe({ 
        onboarding_completed: true,
        onboarding_step: 0 
      });
      setIsVisible(false);
      setTimeout(onSkip, 300);
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      onSkip();
    }
  };

  if (!step) return null;

  const targetElement = document.querySelector(step.target);
  if (!targetElement) return null;

  const rect = targetElement.getBoundingClientRect();
  
  let tooltipStyle = {};
  switch (step.placement) {
    case 'right':
      tooltipStyle = { top: rect.top, left: rect.right + 20 };
      break;
    case 'left':
      tooltipStyle = { top: rect.top, right: window.innerWidth - rect.left + 20 };
      break;
    case 'bottom':
      tooltipStyle = { top: rect.bottom + 20, left: rect.left };
      break;
    case 'top':
      tooltipStyle = { bottom: window.innerHeight - rect.top + 20, left: rect.left };
      break;
    default:
      tooltipStyle = { top: rect.bottom + 20, left: rect.left };
  }

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={handleSkip}
          />
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={tooltipStyle}
            className="fixed z-[101] w-80"
          >
            <Card className="shadow-2xl border-2 border-blue-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 mb-1">
                      Step {currentStep + 1} of {tour.length}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-sm text-slate-600 mb-4">{step.content}</p>

                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-slate-500"
                  >
                    Skip Tour
                  </Button>

                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBack}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {currentStep === tour.length - 1 ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Finish
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                  {tour.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentStep
                          ? 'w-8 bg-blue-600'
                          : idx < currentStep
                          ? 'w-1.5 bg-blue-400'
                          : 'w-1.5 bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}