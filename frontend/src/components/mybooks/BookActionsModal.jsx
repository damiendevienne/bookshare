import React, { useRef, useState } from "react";
import { Trash } from "lucide-react";
import api, { mediaUrl } from "../../api";

export default function BookActionsModal({ book, onClose, onUpdate }) {
  const [available, setAvailable] = useState(book.available);
  const isLended = book.lended === true;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(book.title || "");
  const [author, setAuthor] = useState(book.author || "");
  const [description, setDescription] = useState(typeof book.description === "string" ? book.description : "");
  const [age, setAge] = useState(book.age || "adults");
  const [images, setImages] = useState(book.imageRecords || []);
  const [showImageChoices, setShowImageChoices] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const bookIdentifier = book.documentId || book.id;
  const imported = book.catalogSource === "openlibrary";

  const toggleAvailable = async () => {
    setError("");
    setSaving(true);
    try {
      const nextAvailable = !available;
      const response = await api.put(`/api/books/${bookIdentifier}`, { data: { available: nextAvailable } });
      const updated = { ...book, ...(response.data.data || {}), available: nextAvailable };
      setAvailable(nextAvailable);
      onUpdate(updated);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Unable to update availability.");
    } finally {
      setSaving(false);
    }
  };

  const saveDetails = async (event) => {
    event.preventDefault();
    if (!title.trim() || !author.trim()) { setError("Title and author are required."); return; }
    setError(""); setSaving(true);
    try {
      const newFiles = images.filter((image) => image instanceof File);
      if (newFiles.some((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) throw new Error("Each image must be an image file smaller than 5 MB.");
      let imageIds = images.filter((image) => image.id).map((image) => image.id);
      if (newFiles.length) { const formData = new FormData(); newFiles.forEach((file) => formData.append("files", file)); const upload = await api.post("/api/upload", formData); imageIds = [...imageIds, ...upload.data.map((item) => item.id)]; }
      const response = await api.put(`/api/books/${bookIdentifier}`, { data: { title: imported ? book.title : title.trim(), author: imported ? book.author : author.trim(), description: description.trim() ? [{ type: "paragraph", children: [{ type: "text", text: description.trim() }] }] : null, age, ...(imported ? {} : { image: imageIds }) } });
      onUpdate({ ...book, ...(response.data.data || {}), title, author, description, age, imageRecords: images });
    } catch (err) { setError(err.response?.data?.error?.message || err.message || "Unable to save book details."); }
    finally { setSaving(false); }
  };
  const removeImage = (index) => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  const addImage = () => {
    if (images.length >= 2) return;
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) setShowImageChoices(true);
    else galleryInputRef.current?.click();
  };
  const handleImageSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setError("Each image must be an image file smaller than 5 MB."); return; }
    if (images.length < 2) setImages((current) => [...current, file]);
    setShowImageChoices(false); event.target.value = "";
  };

  const removeBook = async () => {
    setError("");
    setConversationId(null);
    setSaving(true);
    try {
      await api.delete(`/api/books/${bookIdentifier}`);
      onUpdate(null); // remove from list
    } catch (err) {
      setError(err.response?.data?.error?.message || "Unable to remove this book.");
      setConversationId(err.response?.data?.error?.details?.conversationId || null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
      onClick={onClose}
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{book.title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form className="modal-body d-flex flex-column gap-3" onSubmit={saveDetails}>
            {error && <div className="alert alert-danger mb-0">{error}</div>}
            {conversationId && (
              <a className="btn btn-outline-primary" href={`#conversation/${conversationId}`} onClick={onClose}>
                Open the discussion with the borrower
              </a>
            )}
            <div>
              <h6>Book details</h6>
              {imported && <div className="alert alert-info py-2 small">Bibliographic information and the cover are locked because this book was imported from Open Library.</div>}
              <label className="form-label">Title</label><input className="form-control mb-2" value={title} onChange={(event) => setTitle(event.target.value)} disabled={imported} required />
              <label className="form-label">Author</label><input className="form-control mb-2" value={author} onChange={(event) => setAuthor(event.target.value)} disabled={imported} required />
              <label className="form-label">Audience</label><select className="form-select mb-2" value={age} onChange={(event) => setAge(event.target.value)}><option value="kids">Kids (0–10)</option><option value="teenagers">Teenagers (11–15)</option><option value="adults">Adults (16+)</option></select>
              <label className="form-label">Comment</label><textarea className="form-control mb-2" rows="3" value={description} onChange={(event) => setDescription(event.target.value)} />
              {!imported && <><label className="form-label">Cover images</label><input ref={galleryInputRef} className="visually-hidden" type="file" accept="image/*" onChange={handleImageSelection} /><input ref={cameraInputRef} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={handleImageSelection} /><div className="cover-picker-row">{images.map((image, index) => <div className="cover-picker-image" key={image.id || `${image.name}-${image.lastModified}`}><img src={image instanceof File ? URL.createObjectURL(image) : mediaUrl(image.formats?.small?.url || image.formats?.thumbnail?.url || image.url)} alt={`Book cover ${index + 1}`} /><button type="button" className="cover-picker-remove" onClick={() => removeImage(index)} aria-label="Remove image">×</button></div>)}{images.length < 2 && <button type="button" className="cover-picker-placeholder" onClick={addImage} aria-label="Add a cover image"><span>＋</span></button>}{images.length === 2 && <button type="button" className="btn btn-outline-secondary btn-sm align-self-center" onClick={() => setImages((current) => [current[1], current[0]])}>Change order</button>}</div>{showImageChoices && <div className="image-choice-backdrop" role="dialog" aria-modal="true" onClick={() => setShowImageChoices(false)}><div className="image-choice-modal" onClick={(event) => event.stopPropagation()}><h6>Add a cover image</h6><p className="text-muted small">Choose where to get the image.</p><button type="button" className="btn btn-primary w-100 mb-2" onClick={() => cameraInputRef.current?.click()}>Take a photo</button><button type="button" className="btn btn-outline-primary w-100 mb-2" onClick={() => galleryInputRef.current?.click()}>Choose from gallery</button><button type="button" className="btn btn-link btn-sm" onClick={() => setShowImageChoices(false)}>Cancel</button></div></div>}</>}
              <button type="submit" className="btn btn-primary btn-sm mt-3" disabled={saving}>{saving ? "Saving…" : "Save details"}</button>
            </div>
            <div>
              <div className="d-flex align-items-center justify-content-between gap-3">
                <span>Availability: <strong>{available ? "Available" : "Not available"}</strong></span>
                <button type="button" className={`btn btn-sm ${available ? "btn-outline-secondary" : "btn-success"}`} onClick={toggleAvailable} disabled={saving || (!available && isLended)} title={!available && isLended ? "Confirm the return before making this book available" : undefined}>
                  {available ? "Mark unavailable" : "Mark available"}
                </button>
              </div>
              {!available && isLended && (
                <small className="text-muted d-block mt-2">
                  This book is currently lent. It will become available after the return is confirmed.
                </small>
              )}
            </div>
            <button className="btn btn-danger d-flex align-items-center" onClick={() => setConfirmDelete(true)} disabled={saving}>
              <Trash size={18} className="me-2" /> Remove Book
            </button>
          </form>
        </div>
      </div>
      {confirmDelete && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.35)" }} onClick={() => setConfirmDelete(false)}>
          <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Remove this book?</h5>
                <button type="button" className="btn-close" onClick={() => setConfirmDelete(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">This action cannot be undone.</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Keep book</button>
                <button type="button" className="btn btn-danger" onClick={() => { setConfirmDelete(false); removeBook(); }} disabled={saving}>Remove book</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
