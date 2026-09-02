import React from "react";
import { Pencil } from "lucide-react";
import { mediaUrl } from "../../api";

function loanTiming(value) {
  if (!value) return "";
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return "";
  const days = Math.max(1, Math.ceil((Date.now() - start.getTime()) / 86400000));
  return `since ${start.toLocaleDateString("en-GB")} (${days} day${days === 1 ? "" : "s"})`;
}

export default function BookRow({ book, onEdit }) {
  return (
    <div className="my-book-row">
      <img className="my-book-cover" src={book.image ? mediaUrl(book.image) : book.coverUrl || "/images/open-book.png"} alt="" />
      <div className="my-book-identity">
        <strong>{book.title}</strong>
        <span>{book.author}</span>
      </div>
      <div className="my-book-status">
        {book.lended
          ? <><span className={`badge loan-context-badge loan-context-${book.loanReceived ? "active" : "accepted"}`}>{book.loanReceived ? <>Lent to {book.lendedTo || "another member"}</> : <>Awaiting pickup<br />from {book.lendedTo || "another member"}</>}</span>{loanTiming(book.loanStartedAt) && <small className="my-book-loan-timing">{loanTiming(book.loanStartedAt)}</small>}</>
          : book.pendingRequests?.length
            ? <><span className="badge loan-context-badge loan-context-requested">{book.pendingRequests.length === 1 ? <>Pending request<br />from {book.pendingRequests[0].borrower}</> : <>{book.pendingRequests.length} pending<br />requests</>}</span>{loanTiming(book.pendingRequests[0]?.startedAt) && <small className="my-book-loan-timing">{loanTiming(book.pendingRequests[0].startedAt)}</small>}</>
          : <span className={`badge ${book.available ? "bg-success" : "bg-secondary"}`}>{book.available ? "Available" : "Not available"}</span>}
      </div>
      <button type="button" className="my-book-edit" onClick={onEdit} aria-label={`Manage ${book.title}`} title="Manage this book"><Pencil size={18} /></button>
    </div>
  );
}
