import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FAQScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'What is Bisafit?',
    answer:
      'Bisafit is a fitness and nutrition app designed to fit around your real life. It creates workouts and meal plans based on your goals, schedule, preferences, and available resources.',
  },
  {
    question: 'How are workouts decided?',
    answer:
      'Your workouts are planned based on your goals, experience level, availability, and rest days. When a workout is scheduled, it appears automatically.',
  },
  {
    question: 'What if I miss a workout?',
    answer:
      'If you miss a workout, Bisafit will let you start it later, skip it, or reschedule it for another date and time.',
  },
  {
    question: 'Do I need gym equipment?',
    answer:
      'No. Bisafit can create workouts using your available equipment or just your body weight. You can update your equipment anytime in Settings.',
  },
  {
    question: 'How does meal planning work?',
    answer:
      'Meals are planned based on your preferences and available ingredients. You can adjust your preferences or update what you have at any time.',
  },
  {
    question: 'Can I change my plan later?',
    answer:
      'Yes. You can change your goals, schedule, coach style, and other preferences anytime in Settings.',
  },
  {
    question: 'Does the app send reminders?',
    answer:
      'Yes. Bisafit can send reminders for scheduled workouts. You can control notifications in Settings.',
  },
  {
    question: 'Is my data safe?',
    answer:
      'Your data is stored securely and used only to personalize your experience. We do not sell your personal information.',
  },
  {
    question: 'How do I contact support?',
    answer:
      'You can send us a message directly from Settings → Help & Support.',
  },
];

export function FAQScreen({ open, onOpenChange }: FAQScreenProps) {
  const [expandedItem, setExpandedItem] = useState<string | undefined>(undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-h-[700px] flex-col p-0 sm:max-w-md">
        <DialogHeader className="flex-shrink-0 border-b border-border px-4 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">FAQ</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4">
          <Accordion
            type="single"
            collapsible
            value={expandedItem}
            onValueChange={setExpandedItem}
            className="w-full py-2"
          >
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border">
                <AccordionTrigger className="py-4 text-left text-sm font-medium hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
