import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileJson } from "lucide-react";

const SAMPLE_JSON = JSON.stringify(
  [
    {
      type: "multipleChoice",
      content: "Which of the following is NOT a JavaScript data type?",
      options: ["String", "Boolean", "Float", "Symbol"],
      answer: "2",
      points: 1,
    },
    {
      type: "coding",
      content: "Write a function that returns the sum of two numbers.",
      codeSnippet: "function sum(a, b) {\n  // your code here\n}",
      testCases: [
        { input: "1, 2", output: "3" },
        { input: "10, 20", output: "30" },
      ],
      points: 5,
    },
    {
      type: "subjective",
      content: "Explain the difference between == and === in JavaScript.",
      evaluationGuidelines:
        "Type coercion explanation (3pts), examples (3pts), when to use each (4pts)",
      points: 10,
    },
  ],
  null,
  2
);

interface BulkImportQuestionsProps {
  testId: number;
  onClose: () => void;
}

export function BulkImportQuestions({ testId, onClose }: BulkImportQuestionsProps) {
  const queryClient = useQueryClient();
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const createQuestion = useMutation({
    mutationFn: async (question: any) => {
      const res = await apiRequest("POST", "/api/questions", { ...question, testId });
      return res.json();
    },
  });

  async function handleImport() {
    setError("");
    let questions: any[];

    try {
      const parsed = JSON.parse(jsonText);
      questions = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      setError("Invalid JSON. Please check the format and try again.");
      return;
    }

    if (questions.length === 0) {
      setError("No questions found in the JSON.");
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const q of questions) {
      try {
        await createQuestion.mutateAsync(q);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setImporting(false);
    queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });

    if (failCount === 0) {
      toast({
        title: `${successCount} question${successCount > 1 ? "s" : ""} imported successfully`,
      });
      onClose();
    } else {
      toast({
        title: `${successCount} imported, ${failCount} failed`,
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-lg sm:max-w-2xl p-0 gap-0 max-h-[92dvh] overflow-hidden flex flex-col rounded-xl">
        <DialogHeader className="p-4 pb-3 sm:p-6 sm:pb-4 border-b shrink-0">
          <DialogTitle className="text-base sm:text-lg pr-6">
            Import Questions from JSON
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6 sm:py-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Paste a JSON array of questions. Each needs at least{" "}
              <code className="bg-muted px-1 rounded text-[11px]">type</code> and{" "}
              <code className="bg-muted px-1 rounded text-[11px]">content</code>.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs shrink-0 self-start"
              onClick={() => {
                setJsonText(SAMPLE_JSON);
                setError("");
              }}
            >
              <FileJson className="h-3.5 w-3.5 mr-1" />
              Load Sample
            </Button>
          </div>

          <Textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setError("");
            }}
            placeholder='Paste JSON here, or tap "Load Sample"...'
            rows={10}
            className="font-mono text-xs sm:text-sm min-h-[180px] sm:min-h-[280px]"
          />

          {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}

          <div className="text-[10px] sm:text-xs text-muted-foreground space-y-1 leading-relaxed">
            <p>
              <strong>type</strong>:{" "}
              <code className="bg-muted px-1 rounded">multipleChoice</code> ·{" "}
              <code className="bg-muted px-1 rounded">coding</code> ·{" "}
              <code className="bg-muted px-1 rounded">subjective</code>
            </p>
            <p>
              <strong>MCQ</strong>: <code className="bg-muted px-1 rounded">options</code> +{" "}
              <code className="bg-muted px-1 rounded">answer</code> index
            </p>
            <p>
              <strong>Coding</strong>: <code className="bg-muted px-1 rounded">testCases</code>{" "}
              {"{ input, output }"}
            </p>
          </div>
        </div>

        <DialogFooter className="p-3 sm:p-4 border-t shrink-0 gap-2">
          <Button variant="outline" className="h-10 sm:h-9" onClick={onClose} disabled={importing}>
            Cancel
          </Button>
          <Button
            className="h-10 sm:h-9"
            onClick={handleImport}
            disabled={importing || !jsonText.trim()}
          >
            {importing ? "Importing..." : "Import Questions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkImportQuestions;
