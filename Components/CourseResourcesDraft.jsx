"use client";
import { useRef, useState } from "react";
import { Input, Button } from "@/Components/FormControls";
export default function CourseResourcesDraft({
  courseId,
  resources,
  onChange,
  beforeUpload,
}) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(null);
  async function upload(file) {
    if (!file || busy) return;
    setRetry(file);
    setError("");
    if (file.type !== "application/pdf" || file.size > 25 * 1024 * 1024) {
      setError("Choose a PDF no larger than 25 MB.");
      return;
    }
    setBusy(true);
    try {
      if (!(await beforeUpload()))
        throw new Error("Save your draft successfully before uploading.");
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/admin/course-draft-resource");
        xhr.responseType = "json";
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onerror = () =>
          reject(
            new Error("The upload connection failed. Retry when connected."),
          );
        xhr.onload = () =>
          xhr.status === 200
            ? resolve(xhr.response)
            : reject(new Error(xhr.response?.error || "Upload failed."));
        const body = new FormData();
        body.set("file", file);
        body.set("courseId", courseId);
        xhr.send(body);
      });
      onChange([...resources, result]);
      setRetry(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <section
      className="cw-resources"
      aria-busy={busy}
      data-course-uploading={busy || undefined}
    >
      <h3>Downloadable resources</h3>
      <p>
        PDF documents ? up to 25 MB each. Uploads are private until you publish
        the course.
      </p>
      {resources.map((r, index) => (
        <div key={r.id} className="cw-resource">
          <label>
            Document title
            <Input
              value={r.title}
              onChange={(e) =>
                onChange(
                  resources.map((item) =>
                    item.id === r.id
                      ? { ...item, title: e.target.value }
                      : item,
                  ),
                )
              }
            />
          </label>
          <label>
            <Input
              type="checkbox"
              checked={r.allowDownload !== false}
              onChange={(e) =>
                onChange(
                  resources.map((item) =>
                    item.id === r.id
                      ? { ...item, allowDownload: e.target.checked }
                      : item,
                  ),
                )
              }
            />
            Allow download
          </label>
          <label>
            <Input
              type="checkbox"
              checked={Boolean(r.previewAllowed)}
              onChange={(e) =>
                onChange(
                  resources.map((item) =>
                    item.id === r.id
                      ? { ...item, previewAllowed: e.target.checked }
                      : item,
                  ),
                )
              }
            />
            Allow public preview
          </label>
          <a
            href={`/api/admin/course-draft-resource?courseId=${courseId}&key=${encodeURIComponent(r.storageKey)}`}
            target="_blank"
            rel="noreferrer"
          >
            Preview PDF
          </a>
          <Button
            variant="ghost"
            disabled={index === 0}
            onClick={() => {
              const next = [...resources];
              [next[index - 1], next[index]] = [next[index], next[index - 1]];
              onChange(next);
            }}
          >
            Move up
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (
                window.confirm("Remove this document from the working draft?")
              )
                onChange(resources.filter((item) => item.id !== r.id));
            }}
          >
            Remove
          </Button>
        </div>
      ))}
      <div
        className="upload-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files?.[0]);
        }}
      >
        <p>Drop a PDF here, or choose a file.</p>
        <Input
          ref={input}
          aria-label="Upload PDF"
          type="file"
          accept="application/pdf,.pdf"
          disabled={busy}
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </div>
      {busy && (
        <progress aria-label="PDF upload progress" max="100" value={progress} />
      )}
      <p aria-live="polite">{busy ? `Uploading ${progress}%` : error}</p>
      {error && retry && (
        <Button variant="secondary" onClick={() => upload(retry)}>
          Retry upload
        </Button>
      )}
    </section>
  );
}
