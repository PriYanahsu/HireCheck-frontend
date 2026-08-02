import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertQuestionSchema } from "@/lib/schema";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";

const questionFormSchema = insertQuestionSchema.extend({
  type: z.enum(["multipleChoice", "coding", "subjective", "patternRecognition"], {
    required_error: "Please select a question type",
  }),
  content: z.string().min(3, "Question content must be at least 3 characters"),
  codeSnippet: z.string().optional(),
  options: z.array(z.string().min(1, "Option cannot be empty")).optional(),
  answer: z.string().optional(),
  testCases: z.array(z.object({
    input: z.string(),
    output: z.string(),
  })).optional(),
  evaluationGuidelines: z.string().optional(),
  imageUrl: z.string().optional(),
  points: z.number().min(1, "Points must be at least 1"),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface QuestionFormProps {
  testId: number;
  questionId?: number;
  defaultValues?: Partial<QuestionFormValues>;
  onClose: () => void;
}

export function QuestionForm({ testId, questionId, defaultValues, onClose }: QuestionFormProps) {
  const queryClient = useQueryClient();
  const [questionType, setQuestionType] = useState<string>(defaultValues?.type || "multipleChoice");
  const [options, setOptions] = useState<string[]>(defaultValues?.options as string[] || ["", "", "", ""]);
  const [testCases, setTestCases] = useState<{ input: string, output: string }[]>(
    defaultValues?.testCases as any[] || [{ input: "", output: "" }]
  );
  const [imageUrl, setImageUrl] = useState<string>(defaultValues?.imageUrl || "");

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      testId,
      type: defaultValues?.type || "multipleChoice",
      content: defaultValues?.content || "",
      codeSnippet: defaultValues?.codeSnippet || "",
      options: defaultValues?.options || ["", "", "", ""],
      answer: defaultValues?.answer || "0",
      testCases: defaultValues?.testCases || [{ input: "", output: "" }],
      evaluationGuidelines: defaultValues?.evaluationGuidelines || "",
      imageUrl: defaultValues?.imageUrl || "",
      points: defaultValues?.points || 1,
      order: defaultValues?.order || 0,
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      const res = await apiRequest("POST", "/api/questions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      toast({ title: "Question added successfully" });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding question",
        description: error.message || "An error occurred while adding the question",
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      const res = await apiRequest("PUT", `/api/questions/${questionId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      toast({ title: "Question updated successfully" });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating question",
        description: error.message || "An error occurred while updating the question",
        variant: "destructive",
      });
    },
  });

  function handleQuestionTypeChange(value: string) {
    setQuestionType(value);
    form.setValue("type", value as any);
  }

  function handleOptionChange(index: number, value: string) {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    form.setValue("options", newOptions);
  }

  function addOption() {
    setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) {
      toast({
        title: "Cannot remove option",
        description: "Multiple choice questions must have at least 2 options",
        variant: "destructive",
      });
      return;
    }

    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    form.setValue("options", newOptions);

    const currentAnswer = form.getValues("answer");
    if (currentAnswer && parseInt(currentAnswer as string) >= newOptions.length) {
      form.setValue("answer", "0");
    }
  }

  function handleTestCaseChange(index: number, field: "input" | "output", value: string) {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
    form.setValue("testCases", newTestCases);
  }

  function addTestCase() {
    setTestCases([...testCases, { input: "", output: "" }]);
  }

  function removeTestCase(index: number) {
    if (testCases.length <= 1) {
      toast({
        title: "Cannot remove test case",
        description: "Coding questions must have at least 1 test case",
        variant: "destructive",
      });
      return;
    }

    const newTestCases = testCases.filter((_, i) => i !== index);
    setTestCases(newTestCases);
    form.setValue("testCases", newTestCases);
  }

  function onSubmit(data: QuestionFormValues) {
    const questionData = { ...data, testId };

    if (questionData.type !== "multipleChoice" && questionData.type !== "patternRecognition") {
      delete questionData.options;
      delete questionData.answer;
    }
    if (questionData.type !== "coding") delete questionData.testCases;
    if (questionData.type !== "subjective") delete questionData.evaluationGuidelines;
    if (questionData.type !== "patternRecognition") delete questionData.imageUrl;

    if (questionId) {
      updateQuestionMutation.mutate(questionData);
    } else {
      createQuestionMutation.mutate(questionData);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-lg sm:max-w-2xl p-0 gap-0 max-h-[92dvh] overflow-hidden flex flex-col rounded-xl">
        <DialogHeader className="p-4 pb-3 sm:p-6 sm:pb-4 border-b shrink-0">
          <DialogTitle className="text-base sm:text-lg pr-6">
            {questionId ? "Edit Question" : "Add Question"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6 sm:py-4">
          <Form {...form}>
            <form id="question-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[13px] sm:text-sm">Question Type</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleQuestionTypeChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 !text-[14px] sm:!text-sm">
                          <SelectValue placeholder="Select a question type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="multipleChoice">Multiple Choice</SelectItem>
                        <SelectItem value="coding">Coding</SelectItem>
                        <SelectItem value="subjective">Subjective</SelectItem>
                        <SelectItem value="patternRecognition">Pattern Recognition</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[13px] sm:text-sm">Question</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the question text"
                        className="min-h-[72px] !text-[14px] sm:!text-sm"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[13px] sm:text-sm">Points</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        className="h-10 w-full !text-[14px] sm:max-w-[140px] sm:!text-sm"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px] sm:text-sm">
                      Points awarded for a correct answer
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {questionType === "multipleChoice" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel className="text-[13px] sm:text-sm">Options</FormLabel>
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={addOption}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name="answer"
                    render={({ field }) => (
                      <FormItem>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="space-y-2"
                        >
                          {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <RadioGroupItem value={index.toString()} id={`option-${index}`} className="shrink-0" />
                              <Input
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                placeholder={`Option ${index + 1}`}
                                className="h-9 min-w-0 flex-1 !text-[14px] sm:!text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => removeOption(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </RadioGroup>
                        <FormDescription className="text-[11px] sm:text-sm">
                          Select the correct answer
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {questionType === "coding" && (
                <>
                  <FormField
                    control={form.control}
                    name="codeSnippet"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] sm:text-sm">Code Snippet (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={"function example() {\n  // Your code here\n}"}
                            className="font-mono text-xs sm:text-sm min-h-[88px]"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-[11px] sm:text-sm">
                          Starter code for the candidate
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel className="text-[13px] sm:text-sm">Test Cases</FormLabel>
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={addTestCase}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add
                      </Button>
                    </div>

                    {testCases.map((testCase, index) => (
                      <div key={index} className="flex items-start gap-2 rounded-lg border p-2.5 sm:p-0 sm:border-0">
                        <div className="space-y-2 flex-1 min-w-0">
                          <Input
                            value={testCase.input}
                            onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
                            placeholder="Input"
                            className="h-9 !text-[14px] sm:!text-sm"
                          />
                          <Input
                            value={testCase.output}
                            onChange={(e) => handleTestCaseChange(index, "output", e.target.value)}
                            placeholder="Expected Output"
                            className="h-9 !text-[14px] sm:!text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => removeTestCase(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {questionType === "subjective" && (
                <FormField
                  control={form.control}
                  name="evaluationGuidelines"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[13px] sm:text-sm">Evaluation Guidelines</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Understanding (3 pts)&#10;Clarity (3 pts)&#10;Examples (4 pts)"
                          rows={4}
                          className="!text-[14px] sm:!text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px] sm:text-sm">
                        Guidelines for evaluating the response
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}

              {questionType === "patternRecognition" && (
                <>
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] sm:text-sm">Pattern Image</FormLabel>
                        <FormControl>
                          <FileUpload
                            onUploadComplete={(url) => {
                              field.onChange(url);
                              setImageUrl(url);
                            }}
                            currentImageUrl={field.value}
                            label="Upload Pattern Sequence Image"
                          />
                        </FormControl>
                        <FormDescription className="text-[11px] sm:text-sm">
                          Upload an image showing the pattern sequence
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  {imageUrl && (
                    <div className="p-3 border rounded-md">
                      <p className="text-xs font-medium mb-2">Preview</p>
                      <img
                        src={imageUrl}
                        alt="Pattern sequence"
                        className="max-w-full h-auto max-h-[160px] object-contain border rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/600x400?text=Invalid+Image+URL";
                        }}
                      />
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel className="text-[13px] sm:text-sm">Pattern Options</FormLabel>
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={addOption}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="space-y-2"
                          >
                            {options.map((option, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <RadioGroupItem
                                  value={index.toString()}
                                  id={`pattern-option-${index}`}
                                  className="shrink-0"
                                />
                                <Input
                                  value={option}
                                  onChange={(e) => handleOptionChange(index, e.target.value)}
                                  placeholder={`Option ${index + 1}`}
                                  className="h-9 min-w-0 flex-1 !text-[14px] sm:!text-sm"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 shrink-0"
                                  onClick={() => removeOption(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </RadioGroup>
                          <FormDescription className="text-[11px] sm:text-sm">
                            Enter options and select the correct one
                          </FormDescription>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </form>
          </Form>
        </div>

        <DialogFooter className="p-3 sm:p-4 border-t shrink-0 gap-2 bg-background">
          <Button type="button" variant="outline" className="h-10 sm:h-9" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="question-form"
            className="h-10 sm:h-9"
            disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
          >
            {createQuestionMutation.isPending || updateQuestionMutation.isPending
              ? "Saving..."
              : questionId
                ? "Update Question"
                : "Add Question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default QuestionForm;
