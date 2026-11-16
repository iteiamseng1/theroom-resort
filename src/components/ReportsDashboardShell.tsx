"use client";

import { useState } from "react";
import { AuditLogClient, type AuditLogEntry } from "./AuditLogClient";
import { ReportsFilterBar } from "./ReportsFilterBar";

export function ReportsDashboardShell({
  initialFrom,
  initialTo,
  auditLogs,
  children,
}: {
  initialFrom: string;
  initialTo: string;
  auditLogs: AuditLogEntry[];
  children: React.ReactNode;
}) {
  const [showAudit, setShowAudit] = useState(false);

  return (
    <div className="space-y-6">
      <ReportsFilterBar
        initialFrom={initialFrom}
        initialTo={initialTo}
        auditCount={auditLogs.length}
        showAudit={showAudit}
        onToggleAudit={() => setShowAudit((prev) => !prev)}
      />

      {showAudit ? (
        <AuditLogClient
          initialLogs={auditLogs}
          initialFrom={initialFrom}
          initialTo={initialTo}
          embedded
          onBackToReport={() => setShowAudit(false)}
        />
      ) : (
        children
      )}
    </div>
  );
}
