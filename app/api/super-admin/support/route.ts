import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import SupportTicketModel from "@/models/SupportTicket";
import {sendSupportReplyEmail} from "@/services/email";

// GET /api/super-admin/support?status=pending_admin
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin") {
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        }

        const {searchParams} = new URL(req.url);
        const status = searchParams.get("status") ?? "pending_admin";
        const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

        await connectDB();

        const query = status === "all" ? {} : {status};
        const tickets = await SupportTicketModel.find(query)
            .sort({updatedAt: -1})
            .limit(limit)
            .populate("userId", "name email plan")
            .lean();

        const pendingCount = await SupportTicketModel.countDocuments({status: "pending_admin"});

        return NextResponse.json({success: true, data: tickets, pendingCount});
    } catch (error) {
        console.error("[SUPPORT_ADMIN_GET]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// PATCH /api/super-admin/support — reply to a ticket
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin") {
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        }

        const {ticketId, reply, status} = await req.json() as {
            ticketId: string;
            reply?: string;
            status?: string;
        };

        if (!ticketId) return NextResponse.json({success: false, error: "ticketId required"}, {status: 400});

        await connectDB();

        const ticket = await SupportTicketModel.findById(ticketId);
        if (!ticket) return NextResponse.json({success: false, error: "Ticket not found"}, {status: 404});

        if (reply) {
            ticket.adminReply = reply;
            ticket.adminRepliedAt = new Date();
            ticket.adminRepliedBy = session.user.id as unknown as typeof ticket.adminRepliedBy;
            ticket.status = "replied";

            // Add admin reply as assistant message in conversation
            ticket.messages.push({
                role: "assistant",
                content: `**Support Team Reply:** ${reply}`,
                createdAt: new Date(),
            });

            // Send email notification if visitor provided email
            if (ticket.visitorEmail) {
                sendSupportReplyEmail(ticket.visitorEmail, reply).catch(console.error)
            }

        }

        if (status) ticket.status = status as typeof ticket.status;

        await ticket.save();
        return NextResponse.json({success: true, message: "Ticket updated"});
    } catch (error) {
        console.error("[SUPPORT_ADMIN_PATCH]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}