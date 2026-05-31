"use client";

// Resources management — LIVE Supabase data. Lists every resource (published or
// not) and offers an "Add resource" form backed by createResourceAction. A
// resource is EITHER an external link or an uploaded file. On success we
// router.refresh() to pull fresh server data; failures surface inline.
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ExternalLink, FileText } from "lucide-react";
import { Button, Card, Field, Input, Textarea, Select, Tag } from "@/components/ui";
import { createResourceAction, deleteResourceAction } from "@/app/actions";
import type { Resource } from "@/lib/data/resources";

interface AdminResourcesProps {
  resources: Resource[];
}

const CATEGORY_OPTIONS = ["Hiring Playbooks", "Role Profiles", "Market Data", "Templates"] as const;
type SourceMode = "link" | "file";

export default function AdminResources({ resources }: AdminResourcesProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [sourceMode, setSourceMode] = useState<SourceMode>("link");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setCategory("");
    setType("");
    setDescription("");
    setSourceMode("link");
    setExternalUrl("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit() {
    if (!title.trim() || submitting) return;
    if (sourceMode === "link" && !externalUrl.trim()) {
      setError("Provide a link, or switch to File and choose a file.");
      return;
    }
    if (sourceMode === "file" && !file) {
      setError("Choose a file, or switch to Link and provide a URL.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    if (category.trim()) formData.append("category", category.trim());
    if (type.trim()) formData.append("type", type.trim());
    if (description.trim()) formData.append("description", description.trim());
    if (sourceMode === "link") {
      formData.append("externalUrl", externalUrl.trim());
    } else if (file) {
      formData.append("file", file);
    }

    try {
      const res = await createResourceAction(formData);
      if (!res.ok) {
        setError(res.error ?? "Couldn't add that resource.");
        return;
      }
      resetForm();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't add that resource.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await deleteResourceAction(id);
      if (!res.ok) {
        setError(res.error ?? "Couldn't delete that resource.");
        return;
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't delete that resource.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="font-display text-3xl">Resources</h2>
        <div className="text-xs text-stone-500 mt-1">{resources.length} total.</div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button className="underline ml-3" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3 flex items-center gap-1">
          <Plus size={12} /> Add resource
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="How to Write a JD That Filters" />
          </Field>
          <Field label="Category">
            <Select
              value={category}
              onChange={setCategory}
              options={[{ value: "", label: "— Select or leave blank —" }, ...CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))]}
            />
          </Field>
          <Field label="Type">
            <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="article / download" />
          </Field>
          <Field label="Source">
            <div className="flex gap-2">
              <Button variant={sourceMode === "link" ? "primary" : "secondary"} size="sm" onClick={() => setSourceMode("link")}>Link</Button>
              <Button variant={sourceMode === "file" ? "primary" : "secondary"} size="sm" onClick={() => setSourceMode("file")}>File</Button>
            </div>
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="A short summary of what this resource covers." />
          </Field>
        </div>
        <div className="mt-3">
          {sourceMode === "link" ? (
            <Field label="External URL" required hint="A link to an article, doc, or download.">
              <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://…" type="url" />
            </Field>
          ) : (
            <Field label="File" required hint="Uploaded to private storage; served via signed URLs.">
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-stone-200"
              />
            </Field>
          )}
        </div>
        <div className="flex justify-end mt-3">
          <Button icon={Plus} onClick={submit} disabled={!title.trim() || submitting}>
            {submitting ? "Adding…" : "Add resource"}
          </Button>
        </div>
      </Card>

      <Card padded={false}>
        {resources.length === 0 && (
          <div className="p-8 text-center text-sm text-stone-500">No resources yet. Add one above.</div>
        )}
        {resources.map((r) => (
          <div key={r.id} className="border-b border-stone-200 last:border-b-0 p-4 flex items-center gap-3 flex-wrap">
            <div className="h-9 w-9 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 shrink-0">
              {r.externalUrl ? <ExternalLink size={16} /> : <FileText size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{r.title}</div>
              <div className="text-xs text-stone-500">{r.category ?? "Uncategorized"}</div>
            </div>
            <Tag color={r.published ? "green" : "default"}>{r.published ? "Published" : "Draft"}</Tag>
            <Button variant="danger" size="sm" icon={Trash2} onClick={() => remove(r.id)} disabled={deletingId === r.id}>
              {deletingId === r.id ? "Deleting…" : "Delete"}
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
