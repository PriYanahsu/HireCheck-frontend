import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/ui/sidebar";
import MobileSidebar from "@/components/ui/mobile-sidebar";
import TestForm from "@/components/tests/test-form";
import QuestionForm from "@/components/tests/question-form";
import QuestionCard, { type QuestionType } from "@/components/tests/question-card";
import BulkImportQuestions from "@/components/tests/bulk-import-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft, Upload } from "lucide-react";
import type { Test, Question } from "@/lib/schema";

type TestWithQuestions = Test & { questions?: Question[] };

export default function EditTest() {
  const { useRequireAuth } = useAuth();
  const user = useRequireAuth();
  const [, setLocation] = useLocation();
  const [isRoute, params] = useRoute("/tests/:id/edit");
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  const testId = isRoute ? parseInt(params.id) : 0;

  const { data: test, isLoading, error } = useQuery<TestWithQuestions>({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!user && !!testId,
  });

  if (!user) return null;

  if (!isRoute) {
    setLocation("/tests");
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-lg sm:text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-sm text-gray-600 mb-4">
            Failed to load test: {(error as Error).message}
          </p>
          <Button asChild size="sm">
            <Link href="/tests">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tests
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex">
      <Sidebar />
      <MobileSidebar />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="hidden lg:flex shrink-0 items-center justify-between h-16 bg-white border-b border-gray-200 px-6">
          <div className="flex items-center space-x-2 min-w-0">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/tests">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {isLoading ? "Loading..." : `Edit: ${test?.title}`}
            </h1>
          </div>
          <Button asChild>
            <Link href={`/tests/${testId}`}>View Test</Link>
          </Button>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto bg-gray-50 pt-14 lg:pt-0">
          <div className="py-4 px-3 sm:py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
            {isLoading ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                Loading test details...
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 mb-4 lg:hidden">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                      <Link href="/tests">
                        <ArrowLeft className="h-4 w-4" />
                      </Link>
                    </Button>
                    <h1 className="text-base font-semibold text-gray-900 truncate">
                      Edit: {test?.title}
                    </h1>
                  </div>
                  <Button size="sm" className="h-8 text-xs shrink-0" asChild>
                    <Link href={`/tests/${testId}`}>View</Link>
                  </Button>
                </div>

                <Tabs defaultValue="details">
                  <TabsList className="mb-3 sm:mb-6 w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-9">
                    <TabsTrigger value="details" className="text-xs sm:text-sm">
                      Test Details
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="text-xs sm:text-sm">
                      Questions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-0">
                    <Card>
                      <CardContent className="p-3 sm:p-6 sm:pt-6">
                        <TestForm
                          defaultValues={{
                            title: test?.title ?? "",
                            description: test?.description ?? undefined,
                            duration: test?.duration ?? 60,
                            passingScore: test?.passingScore ?? 70,
                            shuffleQuestions: test?.shuffleQuestions ?? false,
                          }}
                          testId={testId}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="questions" className="mt-0">
                    <Card>
                      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-6 pb-3">
                        <CardTitle className="text-sm sm:text-lg font-medium">Questions</CardTitle>
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2 w-full sm:w-auto">
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
                      </CardHeader>
                      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                        {(test?.questions?.length ?? 0) > 0 ? (
                          <div className="space-y-3 sm:space-y-4">
                            {test?.questions?.map((question) => (
                              <QuestionCard
                                key={question.id}
                                id={question.id}
                                testId={testId}
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
                          <div className="text-center py-8 sm:py-10">
                            <p className="text-sm text-muted-foreground mb-3">
                              No questions have been added to this test yet.
                            </p>
                            <Button
                              size="sm"
                              onClick={() => setIsAddingQuestion(true)}
                              disabled={isAddingQuestion}
                            >
                              <Plus className="h-4 w-4 mr-1.5" />
                              Add First Question
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {isAddingQuestion && test && (
                  <QuestionForm testId={testId} onClose={() => setIsAddingQuestion(false)} />
                )}
                {isBulkImporting && (
                  <BulkImportQuestions testId={testId} onClose={() => setIsBulkImporting(false)} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
