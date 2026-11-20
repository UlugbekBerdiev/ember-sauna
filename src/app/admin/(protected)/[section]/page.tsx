import { notFound } from "next/navigation";

const sections: Record<string, { title: string; description: string }> = {
  calendar: {
    title: "Calendar",
    description: "The full availability and maintenance calendar will be added in a later operations phase.",
  },
  customers: {
    title: "Customers",
    description: "Customer search and booking history will be added in a later CRM phase.",
  },
  settings: {
    title: "Settings",
    description: "Pricing, delivery zones, policies, and integrations will be configurable here in a later phase.",
  },
};

export default async function AdminPlaceholderPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const content = sections[section];
  if (!content) notFound();
  return (
    <section className="admin-panel admin-placeholder">
      <p className="eyebrow">Admin workspace</p>
      <h1>{content.title}</h1>
      <p>{content.description}</p>
    </section>
  );
}
