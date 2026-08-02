import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import Sidebar from "@/components/ui/sidebar";
import MobileSidebar from "@/components/ui/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Copy,
  Share2,
  Mail,
  Trash2
} from "lucide-react";
import { formatDuration, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import BulkInvite from "@/components/candidate/bulk-invite";

// Schema for inviting a candidate
const inviteCandidateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .transform(val => `+91${val}`),
});

type InviteCandidateFormValues = z.infer<typeof inviteCandidateSchema>;

export default function ViewTest() {
  const { useRequireAuth } = useAuth();
  const user = useRequireAuth();
  const [, setLocation] = useLocation();
  const [isRoute, params] = useRoute("/tests/:id");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isBulkInviteDialogOpen, setIsBulkInviteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const testId = isRoute ? parseInt(params.id) : 0;
  
  const { data: test, isLoading, error } = useQuery({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!user && !!testId,
  });
  
  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: [`/api/tests/${testId}/candidates`],
    enabled: !!user && !!testId,
  });
  
  const inviteMutation = useMutation({
    mutationFn: async (data: InviteCandidateFormValues) => {
      const res = await apiRequest("POST", "/api/candidates", {
        ...data,
        testId
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/candidates`] });
      setIsInviteDialogOpen(false);
      toast({
        title: "Candidate invited successfully",
        description: "An invitation link has been generated",
      });
    },
    onError: () => {
      toast({
        title: "Failed to invite candidate",
        variant: "destructive",
      });
    }
  });
  
  const deleteCandidateMutation = useMutation({
    mutationFn: async (candidateId: number) => {
      const res = await apiRequest("DELETE", `/api/candidates/${candidateId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/candidates`] });
      toast({
        title: "Candidate deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete candidate",
        variant: "destructive",
      });
    }
  });
  
  const inviteForm = useForm<InviteCandidateFormValues>({
    resolver: zodResolver(inviteCandidateSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });
  
  const onInviteSubmit = (data: InviteCandidateFormValues) => {
    inviteMutation.mutate(data);
  };
  
  const copyTestLink = (testLink: string) => {
    const url = `${window.location.origin}/take-test/${testLink}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Test link has been copied to clipboard",
    });
  };
  
  const handleDeleteCandidate = (candidateId: number) => {
    if (window.confirm("Are you sure you want to delete this candidate?")) {
      deleteCandidateMutation.mutate(candidateId);
    }
  };
  
  if (!user) {
    return null;
  }
  
  if (!isRoute) {
    setLocation("/tests");
    return null;
  }
  
  if (error) {
    return (
      <div className="h-dvh max-h-dvh app-scroll flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">Failed to load test: {(error as Error).message}</p>
          <Button asChild>
            <Link href="/tests">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tests
            </Link>
          </Button>
        </div>
      </div>
    );
  }
    
  const typedTest = test as any;
  const typedCandidates = candidates as any[];
  
  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Mobile Sidebar */}
      <MobileSidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="hidden lg:flex shrink-0 items-center justify-between h-16 bg-white border-b border-gray-200 px-4 sm:px-6">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/tests">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-gray-900">
              {isLoading ? "Loading..." : typedTest?.title}
            </h1>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => {
                const url = `${window.location.origin}/public-test/${testId}`;
                navigator.clipboard.writeText(url);
                toast({
                  title: "Public link copied",
                  description: "Public test link has been copied to clipboard",
                });
              }}
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              Share Public Link
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsInviteDialogOpen(true)}
            >
              <Users className="h-4 w-4 mr-1.5" />
              Invite Candidate
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsBulkInviteDialogOpen(true)}
            >
              <Users className="h-4 w-4 mr-1.5" />
              Bulk Invite
            </Button>
            <Button asChild>
              <Link href={`/tests/${testId}/edit`}>
                <Edit className="h-4 w-4 mr-1.5" />
                Edit Test
              </Link>
            </Button>
          </div>
        </header>
        
        {/* View test content */}
        <main className="app-scroll flex-1 min-h-0 bg-gray-50 pt-14 lg:pt-0">
          <div className="py-4 px-3 sm:py-6 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="text-center py-10">
                <p>Loading test details...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4 lg:hidden min-w-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                    <Link href="/tests">
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <h1 className="text-base font-semibold text-gray-900 truncate">{typedTest?.title}</h1>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
                  <Card className="md:col-span-2">
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="text-sm sm:text-lg">Test Information</CardTitle>
                      {typedTest.description && (
                        <CardDescription className="text-xs sm:text-sm">
                          {typedTest.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                      <dl className="divide-y divide-gray-200">
                        <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2">
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 flex items-center">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                            Duration
                          </dt>
                          <dd className="text-xs sm:text-sm text-gray-900 col-span-2">
                            {formatDuration(typedTest.duration)}
                          </dd>
                        </div>
                        <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2">
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 flex items-center">
                            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                            Passing
                          </dt>
                          <dd className="text-xs sm:text-sm text-gray-900 col-span-2">
                            {typedTest.passingScore}%
                          </dd>
                        </div>
                        <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2">
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 flex items-center">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                            Created
                          </dt>
                          <dd className="text-xs sm:text-sm text-gray-900 col-span-2">
                            {formatDate(typedTest.createdAt)}
                          </dd>
                        </div>
                        <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2">
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 flex items-center">
                            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                            Questions
                          </dt>
                          <dd className="text-xs sm:text-sm text-gray-900 col-span-2">
                            {typedTest.questions?.length || 0} questions
                          </dd>
                        </div>
                      </dl>
                      
                      <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs sm:h-9 sm:text-sm"
                          onClick={() => {
                            const url = `${window.location.origin}/public-test/${testId}`;
                            navigator.clipboard.writeText(url);
                            toast({
                              title: "Public link copied",
                              description: "Public test link has been copied to clipboard",
                            });
                          }}
                        >
                          <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                          Share
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs sm:h-9 sm:text-sm"
                          onClick={() => setIsInviteDialogOpen(true)}
                        >
                          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                          Invite
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs sm:h-9 sm:text-sm"
                          onClick={() => setIsBulkInviteDialogOpen(true)}
                        >
                          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                          Bulk Invite
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs sm:h-9 sm:text-sm"
                          asChild
                        >
                          <Link href={`/tests/${testId}/edit`}>
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Test Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                              <Users className="h-5 w-5" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Total Candidates</p>
                              <p className="text-lg font-semibold text-gray-900">{typedTest.stats?.total || 0}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Completed</p>
                              <p className="text-lg font-semibold text-gray-900">{typedTest.stats?.completed || 0}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                              <Clock className="h-5 w-5" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">In Progress</p>
                              <p className="text-lg font-semibold text-gray-900">{typedTest.stats?.inProgress || 0}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                              <Users className="h-5 w-5" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Average Score</p>
                              <p className="text-lg font-semibold text-gray-900">{typedTest.stats?.avgScore || 0}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-sm sm:text-lg">Candidates</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                    <Tabs defaultValue="all">
                      <TabsList className="mb-3 sm:mb-4 w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-auto sm:h-9 p-1 gap-1">
                        <TabsTrigger value="all" className="text-xs sm:text-sm h-8">All</TabsTrigger>
                        <TabsTrigger value="completed" className="text-xs sm:text-sm h-8">Completed</TabsTrigger>
                        <TabsTrigger value="in-progress" className="text-xs sm:text-sm h-8">In Progress</TabsTrigger>
                        <TabsTrigger value="pending" className="text-xs sm:text-sm h-8">Pending</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="all" className="mt-0">
                        {candidatesLoading ? (
                          <div className="text-center py-6 text-sm text-muted-foreground">
                            Loading candidates...
                          </div>
                        ) : typedCandidates && typedCandidates.length > 0 ? (
                          <>
                            {/* Mobile cards */}
                            <ul className="md:hidden divide-y divide-border -mx-3 border-t">
                              {typedCandidates.map((candidate: any) => (
                                <li key={candidate.id} className="px-3 py-3 space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">{candidate.name}</p>
                                      <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>
                                    </div>
                                    <Badge
                                      variant={
                                        candidate.status === "completed"
                                          ? "success"
                                          : candidate.status === "in_progress"
                                          ? "secondary"
                                          : "outline"
                                      }
                                      className="text-[10px] px-1.5 py-0 h-5 shrink-0"
                                    >
                                      {candidate.status === "pending"
                                        ? "Pending"
                                        : candidate.status === "in_progress"
                                        ? "In Progress"
                                        : "Completed"}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-[11px] text-muted-foreground">
                                      {candidate.score !== undefined ? `Score ${candidate.score}% · ` : ""}
                                      {candidate.invitedAt
                                        ? new Date(candidate.invitedAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : ""}
                                    </p>
                                    <div className="flex">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => copyTestLink(candidate.testLink)}
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600"
                                        onClick={() => handleDeleteCandidate(candidate.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                            <div className="hidden md:block overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Invited</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {typedCandidates.map((candidate: any) => (
                                <TableRow key={candidate.id}>
                                  <TableCell>{candidate.name}</TableCell>
                                  <TableCell>{candidate.email}</TableCell>
                                  <TableCell>{candidate.phone || "-"}</TableCell>
                                  <TableCell>{candidate.ipAddress ?? candidate.ip_address ?? "-"}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        candidate.status === "completed"
                                          ? "success"
                                          : candidate.status === "in_progress"
                                          ? "secondary"
                                          : "outline"
                                      }
                                    >
                                      {candidate.status === "pending"
                                        ? "Pending"
                                        : candidate.status === "in_progress"
                                        ? "In Progress"
                                        : "Completed"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{candidate.invitedAt ? formatDate(candidate.invitedAt) : "-"}</TableCell>
                                  <TableCell>{candidate.score !== undefined ? `${candidate.score}%` : "-"}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyTestLink(candidate.testLink)}
                                      >
                                        <Copy className="h-4 w-4" />
                                        <span className="sr-only">Copy link</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteCandidate(candidate.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete candidate</span>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-6 text-sm text-muted-foreground">
                            No candidates found.
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="completed" className="mt-0">
                        {candidatesLoading ? (
                          <div className="text-center py-6 text-sm text-muted-foreground">
                            Loading candidates...
                          </div>
                        ) : typedCandidates?.filter((c: any) => c.status === "completed").length > 0 ? (
                          <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                                <TableHead>Completed</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead className="hidden md:table-cell">Time Taken</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {typedCandidates.filter((c: any) => c.status === "completed").map((candidate: any) => (
                                <TableRow key={candidate.id}>
                                  <TableCell>{candidate.name}</TableCell>
                                  <TableCell>{candidate.email}</TableCell>
                                  <TableCell className="hidden sm:table-cell">{candidate.phone || "-"}</TableCell>
                                  <TableCell className="text-xs whitespace-nowrap">{candidate.completedAt ? new Date(candidate.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        candidate.score >= (typedTest.passingScore || 70)
                                          ? "success"
                                          : "destructive"
                                      }
                                    >
                                      {candidate.score}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    {candidate.startedAt && candidate.completedAt
                                      ? formatDuration(
                                          Math.round(
                                            (new Date(candidate.completedAt).getTime() -
                                              new Date(candidate.startedAt).getTime()) /
                                              60000
                                          )
                                        )
                                      : "N/A"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-sm text-muted-foreground">
                            No candidates have completed the test yet.
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="in-progress" className="mt-0">
                        {candidatesLoading ? (
                          <div className="text-center py-6 text-sm text-muted-foreground">
                            Loading candidates...
                          </div>
                        ) : typedCandidates?.filter((c: any) => c.status === "in_progress").length > 0 ? (
                          <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                                <TableHead>Started</TableHead>
                                <TableHead className="hidden md:table-cell">Elapsed</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {typedCandidates.filter((c: any) => c.status === "in_progress").map((candidate: any) => (
                                <TableRow key={candidate.id}>
                                  <TableCell>{candidate.name}</TableCell>
                                  <TableCell>{candidate.email}</TableCell>
                                  <TableCell className="hidden sm:table-cell">{candidate.phone || "-"}</TableCell>
                                  <TableCell className="text-xs whitespace-nowrap">{candidate.startedAt ? new Date(candidate.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    {candidate.startedAt
                                      ? formatDuration(
                                          Math.round(
                                            (new Date().getTime() -
                                              new Date(candidate.startedAt).getTime()) /
                                              60000
                                          )
                                        )
                                      : "N/A"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyTestLink(candidate.testLink)}
                                      >
                                        <Copy className="h-4 w-4" />
                                        <span className="sr-only">Copy link</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteCandidate(candidate.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete candidate</span>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-sm text-muted-foreground">
                            No candidates are currently taking the test.
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="pending" className="mt-0">
                        {candidatesLoading ? (
                          <div className="text-center py-6 text-sm text-muted-foreground">
                            Loading candidates...
                          </div>
                        ) : typedCandidates?.filter((c: any) => c.status === "pending").length > 0 ? (
                          <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                                <TableHead>Invited</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {typedCandidates.filter((c: any) => c.status === "pending").map((candidate: any) => (
                                <TableRow key={candidate.id}>
                                  <TableCell>{candidate.name}</TableCell>
                                  <TableCell>{candidate.email}</TableCell>
                                  <TableCell className="hidden sm:table-cell">{candidate.phone || "-"}</TableCell>
                                  <TableCell className="text-xs whitespace-nowrap">{new Date(candidate.invitedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => copyTestLink(candidate.testLink)}
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                        <span className="sr-only">Copy link</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          window.open(`mailto:${candidate.email}?subject=Invitation to take a coding test&body=Please take the test at ${window.location.origin}/take-test/${candidate.testLink}`, "_blank");
                                        }}
                                      >
                                        <Mail className="h-3.5 w-3.5" />
                                        <span className="sr-only">Send email</span>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-sm text-muted-foreground">
                            No pending invitations.
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
      
      {/* Invite Candidate Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-md p-4 sm:p-6 rounded-xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Invite Candidate</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Send a test invitation for "{typedTest?.title}".
            </DialogDescription>
          </DialogHeader>
          
          <Form {...inviteForm}>
            <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-3.5 sm:space-y-4">
              <FormField
                control={inviteForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[13px] sm:text-sm">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" className="h-10 text-[15px] sm:text-sm" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[13px] sm:text-sm">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" className="h-10 text-[15px] sm:text-sm" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={inviteForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[13px] sm:text-sm">Phone Number</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">+91</span>
                        <Input 
                          type="tel" 
                          inputMode="numeric"
                          placeholder="9876543210" 
                          className="rounded-l-none h-10 text-[15px] sm:text-sm" 
                          maxLength={10}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-[11px] sm:text-sm">10-digit mobile number</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-2 gap-2 flex-col-reverse sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 sm:h-9"
                  onClick={() => setIsInviteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="h-10 sm:h-9"
                  disabled={inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? "Inviting..." : "Invite Candidate"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Invite Dialog */}
      <Dialog open={isBulkInviteDialogOpen} onOpenChange={setIsBulkInviteDialogOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-2xl p-4 sm:p-6 rounded-xl max-h-[92dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Bulk Invite Candidates</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Upload Excel with columns: "Candidate Name", "Phone Number", "Email ID".
            </DialogDescription>
          </DialogHeader>
          <BulkInvite 
            onSuccess={() => {
              setIsBulkInviteDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/candidates`] });
            }} 
            testId={testId}
          />
          <DialogFooter>
            <Button variant="outline" className="h-10 sm:h-9" onClick={() => setIsBulkInviteDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
