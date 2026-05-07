// ADDITION TO: app/api/site/dashboard/route.ts
//
// Add this GET query alongside the existing ones — no new file needed.
// Paste the formSubmissions query into the existing GET handler's Promise.all block.
//
// ─────────────────────────────────────────────────────────────────────────────
// In the existing GET handler, find:
//   const [productCount, orderStats, recentOrders] = await Promise.all([
//
// Replace with:
//   const [productCount, orderStats, recentOrders, recentSubmissions] = await Promise.all([
//
// And add this 4th query at the end of the array (before the closing ]);):
//   FormSubmissionModel.find({ userId })
//     .sort({ createdAt: -1 })
//     .limit(10)
//     .lean(),
//
// Then in the return payload, add:
//   submissions: recentSubmissions,
//   unreadCount: recentSubmissions.filter(s => !s.isRead).length,
//
// Also add the import at the top of the route file:
//   import FormSubmissionModel from '@/models/FormSubmission';
//
// ─────────────────────────────────────────────────────────────────────────────
//
// MARK AS READ endpoint — add to PATCH handler in dashboard route:
//
// if (action === 'mark_submission_read') {
//   const { submissionId } = body as { submissionId: string };
//   if (!submissionId) return NextResponse.json({ success: false, error: 'submissionId required' }, { status: 400 });
//   await FormSubmissionModel.findOneAndUpdate(
//     { _id: submissionId, userId: session.user.id },
//     { $set: { isRead: true } }
//   );
//   return NextResponse.json({ success: true });
// }
//
// ─────────────────────────────────────────────────────────────────────────────
// FORM SUBMISSIONS PANEL UI — add this component to site-dashboard-page.tsx
// Paste below the Orders section and above the closing of the page component.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

/**
 * FormSubmissionsPanel — standalone component to paste into site-dashboard-page.tsx
 *
 * USAGE in site-dashboard-page.tsx:
 * 1. Add submissions to DashboardData type:
 *      submissions?: Array<{
 *        _id: string;
 *        formType: string;
 *        fields: Record<string, string>;
 *        isRead: boolean;
 *        createdAt: string;
 *      }>;
 *      unreadCount?: number;
 *
 * 2. After the Orders section, add:
 *    <FormSubmissionsPanel
 *      submissions={data.submissions ?? []}
 *      onMarkRead={async (id) => {
 *        await fetch('/api/site/dashboard', {
 *          method: 'PATCH',
 *          headers: { 'Content-Type': 'application/json' },
 *          body: JSON.stringify({ action: 'mark_submission_read', submissionId: id }),
 *        });
 *        await fetchData();
 *      }}
 *    />
 */

import {useState} from 'react';
import {Mail, MailOpen, ChevronDown, ChevronUp} from 'lucide-react';

interface Submission {
    _id: string;
    formType: string;
    fields: Record<string, string>;
    isRead: boolean;
    createdAt: string;
}

interface FormSubmissionsPanelProps {
    submissions: Submission[];
    onMarkRead: (id: string) => Promise<void>;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export function FormSubmissionsPanel({submissions, onMarkRead}: FormSubmissionsPanelProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [markingId, setMarkingId] = useState<string | null>(null);

    if (submissions.length === 0) return null;

    const unread = submissions.filter(s => !s.isRead).length;

    async function handleMarkRead(id: string) {
        setMarkingId(id);
        try {
            await onMarkRead(id);
        } finally {
            setMarkingId(null);
        }
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold">Form Submissions</h2>
                {unread > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
            {unread} new
          </span>
                )}
            </div>
            <div className="bg-card border rounded-2xl overflow-hidden divide-y">
                {submissions.map(sub => (
                    <div key={sub._id}
                         className={`transition-colors ${!sub.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}>
                        <button
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30"
                            onClick={() => {
                                setExpandedId(expandedId === sub._id ? null : sub._id);
                                if (!sub.isRead) handleMarkRead(sub._id);
                            }}
                        >
                            {sub.isRead
                                ? <MailOpen className="h-4 w-4 text-muted-foreground shrink-0"/>
                                : <Mail className="h-4 w-4 text-indigo-600 shrink-0"/>
                            }
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className={`text-sm ${!sub.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                        {sub.fields.name ?? 'Anonymous'}
                                    </p>
                                    <span
                                        className="text-xs text-muted-foreground capitalize px-1.5 py-0.5 bg-muted rounded">
                    {sub.formType}
                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {sub.fields.email ?? ''}{sub.fields.message ? ` · ${sub.fields.message.slice(0, 60)}…` : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-muted-foreground">{formatDate(sub.createdAt)}</span>
                                {expandedId === sub._id
                                    ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground"/>
                                    : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground"/>
                                }
                            </div>
                        </button>

                        {expandedId === sub._id && (
                            <div className="px-4 pb-4 border-t bg-muted/20">
                                <div className="pt-3 space-y-2">
                                    {Object.entries(sub.fields).map(([k, v]) => (
                                        <div key={k} className="grid grid-cols-4 gap-2 text-sm">
                                            <span
                                                className="text-muted-foreground font-medium capitalize col-span-1">{k}</span>
                                            <span className="col-span-3 text-gray-900 break-words">{v}</span>
                                        </div>
                                    ))}
                                </div>
                                {!sub.isRead && markingId !== sub._id && (
                                    <button
                                        onClick={() => handleMarkRead(sub._id)}
                                        className="mt-3 text-xs text-indigo-600 hover:underline"
                                    >
                                        Mark as read
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}