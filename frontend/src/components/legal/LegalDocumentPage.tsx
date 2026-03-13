/**
 * Legal Document Page Component
 * Displays a legal document with print functionality
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { LegalDocument } from '@/types/legal';
import { APP_NAME, COMPANY_NAME, COMPANY_ADDRESS, EMAIL_SUPPORT, COMPANY_PHONE } from '@/lib/branding';
import ReactMarkdown from 'react-markdown';

interface LegalDocumentPageProps {
  document: LegalDocument | null;
  loading: boolean;
  error: string | null;
  fallbackTitle: string;
}

export function LegalDocumentPage({
  document: legalDoc,
  loading,
  error,
  fallbackTitle,
}: LegalDocumentPageProps) {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    // Go back if there's history, otherwise go to home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-32 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error Loading Document</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={handleBack} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!legalDoc) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">{fallbackTitle}</h2>
                <p className="text-muted-foreground mb-4">
                  This document is not yet available. Please check back later.
                </p>
                <Button onClick={handleBack} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page fixed inset-0 overflow-y-auto bg-background print:bg-white print:relative print:overflow-visible">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Document Header */}
        <div className="mb-8 print:mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 print:hidden">
            <span>{APP_NAME}</span>
            <span>•</span>
            <span>Legal</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 print:text-2xl">{legalDoc.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Version {legalDoc.version}</span>
            {legalDoc.published_at && (
              <span>
                Last updated: {format(new Date(legalDoc.published_at), 'MMMM d, yyyy')}
              </span>
            )}
          </div>
        </div>

        {/* Document Content */}
        <Card className="print:shadow-none print:border-0">
          <CardContent className="pt-6 prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold mt-6 mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                a: ({ href, children }) => (
                  <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              }}
            >
              {legalDoc.content_markdown}
            </ReactMarkdown>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
          <p>© {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</p>
          <p className="mt-1">
            {COMPANY_ADDRESS.street}, {COMPANY_ADDRESS.suite}, {COMPANY_ADDRESS.city}, {COMPANY_ADDRESS.state} {COMPANY_ADDRESS.zip}
          </p>
          <p className="mt-1">
            Support: {EMAIL_SUPPORT} • {COMPANY_PHONE}
          </p>
        </div>
      </div>
    </div>
  );
}
