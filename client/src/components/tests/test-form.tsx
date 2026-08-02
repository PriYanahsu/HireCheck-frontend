import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { insertTestSchema } from "@/lib/schema";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const testFormSchema = insertTestSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(180, "Duration cannot exceed 180 minutes"),
  passingScore: z.number().min(0, "Passing score must be at least 0").max(100, "Passing score cannot exceed 100"),
  shuffleQuestions: z.boolean().default(false),
});

type TestFormValues = Omit<z.infer<typeof testFormSchema>, "createdBy">;

interface TestFormProps {
  defaultValues?: TestFormValues;
  testId?: number;
  onQuestionPhase?: (testId: number) => void;
}

export function TestForm({ defaultValues, testId, onQuestionPhase }: TestFormProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema.omit({ createdBy: true })),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      duration: 60,
      passingScore: 70,
      shuffleQuestions: false,
    },
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: TestFormValues) => {
      const res = await apiRequest("POST", "/api/tests", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({
        title: "Test created successfully",
        description: "Now let's add some questions to your test.",
      });
      if (onQuestionPhase) {
        onQuestionPhase(data.id);
      } else {
        setLocation(`/tests/${data.id}/edit`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error creating test",
        description: error.message || "An error occurred while creating the test",
        variant: "destructive",
      });
    },
  });

  const updateTestMutation = useMutation({
    mutationFn: async (data: TestFormValues) => {
      const res = await apiRequest("PUT", `/api/tests/${testId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      toast({ title: "Test updated successfully" });
      if (onQuestionPhase && testId) {
        onQuestionPhase(testId);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error updating test",
        description: error.message || "An error occurred while updating the test",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: TestFormValues) {
    if (testId) {
      updateTestMutation.mutate(data);
    } else {
      createTestMutation.mutate(data);
    }
  }

  function onCancel() {
    setLocation("/tests");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <div>
          <h3 className="text-sm sm:text-lg font-medium leading-6 text-gray-900">Test Details</h3>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
            Set up the basic information for your assessment.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:gap-y-6 sm:gap-x-4 sm:grid-cols-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="sm:col-span-4 space-y-1.5">
                <FormLabel className="text-[13px] sm:text-sm">Test Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Frontend Developer Assessment"
                    className="h-10 text-[15px] sm:text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="sm:col-span-6 space-y-1.5">
                <FormLabel className="text-[13px] sm:text-sm">Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what this test evaluates..."
                    rows={3}
                    className="text-[15px] sm:text-sm resize-y min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 space-y-1.5">
                <FormLabel className="text-[13px] sm:text-sm">Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="60"
                    className="h-10 text-[15px] sm:text-sm"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passingScore"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 space-y-1.5">
                <FormLabel className="text-[13px] sm:text-sm">Passing Score (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="70"
                    className="h-10 text-[15px] sm:text-sm"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shuffleQuestions"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 space-y-1.5">
                <FormLabel className="text-[13px] sm:text-sm">Shuffle Questions</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "true")}
                  defaultValue={field.value ? "true" : "false"}
                >
                  <FormControl>
                    <SelectTrigger className="h-10 text-[15px] sm:text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-1">
          <Button type="button" variant="outline" className="h-10 sm:h-9" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-10 sm:h-9"
            disabled={createTestMutation.isPending || updateTestMutation.isPending}
          >
            {createTestMutation.isPending || updateTestMutation.isPending
              ? "Saving..."
              : testId
                ? "Update Test"
                : "Create Test"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default TestForm;
