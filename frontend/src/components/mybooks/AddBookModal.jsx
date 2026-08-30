import React, { useState } from "react";
import api from "../../api";

const initialForm = { title: "", author: "", description: "", language: "FR", age: "adults", available: true };

export default function AddBookModal({ show, onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!show) return null;

  const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      let imageIds;
      if (image) {
        const files = new FormData();
        files.append("files", image);
        const upload = await api.post("/api/upload", files);
        imageIds = upload.data.map((item) => item.id);
      }

      const data = {
        title: form.title.trim(),
        author: form.author.trim(),
        language: form.language,
        age: form.age,
        available: form.available,
        ...(form.description.trim() && {
          description: [{ type: "paragraph", children: [{ type: "text", text: form.description.trim() }] }],
        }),
        ...(imageIds?.length && { image: imageIds }),
      };
      const response = await api.post("/api/books", { data });
      onCreated(response.data.data);
      setForm(initialForm);
      setImage(null);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || "Unable to add this book.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
        <form className="modal-content" onSubmit={submit}>
          <div className="modal-header">
            <h5 className="modal-title">Add a book</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
              <label className="form-label">Title *</label>
              <input className="form-control" required value={form.title} onChange={(event) => update("title", event.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">Author *</label>
              <input className="form-control" required value={form.author} onChange={(event) => update("author", event.target.value)} />
            </div>
            <div className="row g-2">
              <div className="col-6">
                <label className="form-label">Language</label>
                <select className="form-select" value={form.language} onChange={(event) => update("language", event.target.value)}>
                  <option value="FR">FR</option><option value="EN">EN</option><option value="GR">GR</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label">Audience</label>
                <select className="form-select" value={form.age} onChange={(event) => update("age", event.target.value)}>
                  <option value="kids">Kids</option><option value="adults">Adults</option>
                </select>
              </div>
            </div>
            <div className="mb-3 mt-3">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows="3" value={form.description} onChange={(event) => update("description", event.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">Cover image <span className="text-muted">(strongly recommended)</span></label>
              <input className="form-control" type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] || null)} />
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" checked={form.available} onChange={(event) => update("available", event.target.checked)} id="new-book-available" />
              <label className="form-check-label" htmlFor="new-book-available">Available for borrowing</label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Add book"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
