import type { Metadata } from "next";
import { generateCMSMetadata, getCMSPage } from "@/components/shared/CMSPageRenderer";
import { ContactForm } from "@/components/marketing/ContactForm";
import { Mail, MessageSquare, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  return generateCMSMetadata("contact", "Contact Us | SEO Platform");
}

const contactDetails = [
  { icon: Mail, label: "Email Us", value: "hello@seoplatform.com", href: "mailto:hello@seoplatform.com" },
  { icon: MessageSquare, label: "Support", value: "support@seoplatform.com", href: "mailto:support@seoplatform.com" },
  { icon: Clock, label: "Response Time", value: "Within 24 hours", href: null },
  { icon: MapPin, label: "Location", value: "Remote-first, Global Team", href: null },
];

export default async function ContactPage() {
  const page = await getCMSPage("contact");

  return (
    <div className="py-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-600 to-indigo-600 text-white py-16 mb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{page?.title || "Contact Us"}</h1>
          <p className="text-sky-100 text-lg max-w-xl mx-auto">
            Have a question, feedback, or need help? We're here for you.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* CMS content if available */}
        {page?.content && (
          <div
            className="prose prose-lg dark:prose-invert max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Contact details */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Get in touch</h2>
            {contactDetails.map((item) => (
              <Card key={item.label}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
                    <item.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="font-medium text-sm hover:text-indigo-600 transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="font-medium text-sm">{item.value}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
