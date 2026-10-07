import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { getBlogBySlug, getAllBlogSlugs } from "@/data/blogs";

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = getBlogBySlug(slug);
  if (!blog) return { title: "Article Not Found" };

  return {
    title: `${blog.title} | Mohammed Habib Qureshi`,
    description: blog.summary,
    openGraph: {
      title: blog.title,
      description: blog.summary,
      type: "article",
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = getBlogBySlug(slug);

  if (!blog) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        Article not found.
      </div>
    );
  }

  const publishedDate = "Recently";

  return (
    <div className="max-w-3xl mx-auto space-y-8 min-h-[calc(100vh-12rem)]">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Link href="/blogs" className="hover:text-foreground">
          Blogs
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{blog.title}</span>
      </div>

      <div className="space-y-4 border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl leading-tight">
          {blog.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{publishedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{blog.reading_time} min read</span>
          </div>
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-muted-foreground space-y-6">
        <ReactMarkdown
          components={{
            h3: ({ ...props }) => (
              <h3 className="text-lg font-bold text-foreground mt-6 mb-2" {...props} />
            ),
            pre: ({ ...props }) => (
              <pre
                className="p-4 bg-muted rounded-xl text-xs overflow-x-auto border border-border my-4 text-foreground font-mono"
                {...props}
              />
            ),
            code: ({ ...props }) => (
              <code
                className="px-1 py-0.5 bg-muted/65 rounded text-xs font-mono text-primary font-semibold"
                {...props}
              />
            ),
            p: ({ ...props }) => <p className="text-sm my-3" {...props} />,
            ul: ({ ...props }) => (
              <ul className="list-disc pl-5 my-2 space-y-1" {...props} />
            ),
            li: ({ ...props }) => <li className="text-xs" {...props} />,
          }}
        >
          {blog.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
