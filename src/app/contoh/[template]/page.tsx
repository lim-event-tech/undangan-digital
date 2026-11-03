import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/db";
import { canUseTemplate } from "@/lib/platform/templates";
import { contohView } from "@/templates/bersama/contoh";
import { isTemplateKey, templateInfo } from "@/templates/registry";
import { renderTemplate } from "@/templates/render";

export async function generateMetadata({
  params,
}: PageProps<"/contoh/[template]">): Promise<Metadata> {
  const { template } = await params;
  return {
    title: isTemplateKey(template) ? `Contoh ${templateInfo(template).label}` : "Contoh template",
    robots: { index: false, follow: false },
  };
}

export default async function ContohPage({ params }: PageProps<"/contoh/[template]">) {
  const { template } = await params;
  await connection();
  if (!isTemplateKey(template) || !(await canUseTemplate(db, template))) notFound();
  return renderTemplate(template, contohView(Date.now()));
}
