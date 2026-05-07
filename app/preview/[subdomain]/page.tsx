import { notFound } from "next/navigation";

export default async function PreviewPage({
                                              params,
                                              searchParams,
                                          }: {
    params: { subdomain: string };
    searchParams: { slug?: string };
}) {
    const { subdomain } = params;
    const slug = searchParams.slug || "/";

    console.log("Preview page hit:", { subdomain, slug });

    try {
        const apiUrl = `http://localhost:3000/api/site/preview/${subdomain}?slug=${slug}`;
        console.log("Fetching from:", apiUrl);

        const res = await fetch(apiUrl, {
            cache: "no-store",

        });

        console.log("Response status:", res.status);

        if (!res.ok) {
            const text = await res.text();
            console.log("Error body:", text);
            notFound();
        }

        const html = await res.text();
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (error) {
        console.error("Preview error:", error);
        return <div>Error: {String(error)}</div>;
    }
}