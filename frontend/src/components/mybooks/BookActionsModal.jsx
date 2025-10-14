import React, { useState } from "react";
import { Trash } from "lucide-react";
import axios from "axios";

export default function BookActionsModal({ book, onClose, onUpdate }) {
  const [available, setAvailable] = useState(book.available);

  const toggleAvailable = async () => {
    const updated = { ...book, available: !available };
    try {
      await axios.put(`http://localhost:1337/api/books/${book.id}`, updated);
      setAvailable(!available);
      onUpdate(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const removeBook = async () => {
    try {
      await axios.delete(`http://localhost:1337/api/books/${book.id}`);
      onUpdate(null); // remove from list
    } catch (err) {
      console.error(err);
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
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={available}
                  onChange={toggleAvailable}
                />{" "}
                Available
              </label>
            </div>
            <button className="btn btn-danger d-flex align-items-center" onClick={removeBook}>
              <Trash size={18} className="me-2" /> Remove Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
