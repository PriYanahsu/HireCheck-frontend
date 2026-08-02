import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

interface Candidate {
  name: string;
  phone: string;
  email: string;
  rowNumber: number;
  error?: string;
}

interface BulkInviteProps {
  onSuccess?: () => void;
  testId: number;
}

export default function BulkInvite({ onSuccess, testId }: BulkInviteProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [invalidRows, setInvalidRows] = useState<Candidate[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const bulkInviteMutation = useMutation({
    mutationFn: async (data: { candidates: Candidate[] }) => {
      const res = await apiRequest("POST", "/api/candidates/bulk-invite", {
        ...data,
        testId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/candidates`] });
      onSuccess?.();
      toast({
        title: "Candidates invited successfully",
        description: "Invitation links have been generated",
      });
    },
    onError: () => {
      toast({
        title: "Failed to invite candidates",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headerRow = rows[0];
      const nameIdx = headerRow.findIndex(
        (h: string) => h && h.trim().toLowerCase() === "candidate name"
      );
      const phoneIdx = headerRow.findIndex(
        (h: string) => h && h.trim().toLowerCase() === "phone number"
      );
      const emailIdx = headerRow.findIndex(
        (h: string) => h && h.trim().toLowerCase() === "email id"
      );

      if (nameIdx === -1 || phoneIdx === -1 || emailIdx === -1) {
        toast({
          title: "Invalid file",
          description: 'Need columns: "Candidate Name", "Phone Number", "Email ID"',
          variant: "destructive",
        });
        return;
      }

      const valid: Candidate[] = [];
      const invalid: Candidate[] = [];

      rows.slice(1).forEach((row, i) => {
        const name = row[nameIdx]?.toString().trim() || "";
        const phone = row[phoneIdx]?.toString().trim().replace(/[^0-9]/g, "") || "";
        const email = row[emailIdx]?.toString().trim() || "";
        let error = "";

        if (!name || !phone || !email) {
          error = "Missing required field(s)";
        } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          error = "Invalid email";
        } else if (!/^[0-9]{10}$/.test(phone)) {
          error = "Phone must be 10 digits";
        }

        const candidate: Candidate = {
          name,
          phone: phone ? `+91${phone}` : "",
          email,
          rowNumber: i + 2,
          error,
        };
        if (error) invalid.push(candidate);
        else valid.push(candidate);
      });

      setCandidates(valid);
      setInvalidRows(invalid);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 sm:p-6 cursor-pointer hover:bg-muted/40 transition-colors">
        <Upload className="h-5 w-5 text-muted-foreground" />
        <span className="text-xs sm:text-sm text-muted-foreground text-center">
          {fileName ? fileName : "Tap to upload .xlsx / .xls"}
        </span>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>

      {candidates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              Valid · {candidates.length}
            </h3>
            <Button
              size="sm"
              className="h-8 text-xs sm:h-9 sm:text-sm"
              onClick={() => bulkInviteMutation.mutate({ candidates })}
              disabled={bulkInviteMutation.isPending}
            >
              {bulkInviteMutation.isPending ? "Sending..." : "Send Invites"}
            </Button>
          </div>
          <div className="overflow-auto max-h-48 sm:max-h-64 border rounded-lg">
            <ul className="divide-y divide-border sm:hidden">
              {candidates.map((c, i) => (
                <li key={i} className="px-3 py-2.5">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  <p className="text-[11px] text-muted-foreground">{c.phone}</p>
                </li>
              ))}
            </ul>
            <table className="hidden sm:table min-w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Phone</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {candidates.map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2">{c.phone}</td>
                    <td className="px-3 py-2">{c.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {invalidRows.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-destructive">
            Invalid · {invalidRows.length}
          </h3>
          <div className="overflow-auto max-h-40 sm:max-h-56 border rounded-lg">
            <ul className="divide-y divide-border sm:hidden">
              {invalidRows.map((c, i) => (
                <li key={i} className="px-3 py-2.5">
                  <p className="text-sm font-medium">
                    Row {c.rowNumber}: {c.name || "—"}
                  </p>
                  <p className="text-xs text-destructive">{c.error}</p>
                </li>
              ))}
            </ul>
            <table className="hidden sm:table min-w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Row</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invalidRows.map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{c.rowNumber}</td>
                    <td className="px-3 py-2">{c.name || "—"}</td>
                    <td className="px-3 py-2 text-destructive">{c.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
