import React, { useEffect, useRef, useState } from "react";
import api from "../../api";

const initialForm = { title: "", author: "", description: "", language: "FR", age: "adults", available: true, coverUrl: "", isbn: "", catalogSource: "", catalogId: "" };
const MAX_IMAGES = 2;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function AddBookModal({ show, onClose, onCreated, zoneSlug = "heraklion", zoneDocumentId }) {
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState([]);
  const [catalogSearching, setCatalogSearching] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [catalogBook, setCatalogBook] = useState(null);
  const [showImageChoices, setShowImageChoices] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (!show || manualMode || catalogQuery.trim().length < 2) { setCatalogResults([]); return undefined; }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setCatalogSearching(true); setCatalogError("");
      api.get(`/api/book-catalog/search?q=${encodeURIComponent(catalogQuery.trim())}`)
        .then((response) => { if (!cancelled) setCatalogResults(response.data.data || []); })
        .catch(() => { if (!cancelled) setCatalogError("Unable to search the book catalogue."); })
        .finally(() => { if (!cancelled) setCatalogSearching(false); });
    }, 350);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [show, manualMode, catalogQuery]);

  if (!show) return null;
  const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));
  const closeAndReset = () => { setForm(initialForm); setImages([]); setCatalogQuery(""); setCatalogResults([]); setCatalogBook(null); setManualMode(false); setShowImageChoices(false); setError(""); onClose(); };
  const selectCatalogBook = (book) => { setForm((previous) => ({ ...previous, title: book.title, author: book.author || "", description: book.description || "", language: book.language || previous.language, coverUrl: book.coverUrl || "", isbn: book.isbn || "", catalogSource: "openlibrary", catalogId: book.id || "" })); setCatalogBook(book); setCatalogQuery(""); setCatalogResults([]); };
  const submit = async (event) => {
    event.preventDefault(); setError(""); setSaving(true);
    try {
      let imageIds;
      if (images.length) { const files = new FormData(); images.forEach((file) => files.append("files", file)); const upload = await api.post("/api/upload", files); imageIds = upload.data.map((item) => item.id); }
      const zoneIdentifier = zoneDocumentId || zoneSlug;
      const data = { title: form.title.trim(), author: form.author.trim(), language: form.language, age: form.age, available: form.available, zone: { connect: [zoneIdentifier] }, ...(form.coverUrl && !images.length && { coverUrl: form.coverUrl }), ...(form.isbn && { isbn: form.isbn.trim() }), ...(form.catalogSource && { catalogSource: form.catalogSource }), ...(form.catalogId && { catalogId: form.catalogId }), ...(form.description.trim() && { description: [{ type: "paragraph", children: [{ type: "text", text: form.description.trim() }] }] }), ...(imageIds?.length && { image: imageIds }) };
      const response = await api.post("/api/books", { data }); onCreated(response.data.data); closeAndReset();
    } catch (err) { setError(err.response?.data?.error?.message || "Unable to add this book."); } finally { setSaving(false); }
  };
  const handleImagesChange = (event) => {
    const selected = Array.from(event.target.files || []).slice(0, 1);
    const combined = [...images, ...selected];
    if (combined.length > MAX_IMAGES) { setError(`You can add up to ${MAX_IMAGES} images per book.`); event.target.value = ""; return; }
    const invalid = selected.find((file) => !file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE);
    if (invalid) { setImages([]); setError(`Each image must be an image file smaller than 5 MB.`); event.target.value = ""; return; }
    setError(""); setImages(combined); setShowImageChoices(false); event.target.value = "";
  };
  const addImage = () => {
    if (images.length >= MAX_IMAGES) { setError(`You can add up to ${MAX_IMAGES} images per book.`); return; }
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) setShowImageChoices(true);
    else galleryInputRef.current?.click();
  };
  const removeImage = (index) => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  const swapImages = () => setImages((current) => current.length === 2 ? [current[1], current[0]] : current);
  const catalogSelected = !manualMode && !!catalogBook;
  return <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} onClick={closeAndReset}><div className="modal-dialog" onClick={(event) => event.stopPropagation()}><form className="modal-content" onSubmit={submit}>
    <div className="modal-header"><h5 className="modal-title">Share a book from your shelf</h5><button type="button" className="btn-close" onClick={closeAndReset} aria-label="Close" /></div>
    <div className="modal-body">{error && <div className="alert alert-danger">{error}</div>}
      {!manualMode ? <div className="mb-3"><label className="form-label">Find a book you own</label><input className="form-control" value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Search by title, author or ISBN…" autoFocus />{catalogSearching && <small className="text-muted">Searching…</small>}{catalogError && <small className="text-danger d-block">{catalogError}</small>}{!catalogSearching && !catalogError && catalogQuery.trim().length >= 2 && catalogResults.length === 0 && <div className="alert alert-light border py-2 mt-2 mb-0">No matching book found in the catalogue. You can add your copy manually.</div>}{catalogResults.length > 0 && <div className="list-group mt-2 catalog-results">{catalogResults.map((book) => <button type="button" className="list-group-item list-group-item-action d-flex align-items-center gap-2 text-start" key={book.id} onClick={() => selectCatalogBook(book)}>{book.coverUrl && <img src={book.coverUrl} alt="" style={{ width: 32, height: 44, objectFit: "cover" }} />}<span><strong>{book.title}</strong><small className="d-block text-muted">{book.author || "Unknown author"}{book.year ? ` · ${book.year}` : ""}</small></span></button>)}</div>}{catalogSelected && <div className="alert alert-success py-2 mt-2 mb-0">Book selected. Bibliographic details and cover are locked.</div>}<button type="button" className="btn btn-link btn-sm px-0 mt-2" onClick={() => { setManualMode(true); setCatalogBook(null); setCatalogQuery(""); setCatalogResults([]); }}>I can’t find this book — add my copy manually</button></div> : <div className="mb-3"><button type="button" className="btn btn-link btn-sm px-0" onClick={() => setManualMode(false)}>← Search the online catalogue instead</button></div>}
      {(manualMode || catalogBook) && <>
      <div className="mb-3"><label className="form-label">Title *</label><input className="form-control" required value={form.title} onChange={(event) => update("title", event.target.value)} disabled={catalogSelected} /></div>
      <div className="mb-3"><label className="form-label">Author *</label><input className="form-control" required value={form.author} onChange={(event) => update("author", event.target.value)} disabled={catalogSelected} /></div>
      <div className="row g-2"><div className="col-6"><label className="form-label">Language</label><select className="form-select" value={form.language} onChange={(event) => update("language", event.target.value)} disabled={catalogSelected}><option value="FR">FR</option><option value="EN">EN</option><option value="GR">GR</option></select></div><div className="col-6"><label className="form-label">Audience</label><select className="form-select" value={form.age} onChange={(event) => update("age", event.target.value)}><option value="kids">Kids (0–10)</option><option value="teenagers">Teenagers (11–15)</option><option value="adults">Adults (16+)</option></select></div></div>
      <div className="mb-3 mt-3"><label className="form-label">{catalogSelected ? "Summary" : "Comment"}</label><textarea className="form-control" rows="3" value={form.description} onChange={(event) => update("description", event.target.value)} disabled={catalogSelected} placeholder={catalogSelected ? "No summary available from Open Library." : "Add a note about your copy…"} /></div>
      {manualMode && <div className="mb-3"><label className="form-label">Cover images <span className="text-muted">(strongly recommended, up to 2 images, 5 MB each)</span></label><input ref={galleryInputRef} className="visually-hidden" type="file" accept="image/*" onChange={handleImagesChange} /><input ref={cameraInputRef} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={handleImagesChange} /><div className="cover-picker-row">{images.map((image, index) => <div className="cover-picker-image" key={`${image.name}-${image.lastModified}`}><img src={URL.createObjectURL(image)} alt={`Selected cover ${index + 1}`} /><button type="button" className="cover-picker-remove" onClick={() => removeImage(index)} aria-label="Remove image">×</button></div>)}{images.length < MAX_IMAGES && <button type="button" className="cover-picker-placeholder" onClick={addImage} aria-label="Add a cover image"><span>＋</span></button>}{images.length === 2 && <button type="button" className="btn btn-outline-secondary btn-sm align-self-center" onClick={swapImages}>Change order</button>}</div>{showImageChoices && <div className="image-choice-backdrop" role="dialog" aria-modal="true" aria-labelledby="image-choice-title" onClick={() => setShowImageChoices(false)}><div className="image-choice-modal" onClick={(event) => event.stopPropagation()}><h6 id="image-choice-title">Add a cover image</h6><p className="text-muted small mb-3">Choose where to get the image.</p><button type="button" className="btn btn-primary w-100 mb-2" onClick={() => cameraInputRef.current?.click()}>Take a photo</button><button type="button" className="btn btn-outline-primary w-100 mb-2" onClick={() => galleryInputRef.current?.click()}>Choose from gallery</button><button type="button" className="btn btn-link btn-sm" onClick={() => setShowImageChoices(false)}>Cancel</button></div></div>}<small className="text-muted d-block mt-1">Add up to two images, one at a time.</small></div>}
      {!manualMode && catalogBook?.coverUrl && <div className="mb-3"><small className="text-muted d-block">Catalogue cover</small><img src={catalogBook.coverUrl} alt={catalogBook.title} style={{ width: 70, height: 96, objectFit: "cover", borderRadius: "0.35rem" }} /></div>}
      <div className="form-check"><input className="form-check-input" type="checkbox" checked={form.available} onChange={(event) => update("available", event.target.checked)} id="new-book-available" /><label className="form-check-label" htmlFor="new-book-available">Available for borrowing</label></div>
      </>}
    </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeAndReset}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving || (!manualMode && !catalogBook)}>{saving ? "Saving…" : "Share this book"}</button></div>
  </form></div></div>;
}
