import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';

export default function ContextualHelp({ tipId, title, content, placement = 'bottom', show = true }) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Check if this tip was previously dismissed
        if (currentUser.help_tips_dismissed?.includes(tipId)) {
          setIsDismissed(true);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, [tipId]);

  const handleDismiss = async () => {
    setIsDismissed(true);
    
    try {
      const dismissedTips = user?.help_tips_dismissed || [];
      if (!dismissedTips.includes(tipId)) {
        await base44.auth.updateMe({
          help_tips_dismissed: [...dismissedTips, tipId]
        });
      }
    } catch (error) {
      console.error('Failed to save dismissed tip:', error);
    }
  };

  if (!show || isDismissed || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="relative"
      >
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {title && <h4 className="font-semibold text-blue-900 mb-1">{title}</h4>}
                <p className="text-sm text-blue-800">{content}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}