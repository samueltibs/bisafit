/**
 * Beta Feedback Form
 * 
 * Comprehensive questionnaire for beta testers to provide structured feedback.
 * This component replaces the simple feedback modal during beta testing phase.
 * 
 * To revert to simple feedback after launch, set BETA_MODE = false in Settings.tsx
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Star,
  Sparkles,
  Dumbbell,
  Smartphone,
  Zap,
  MessageSquare,
  Check,
  Upload,
  Image,
  Video,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { trackEvent } from '@/lib/analytics';

interface BetaFeedbackFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  size: number;
}

interface FeedbackData {
  // Section 1: Overall Experience
  overallRating: number;
  wouldRecommend: string;
  
  // Section 2: Onboarding
  onboardingClarity: string;
  onboardingLength: string;
  onboardingIssues: string;
  
  // Section 3: Workout Experience
  workoutEnjoyment: string;
  workoutInstructions: string;
  workoutTimer: string;
  workoutIssues: string;
  
  // Section 4: Design & Usability
  designRating: string;
  navigationEase: string;
  mobileExperience: string;
  designFeedback: string;
  
  // Section 5: Features
  favoriteFeatures: string[];
  missingFeatures: string;
  
  // Section 6: Bugs & Issues
  bugsEncountered: string;
  bugAttachments: string[]; // URLs of uploaded files
  deviceInfo: string;
  
  // Section 7: Final Thoughts
  oneImprovement: string;
  additionalComments: string;
}

const initialFeedback: FeedbackData = {
  overallRating: 0,
  wouldRecommend: '',
  onboardingClarity: '',
  onboardingLength: '',
  onboardingIssues: '',
  workoutEnjoyment: '',
  workoutInstructions: '',
  workoutTimer: '',
  workoutIssues: '',
  designRating: '',
  navigationEase: '',
  mobileExperience: '',
  designFeedback: '',
  favoriteFeatures: [],
  missingFeatures: '',
  bugsEncountered: '',
  bugAttachments: [],
  deviceInfo: '',
  oneImprovement: '',
  additionalComments: '',
};

const TOTAL_SECTIONS = 7;

const featureOptions = [
  { id: 'workouts', label: 'Workout Plans' },
  { id: 'ai_images', label: 'AI Form Guides' },
  { id: 'nutrition', label: 'Nutrition Tracking' },
  { id: 'progress', label: 'Progress Photos' },
  { id: 'design', label: 'App Design' },
  { id: 'onboarding', label: 'Onboarding Flow' },
  { id: 'timer', label: 'Workout Timer' },
  { id: 'scheduling', label: 'Workout Scheduling' },
];

export function BetaFeedbackForm({ open, onOpenChange }: BetaFeedbackFormProps) {
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState(1);
  const [feedback, setFeedback] = useState<FeedbackData>(initialFeedback);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const progress = (currentSection / TOTAL_SECTIONS) * 100;

  const updateFeedback = (key: keyof FeedbackData, value: any) => {
    setFeedback(prev => ({ ...prev, [key]: value }));
  };

  const toggleFeature = (featureId: string) => {
    setFeedback(prev => ({
      ...prev,
      favoriteFeatures: prev.favoriteFeatures.includes(featureId)
        ? prev.favoriteFeatures.filter(f => f !== featureId)
        : [...prev.favoriteFeatures, featureId]
    }));
  };

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a supported format`);
        continue;
      }

      // Check file size (max 50MB for videos, 10MB for images)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max ${isVideo ? '50MB' : '10MB'})`);
        continue;
      }

      try {
        // Upload to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id || 'anonymous'}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `beta-feedback/${fileName}`;

        const { data, error } = await supabase.storage
          .from('feedback-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          // If bucket doesn't exist, create a data URL as fallback
          console.log('Storage upload failed, using data URL fallback:', error.message);
          
          // Convert to base64 for local storage
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          newFiles.push({
            id: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            name: file.name,
            type: isImage ? 'image' : 'video',
            url: dataUrl,
            size: file.size
          });
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('feedback-attachments')
            .getPublicUrl(filePath);

          newFiles.push({
            id: data.path,
            name: file.name,
            type: isImage ? 'image' : 'video',
            url: publicUrl,
            size: file.size
          });
        }
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      updateFeedback('bugAttachments', [...feedback.bugAttachments, ...newFiles.map(f => f.url)]);
      toast.success(`${newFiles.length} file(s) uploaded`);
    }

    setIsUploading(false);
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      updateFeedback('bugAttachments', feedback.bugAttachments.filter(url => url !== file.url));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleNext = () => {
    if (currentSection < TOTAL_SECTIONS) {
      setCurrentSection(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentSection > 1) {
      setCurrentSection(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Store feedback in Supabase
      const { error } = await supabase
        .from('beta_feedback')
        .insert({
          user_id: user?.id,
          feedback_data: feedback,
          submitted_at: new Date().toISOString(),
          app_version: '1.0.0-beta',
          device_info: feedback.deviceInfo || navigator.userAgent,
        });

      if (error) {
        // If table doesn't exist, just log to console and track event
        console.log('Beta feedback:', feedback);
      }

      // Track the submission
      trackEvent('beta_feedback_submitted' as any, {
        overall_rating: feedback.overallRating,
        would_recommend: feedback.wouldRecommend,
        sections_completed: TOTAL_SECTIONS,
      });

      setIsSubmitted(true);
      toast.success('Thank you for your feedback! 🙏');
      
      // Reset after delay
      setTimeout(() => {
        setIsSubmitted(false);
        setCurrentSection(1);
        setFeedback(initialFeedback);
        setUploadedFiles([]);
        onOpenChange(false);
      }, 2000);

    } catch (err) {
      console.error('Feedback submission error:', err);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentSection(1);
    setFeedback(initialFeedback);
    onOpenChange(false);
  };

  // Star Rating Component
  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-2 justify-center py-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={cn(
              "h-10 w-10 transition-colors",
              star <= value 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );

  // Render current section
  const renderSection = () => {
    switch (currentSection) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 icon-energy" />
              <h3 className="text-lg font-semibold">Overall Experience</h3>
              <p className="text-sm text-muted-foreground mt-1">How's your experience so far?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm">How would you rate BisaFit overall?</Label>
                <StarRating 
                  value={feedback.overallRating} 
                  onChange={(v) => updateFeedback('overallRating', v)} 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Would you recommend BisaFit to a friend?</Label>
                <RadioGroup 
                  value={feedback.wouldRecommend} 
                  onValueChange={(v) => updateFeedback('wouldRecommend', v)}
                  className="grid grid-cols-3 gap-2"
                >
                  {['Definitely', 'Maybe', 'Not yet'].map((option) => (
                    <div
                      key={option}
                      className={cn(
                        "flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all",
                        feedback.wouldRecommend === option.toLowerCase().replace(' ', '_')
                          ? "border-foreground/30 bg-secondary"
                          : "border-border hover:border-foreground/20"
                      )}
                      onClick={() => updateFeedback('wouldRecommend', option.toLowerCase().replace(' ', '_'))}
                    >
                      <RadioGroupItem value={option.toLowerCase().replace(' ', '_')} className="sr-only" />
                      <span className="text-sm font-medium">{option}</span>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Smartphone className="h-12 w-12 mx-auto mb-4 icon-water" />
              <h3 className="text-lg font-semibold">Onboarding Experience</h3>
              <p className="text-sm text-muted-foreground mt-1">Tell us about getting started</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Were the onboarding steps clear?</Label>
                <RadioGroup 
                  value={feedback.onboardingClarity} 
                  onValueChange={(v) => updateFeedback('onboardingClarity', v)}
                  className="grid grid-cols-3 gap-2"
                >
                  {['Very clear', 'Somewhat', 'Confusing'].map((option) => (
                    <div
                      key={option}
                      className={cn(
                        "flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all text-center",
                        feedback.onboardingClarity === option.toLowerCase().replace(' ', '_')
                          ? "border-foreground/30 bg-secondary"
                          : "border-border hover:border-foreground/20"
                      )}
                      onClick={() => updateFeedback('onboardingClarity', option.toLowerCase().replace(' ', '_'))}
                    >
                      <RadioGroupItem value={option.toLowerCase().replace(' ', '_')} className="sr-only" />
                      <span className="text-sm font-medium">{option}</span>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">How was the onboarding length?</Label>
                <RadioGroup 
                  value={feedback.onboardingLength} 
                  onValueChange={(v) => updateFeedback('onboardingLength', v)}
                  className="grid grid-cols-3 gap-2"
                >
                  {['Too short', 'Just right', 'Too long'].map((option) => (
                    <div
                      key={option}
                      className={cn(
                        "flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all text-center",
                        feedback.onboardingLength === option.toLowerCase().replace(' ', '_')
                          ? "border-foreground/30 bg-secondary"
                          : "border-border hover:border-foreground/20"
                      )}
                      onClick={() => updateFeedback('onboardingLength', option.toLowerCase().replace(' ', '_'))}
                    >
                      <RadioGroupItem value={option.toLowerCase().replace(' ', '_')} className="sr-only" />
                      <span className="text-sm font-medium">{option}</span>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Any issues during onboarding? (optional)</Label>
                <Textarea
                  placeholder="Describe any problems you encountered..."
                  value={feedback.onboardingIssues}
                  onChange={(e) => updateFeedback('onboardingIssues', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 icon-workout" />
              <h3 className="text-lg font-semibold">Workout Experience</h3>
              <p className="text-sm text-muted-foreground mt-1">How are the workouts?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Do you enjoy the workout format?</Label>
                <RadioGroup 
                  value={feedback.workoutEnjoyment} 
                  onValueChange={(v) => updateFeedback('workoutEnjoyment', v)}
                  className="grid grid-cols-3 gap-2"
                >
                  {['Love it', 'It\'s okay', 'Not for me'].map((option) => (
                    <div
                      key={option}
                      className={cn(
                        "flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all text-center",
                        feedback.workoutEnjoyment === option.toLowerCase().replace(/['\s]/g, '_')
                          ? "border-foreground/30 bg-secondary"
                          : "border-border hover:border-foreground/20"
                      )}
                      onClick={() => updateFeedback('workoutEnjoyment', option.toLowerCase().replace(/['\s]/g, '_'))}
                    >
                      <RadioGroupItem value={option.toLowerCase().replace(/['\s]/g, '_')} className="sr-only" />
                      <span className="text-sm font-medium">{option}</span>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Are exercise instructions clear?</Label>
                <RadioGroup 
                  value={feedback.workoutInstructions} 
                  onValueChange={(v) => updateFeedback('workoutInstructions', v)}
                  className="grid grid-cols-3 gap-2"
                >
                  {['Very clear', 'Need more', 'Confusing'].map((option) => (
                    <div
                      key={option}
                      className={cn(
                        "flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all text-center",
                        feedback.workoutInstructions === option.toLowerCase().replace(' ', '_')
                          ? "border-foreground/30 bg-secondary"
                          : "border-border hover:border-foreground/20"
                      )}
                      onClick={() => updateFeedback('workoutInstructions', option.toLowerCase().replace(' ', '_'))}
                    >
                      <RadioGroupItem value={option.toLowerCase().replace(' ', '_')} className="sr-only" />
                      <span className="text-sm font-medium">{option}</span>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">How's the workout timer?</Label>
                <RadioGroup 
                  value={feedback.workoutTimer} 
                  onValueChange={(v) => updateFeedback('workoutTimer', v)}
                  className="grid grid-cols-3 gap-2"
                >
                  {['Perfect', 'Needs work', 'Didn\'t use'].map((option) => (
                    <div
                      key={option}
                      className={cn(
                        "flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all text-center",
                        feedback.workoutTimer === option.toLowerCase().replace(/['\s]/g, '_')
                          ? "border-foreground/30 bg-secondary"
                          : "border-border hover:border-foreground/20"
                      )}
                      onClick={() => updateFeedback('workoutTimer', option.toLowerCase().replace(/['\s]/g, '_'))}
                    >
                      <RadioGroupItem value={option.toLowerCase().replace(/['\s]/g, '_')} className="sr-only" />
                      <span className="text-sm font-medium">{option}</span>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Any workout issues? (optional)</Label>
                <Textarea
                  placeholder="Timer problems, unclear exercises, etc..."
                  value={feedback.workoutIssues}
                  onChange={(e) => updateFeedback('workoutIssues', e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 icon-energy" />
              <h3 className="text-lg font-semibold">Design & Usability</h3>
              <p className="text-sm text-muted-foreground mt-1">How does the app feel?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">How would you rate the design?</Label>
                <RadioGroup 
                  value={feedback.designRating} 
                  onValueChange={(v) => updateFeedback('designRating', v)}
                  className="grid grid-cols-3 gap-2"
                >
                  {['Love it', 'It\'s fine', 'Needs work'].map((option) => (
                    <div
                      key={option}
                      className={cn(
                        "flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all text-center",
                        feedback.designRating === option.toLowerCase().replace(/['\s]/g, '_')
                          ? "border-foreground/30 bg-secondary"
                          : "border-border hover:border-foreground/20"
                      )}
                      onClick={() => updateFeedback('designRating', option.toLowerCase().replace(/['\s]/g, '_'))}
                    >
                      <RadioGroupItem value={option.toLowerCase().replace(/['\s]/g, '_')} className="sr-only" />
                      <span className="text-sm font-medium">{option}</span>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Is navigation easy?</Label>
                <RadioGroup 
                  value={feedback.navigationEase} 
                  onValueChange={(v) => updateFeedback('navigationEase', v)}
                  className="grid grid-cols-3 gap-2"
                >
                  {['Very easy', 'Mostly', 'Got lost'].map((option) => (
                    <div
                      key={option}
                      className={cn(
                        "flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all text-center",
                        feedback.navigationEase === option.toLowerCase().replace(' ', '_')
                          ? "border-foreground/30 bg-secondary"
                          : "border-border hover:border-foreground/20"
                      )}
                      onClick={() => updateFeedback('navigationEase', option.toLowerCase().replace(' ', '_'))}
                    >
                      <RadioGroupItem value={option.toLowerCase().replace(' ', '_')} className="sr-only" />
                      <span className="text-sm font-medium">{option}</span>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Mobile experience?</Label>
                <RadioGroup 
                  value={feedback.mobileExperience} 
                  onValueChange={(v) => updateFeedback('mobileExperience', v)}
                  className="grid grid-cols-3 gap-2"
                >
                  {['Smooth', 'Some issues', 'Frustrating'].map((option) => (
                    <div
                      key={option}
                      className={cn(
                        "flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all text-center",
                        feedback.mobileExperience === option.toLowerCase().replace(' ', '_')
                          ? "border-foreground/30 bg-secondary"
                          : "border-border hover:border-foreground/20"
                      )}
                      onClick={() => updateFeedback('mobileExperience', option.toLowerCase().replace(' ', '_'))}
                    >
                      <RadioGroupItem value={option.toLowerCase().replace(' ', '_')} className="sr-only" />
                      <span className="text-sm font-medium">{option}</span>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Design suggestions? (optional)</Label>
                <Textarea
                  placeholder="Colors, layout, readability..."
                  value={feedback.designFeedback}
                  onChange={(e) => updateFeedback('designFeedback', e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Star className="h-12 w-12 mx-auto mb-4 icon-trophy" />
              <h3 className="text-lg font-semibold">Features</h3>
              <p className="text-sm text-muted-foreground mt-1">What do you like most?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Select your favorite features</Label>
                <div className="grid grid-cols-2 gap-2">
                  {featureOptions.map((feature) => (
                    <div
                      key={feature.id}
                      onClick={() => toggleFeature(feature.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all",
                        feedback.favoriteFeatures.includes(feature.id)
                          ? "border-foreground/30 bg-secondary"
                          : "border-border hover:border-foreground/20"
                      )}
                    >
                      <Checkbox
                        checked={feedback.favoriteFeatures.includes(feature.id)}
                        onCheckedChange={() => toggleFeature(feature.id)}
                      />
                      <span className="text-sm">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">What feature is missing?</Label>
                <Textarea
                  placeholder="What would make BisaFit better for you?"
                  value={feedback.missingFeatures}
                  onChange={(e) => updateFeedback('missingFeatures', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 icon-heart" />
              <h3 className="text-lg font-semibold">Bugs & Issues</h3>
              <p className="text-sm text-muted-foreground mt-1">Help us fix problems</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Did you encounter any bugs?</Label>
                <Textarea
                  placeholder="Describe any crashes, errors, or unexpected behavior..."
                  value={feedback.bugsEncountered}
                  onChange={(e) => updateFeedback('bugsEncountered', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label className="text-sm">Attach screenshots or screen recordings (optional)</Label>
                <div className="space-y-3">
                  {/* Upload Button */}
                  <label className={cn(
                    "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all",
                    isUploading 
                      ? "border-muted bg-muted/50 cursor-wait" 
                      : "border-border hover:border-foreground/30 hover:bg-muted/30"
                  )}>
                    <div className="flex flex-col items-center justify-center py-4">
                      {isUploading ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <Image className="h-5 w-5 text-muted-foreground" />
                            <Video className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Tap to upload images or videos
                          </span>
                          <span className="text-[10px] text-muted-foreground/70">
                            Max 10MB images, 50MB videos
                          </span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>

                  {/* Uploaded Files Preview */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        {uploadedFiles.length} file(s) attached
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {uploadedFiles.map((file) => (
                          <div 
                            key={file.id}
                            className="relative group rounded-lg border border-border overflow-hidden bg-muted/30"
                          >
                            {file.type === 'image' ? (
                              <img 
                                src={file.url} 
                                alt={file.name}
                                className="w-full h-20 object-cover"
                              />
                            ) : (
                              <div className="w-full h-20 flex items-center justify-center bg-muted">
                                <Video className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            {/* File info overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-background/90 px-2 py-1">
                              <p className="text-[10px] truncate">{file.name}</p>
                              <p className="text-[9px] text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">What device are you using? (optional)</Label>
                <Textarea
                  placeholder="e.g., iPhone 15, Samsung Galaxy S24, iPad..."
                  value={feedback.deviceInfo}
                  onChange={(e) => updateFeedback('deviceInfo', e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 icon-energy" />
              <h3 className="text-lg font-semibold">Final Thoughts</h3>
              <p className="text-sm text-muted-foreground mt-1">Almost done!</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">If you could improve ONE thing, what would it be?</Label>
                <Textarea
                  placeholder="The single most important improvement..."
                  value={feedback.oneImprovement}
                  onChange={(e) => updateFeedback('oneImprovement', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Anything else you'd like to share?</Label>
                <Textarea
                  placeholder="Additional thoughts, suggestions, or feedback..."
                  value={feedback.additionalComments}
                  onChange={(e) => updateFeedback('additionalComments', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Thank You! 🎉</h3>
            <p className="text-muted-foreground">
              Your feedback helps us make BisaFit better for everyone.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">Beta Feedback</span>
            <span className="text-sm text-muted-foreground font-normal">
              {currentSection}/{TOTAL_SECTIONS}
            </span>
          </DialogTitle>
          <Progress value={progress} className="h-1.5" />
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {renderSection()}
        </div>

        <DialogFooter className="flex-row justify-between gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentSection === 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          
          {currentSection < TOTAL_SECTIONS ? (
            <Button onClick={handleNext} className="gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="gap-1"
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
