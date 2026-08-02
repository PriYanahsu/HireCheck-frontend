import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import Sidebar from "@/components/ui/sidebar";
import MobileSidebar from "@/components/ui/mobile-sidebar";
import TestForm from "@/components/tests/test-form";
import QuestionForm from "@/components/tests/question-form";
import QuestionCard, { type QuestionType } from "@/components/tests/question-card";
import BulkImportQuestions from "@/components/tests/bulk-import-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Plus, Upload } from "lucide-react";
import type { Test, Question } from "@/lib/schema";

type TestWithQuestions = Test & { questions?: Question[] };

export default function CreateTest() {
  const { useRequireAuth } = useAuth();
  const user = useRequireAuth();
  const [step, setStep] = useState<"details" | "questions">("details");
  const [testId, setTestId] = useState<number | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  const { data: test, isLoading } = useQuery<TestWithQuestions>({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!testId,
  });

  if (!user) return null;

  const handleQuestionPhase = (id: number) => {
    setTestId(id);
    setStep("questions");
  };

  return (
    <div className="h-screen overflow-hidden flex">
      <Sidebar />
      <MobileSidebar />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="hidden lg:flex shrink-0 items-center justify-between h-16 bg-white border-b border-gray-200 px-6">
          <h1 className="text-xl font-bold text-gray-900">Create New Test</h1>
          <Button variant="outline" asChild>
            <Link href="/tests">Cancel</Link>
          </Button>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto bg-gray-50 pt-14 lg:pt-0">
          <div className="py-4 px-3 sm:py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between gap-3 mb-4 lg:hidden">
              <h1 className="text-lg font-semibold text-gray-900">Create New Test</h1>
              <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" asChild>
                <Link href="/tests">Cancel</Link>
              </Button>
            </div>

            <Card>
              <CardHeader className="border-b p-3 sm:p-6">
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm flex items-center justify-center shrink-0 ${
                      step === "details"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    1
                  </div>
                  <CardTitle className="text-sm sm:text-lg">Test Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className={step === "details" ? "p-3 sm:p-6" : "hidden"}>
                <TestForm onQuestionPhase={handleQuestionPhase} />
              </CardContent>
            </Card>

            {step === "questions" && (
              <Card className="mt-4 sm:mt-6">
                <CardHeader className="border-b p-3 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5 sm:gap-4">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm flex items-center justify-center shrink-0">
                        2
                      </div>
                      <CardTitle className="text-sm sm:text-lg">Questions</CardTitle>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs sm:h-9 sm:text-sm"
                        onClick={() => setIsBulkImporting(true)}
                        disabled={isBulkImporting || isAddingQuestion}
                      >
                        <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                        <span className="sm:hidden">Import</span>
                        <span className="hidden sm:inline">Import JSON</span>
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs sm:h-9 sm:text-sm"
                        onClick={() => setIsAddingQuestion(true)}
                        disabled={isAddingQuestion || isBulkImporting}
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                        Add Question
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  {isLoading ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      Loading questions...
                    </div>
                  ) : (test?.questions?.length ?? 0) > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {test?.questions?.map((question) => (
                        <QuestionCard
                          key={question.id}
                          id={question.id}
                          testId={testId!}
                          type={question.type as QuestionType}
                          content={question.content}
                          codeSnippet={question.codeSnippet ?? undefined}
                          options={question.options as string[]}
                          answer={question.answer ?? undefined}
                          testCases={question.testCases as any}
                          evaluationGuidelines={question.evaluationGuidelines ?? undefined}
                          points={question.points ?? 0}
                          order={question.order ?? 0}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-3">
                        You haven't added any questions yet.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setIsAddingQuestion(true)}
                        disabled={isAddingQuestion}
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Your First Question
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isAddingQuestion && testId && (
              <QuestionForm testId={testId} onClose={() => setIsAddingQuestion(false)} />
            )}
            {isBulkImporting && testId && (
              <BulkImportQuestions testId={testId} onClose={() => setIsBulkImporting(false)} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
