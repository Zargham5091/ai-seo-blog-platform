// app/(marketing)/layout.tsx
import {MarketingNavbar} from "@/components/marketing/MarketingNavbar";
import {MarketingFooter} from "@/components/marketing/MarketingFooter";
import {ChatWidget} from "@/components/marketing/ChatWidget";
import {SEIOBot} from "@/components/marketing/SEIOBot";

export default function MarketingLayout({children}: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <MarketingNavbar/>
            <main className="flex-1">{children}</main>
            <MarketingFooter/>
            {/* SEIO mascot — floats on all marketing pages, config from DB */}
            <SEIOBot/>

            {/* Floating support chatbot — visible on all marketing pages */}
            <ChatWidget/>
        </div>
    );
}

// import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
// import { MarketingFooter } from "@/components/marketing/MarketingFooter";
//
// export default function MarketingLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="flex min-h-screen flex-col">
//       <MarketingNavbar />
//       <main className="flex-1">{children}</main>
//       <MarketingFooter />
//     </div>
//   );
// }
