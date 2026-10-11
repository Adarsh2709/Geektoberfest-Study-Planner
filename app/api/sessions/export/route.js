import { NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { sessionsQuerySchema } from "@/lib/validation";
import { getSessionsDetailed } from "@/lib/queries";

const FORMULA_PREFIXES = /^[=+\-@\t\r]/;

/**
 * Escapes a cell value per RFC 4180 and protects against CSV formula injection (OWASP).
 */
function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '""';
  }
  let str = String(value);
  // Neutralize spreadsheet formula injection
  if (FORMULA_PREFIXES.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(request) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorized();

    const url = new URL(request.url);
    const parsed = sessionsQuerySchema.safeParse({
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
      subjectId: url.searchParams.get("subjectId") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid query parameters" }, { status: 400 });
    }

    const { from, to, subjectId } = parsed.data;

    // Cross-field validation: from <= to
    if (from && to && from > to) {
      return NextResponse.json({ error: "From date must be before or equal to To date" }, { status: 400 });
    }

    const sessions = await getSessionsDetailed(String(user._id), { from, to, subjectId });

    const headers = [
      "Date",
      "Subject",
      "Topic",
      "Planned Minutes",
      "Actual Minutes",
      "Status",
    ];

    const rows = [headers.map(escapeCsvValue).join(",")];

    for (const session of sessions) {
      const row = [
        session.date || "",
        session.subjectName || "Unknown subject",
        session.topicName || "Unknown topic",
        session.plannedMinutes ?? 0,
        session.actualMinutes ?? 0,
        session.status || "",
      ];
      rows.push(row.map(escapeCsvValue).join(","));
    }

    // UTF-8 BOM for Microsoft Excel compatibility
    const BOM = "\uFEFF";
    const csvContent = BOM + rows.join("\r\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="study-history.csv"',
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Failed to export study sessions" }, { status: 500 });
  }
}
