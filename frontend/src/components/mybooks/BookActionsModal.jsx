import React, { useState } from "react";
import { Trash } from "lucide-react";
import api from "../../api";

export default function BookActionsModal({ book, onClose, onUpdate }) {
  const [available, setAvailable] = useState(book.available);
  const isLended = book.lended === true;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [saving, setSaving] = useState(false);
  const bookIdentifier = book.documentId || book.id;

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
          <div className="modal-body d-flex flex-column gap-3">
            {error && <div className="alert alert-danger mb-0">{error}</div>}
            {conversationId && (
              <a className="btn btn-outline-primary" href={`#conversation/${conversationId}`} onClick={onClose}>
                Open the discussion with the borrower
              </a>
            )}
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
          </div>
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
