import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QuestionForm } from "./question-form";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from "lucide-react";

export type QuestionType = "multipleChoice" | "coding" | "subjective";

interface QuestionCardProps {
  id: number;
  testId: number;
  type: QuestionType;
  content: string;
  codeSnippet?: string;
  options?: string[];
  answer?: string;
  testCases?: Array<{ input: string; output: string }>;
  evaluationGuidelines?: string;
  points: number;
  order: number;
}

export function QuestionCard(props: QuestionCardProps) {
  const {
    id,
    testId,
    type,
    content,
    codeSnippet,
    options,
    answer,
    testCases,
    evaluationGuidelines,
    points,
  } = props;
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const deleteQuestionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/questions/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      toast({ title: "Question deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting question",
        description: error.message || "An error occurred while deleting the question",
        variant: "destructive",
      });
    },
  });

  function getBadgeVariant(type: QuestionType) {
    switch (type) {
      case "multipleChoice":
        return "default";
      case "coding":
        return "secondary";
      case "subjective":
        return "outline";
      default:
        return "default";
    }
  }

  function getTypeLabel(type: QuestionType) {
    switch (type) {
      case "multipleChoice":
        return "MCQ";
      case "coding":
        return "Coding";
      case "subjective":
        return "Subjective";
      default:
        return type;
    }
  }

  function getTypeLabelFull(type: QuestionType) {
    switch (type) {
      case "multipleChoice":
        return "Multiple Choice";
      case "coding":
        return "Coding";
      case "subjective":
        return "Subjective";
      default:
        return type;
    }
  }

  return (
    <>
      <Card className="bg-muted/40 border border-border/60">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getBadgeVariant(type)} className="text-[10px] sm:text-xs shrink-0">
                  <span className="sm:hidden">{getTypeLabel(type)}</span>
                  <span className="hidden sm:inline">{getTypeLabelFull(type)}</span>
                </Badge>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {points} pt{points !== 1 ? "s" : ""}
                </span>
              </div>
              <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-3 sm:line-clamp-none">
                {content}
              </h4>
            </div>
            <div className="flex shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the question.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() => deleteQuestionMutation.mutate()}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {codeSnippet && (
            <div className="mt-2 bg-muted p-2.5 sm:p-3 rounded text-xs sm:text-sm text-foreground font-mono overflow-x-auto">
              <pre className="whitespace-pre-wrap break-words">{codeSnippet}</pre>
            </div>
          )}

          {type === "multipleChoice" && options && (
            <div className="mt-2.5 space-y-1.5">
              {options.map((option, index) => (
                <div key={index} className="flex items-start gap-2">
                  <input
                    type="radio"
                    id={`q${id}-option${index}`}
                    name={`q${id}-options`}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                    defaultChecked={answer === index.toString()}
                    disabled
                  />
                  <label
                    htmlFor={`q${id}-option${index}`}
                    className="text-xs sm:text-sm text-muted-foreground leading-snug"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          )}

          {type === "coding" && testCases && (
            <div className="mt-2.5 bg-muted p-2.5 sm:p-3 rounded text-xs text-foreground">
              <div className="font-medium mb-1.5 text-[11px] sm:text-xs">Test Cases</div>
              <div className="font-mono space-y-1 overflow-x-auto">
                {testCases.map((testCase, index) => (
                  <div key={index} className="break-all">
                    In: {testCase.input} → Out: {testCase.output}
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === "subjective" && evaluationGuidelines && (
            <div className="mt-2.5 bg-muted p-2.5 sm:p-3 rounded text-xs text-foreground">
              <div className="font-medium mb-1 text-[11px] sm:text-xs">Evaluation Guidelines</div>
              <div className="whitespace-pre-line text-[11px] sm:text-xs text-muted-foreground">
                {evaluationGuidelines}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isEditing && (
        <QuestionForm
          testId={testId}
          questionId={id}
          defaultValues={{
            type,
            content,
            codeSnippet,
            options,
            answer,
            testCases,
            evaluationGuidelines,
            points,
            order: props.order,
          }}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}

export default QuestionCard;
