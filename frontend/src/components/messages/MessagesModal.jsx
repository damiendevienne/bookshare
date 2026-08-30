import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import api, { mediaUrl } from "../../api";

function otherParticipant(conversation, userId) {
  return conversation.participantOne?.id === userId
    ? conversation.participantTwo
    : conversation.participantOne;
}

function conversationBook(conversation) {
  return conversation.loans?.find((loan) => loan.book)?.book || null;
}

function bookImage(book) {
  const image = book?.image?.[0];
  return image ? mediaUrl(image.url || image.attributes?.url) : "/images/open-book.png";
}

function loanStateSignature(conversation) {
  return JSON.stringify((conversation.loans || []).map((loan) => ({
    id: loan.documentId || loan.id,
    status: loan.status,
    borrowerReceivedAt: loan.borrowerReceivedAt,
    lenderLentAt: loan.lenderLentAt,
    borrowerReturnedAt: loan.borrowerReturnedAt,
    lenderReceivedBackAt: loan.lenderReceivedBackAt,
  })));
}

function loanContext(conversation, userId) {
  const loan = conversation.loans?.find((item) => item.status === "requested" || item.status === "active") || conversation.loans?.[0];
  if (!loan) return { label: "Discussion", tone: "neutral" };
  const other = otherParticipant(conversation, userId)?.username || "User";
  if (loan.status === "requested") {
    return { label: loan.lender?.id === userId ? `Borrow request from ${other}` : `Borrow request to ${other}`, tone: "requested" };
  }
  if (loan.status === "active") {
    if (!loan.borrowerReceivedAt) {
      return { label: loan.lender?.id === userId ? `Awaiting pickup from ${other}` : `Pickup pending from ${other}`, tone: "accepted" };
    }
    return { label: loan.lender?.id === userId ? `Lent to ${other}` : `Borrowed from ${other}`, tone: "active" };
  }
  return { label: `Past loan with ${other}`, tone: "past" };
}

function loanTiming(loan) {
  if (!loan) return "";
  const start = loan.borrowerReceivedAt || loan.updatedAt || loan.createdAt;
  if (!start) return "";
  if (loan.status === "returned") {
    const end = loan.lenderReceivedBackAt || loan.updatedAt;
    const days = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000));
    return `Loan duration: ${days} day${days === 1 ? "" : "s"}`;
  }
  if (loan.status === "refused") {
    const days = Math.max(1, Math.ceil((new Date(loan.updatedAt || start) - new Date(loan.createdAt || start)) / 86400000));
    return `Request duration: ${days} day${days === 1 ? "" : "s"}`;
  }
  const date = new Date(start).toLocaleDateString();
  return loan.status === "requested" ? `Waiting since ${date}` : loan.borrowerReceivedAt ? `Since ${date}` : `Accepted on ${date}`;
}

export default function MessagesModal({ show, onClose, user, onUnreadCountChange, onBookUpdated }) {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const loadConversations = useCallback(() => api.get("/api/conversations/mine").then((res) => {
    const next = res.data.data || [];
    setConversations(next);
    setActive((current) => {
      if (!current) return current;
      const refreshed = next.find((item) => (item.documentId || item.id) === (current.documentId || current.id));
      if (!refreshed || loanStateSignature(refreshed) === loanStateSignature(current)) return current;
      return refreshed;
    });
    onUnreadCountChange?.(next.reduce((sum, item) => sum + (item.unreadCount || 0), 0));
    return next;
  }), [onUnreadCountChange]);
  useEffect(() => {
    if (!show || !user?.id) return undefined;
    loadConversations().catch((err) => setError(err.response?.data?.error?.message || "Unable to load messages."));
    // Keep loan status (and therefore contextual action buttons) near real-time
    // while avoiding a refresh loop when the active conversation is unchanged.
    const timer = window.setInterval(() => loadConversations().catch(() => {}), 2500);
    return () => window.clearInterval(timer);
  }, [show, user?.id, loadConversations]);
  useEffect(() => {
    if (!active) return;
    const conversationId = active.documentId || active.id;
    const loadMessages = () => api.get(`/api/conversations/${conversationId}/messages`)
      .then((res) => setMessages(res.data.data || []))
      .catch((err) => setError(err.response?.data?.error?.message || "Unable to load this conversation."));
    loadMessages();
    api.post(`/api/conversations/${conversationId}/read`).then(() => loadConversations()).catch(() => {});
    const timer = window.setInterval(loadMessages, 2500);
    return () => window.clearInterval(timer);
  }, [active, loadConversations]);

  const loans = useMemo(() => active?.loans || [], [active]);
  const chatLocked = loans.some((loan) => loan.status === "requested");
  const currentConversations = conversations.filter((conversation) => conversation.loans?.some((loan) => loan.status === "requested" || loan.status === "active"));
  const pastConversations = conversations.filter((conversation) => !conversation.loans?.some((loan) => loan.status === "requested" || loan.status === "active"));
  const systemMessageText = (message) => {
    if (!message.isSystem) return message.content;
    const loan = loans.find((item) => item.book);
    const book = loan?.book;
    if (message.content?.startsWith("The borrower confirmed receiving the book.")) {
      if (loan?.borrower?.id === user.id) return "You confirmed the reception of the book.";
      return `${loan?.borrower?.username || otherParticipant(active, user.id)?.username || "The borrower"} confirmed the reception of the book.`;
    }
    if (message.content?.startsWith("You recovered your book")) {
      const recoveredAt = loan?.lenderReceivedBackAt || message.createdAt;
      const date = recoveredAt ? new Date(recoveredAt).toLocaleDateString() : "today";
      const bookTitle = book?.title || "the book";
      const closing = "This conversation is now in “Past loans”, but you can continue chatting here if needed.";
      if (loan?.lender?.id === user.id) {
        return `You recovered “${bookTitle}” on ${date}. The book is available again for borrowing.\n\n${closing}`;
      }
      return `${loan?.lender?.username || "The owner"} recovered their book “${bookTitle}” on ${date}. The book is available again for borrowing.\n\n${closing}`;
    }
    if (!message.content?.startsWith("Borrow request for") || !book) return message.content;
    if (loan.status !== "requested") return null;
    const bookName = `“${book.title}${book.author ? `” by ${book.author}` : "”"}`;
    if (loan.borrower?.id === user.id) {
      return `Your request for ${bookName} is waiting for the owner’s approval.`;
    }
    const borrowerName = loan.borrower?.username || otherParticipant(active, user.id)?.username || "the borrower";
    return `You have a new request from ${borrowerName} for your book ${book.title}. Please click below to accept (or reject) this request.`;
  };
  const sendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !active || chatLocked) return;
    try {
      const res = await api.post(`/api/conversations/${active.documentId || active.id}/messages`, { content: draft.trim() });
      setMessages((current) => [...current, res.data.data]);
      setDraft("");
      await loadConversations();
    } catch (err) { setError(err.response?.data?.error?.message || "Unable to send message."); }
  };

  const loanAction = async (loan, action) => {
    try {
      await api.post(`/api/loans/${loan.documentId || loan.id}/${action}`);
      onBookUpdated?.();
      const nextConversations = await loadConversations();
      const refreshed = nextConversations.find((item) => (item.documentId || item.id) === (active.documentId || active.id));
      if (refreshed) setActive(refreshed);
      const fresh = (await api.get(`/api/conversations/${active.documentId || active.id}/messages`)).data.data || [];
      setMessages(fresh);
    } catch (err) { setError(err.response?.data?.error?.message || "Unable to update this loan."); }
  };

  if (!show) return null;
  return <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,.5)" }} onClick={onClose}>
    <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
      <div className="modal-content">
        <div className="modal-header"><h5 className="modal-title">Messages</h5><button className="btn-close" onClick={onClose} aria-label="Close messages" /></div>
        <div className="modal-body p-0">
          {error && <div className="alert alert-danger m-3">{error}</div>}
          {!active ? <div className="list-group list-group-flush">
            {conversations.length === 0 && <p className="p-3 text-muted mb-0">No conversations yet.</p>}
            {currentConversations.length > 0 && <div className="conversation-section-heading conversation-section-current px-3 py-2 text-uppercase small fw-bold">Current loans</div>}
            {[...currentConversations, ...pastConversations].map((conversation) => {
              const book = conversationBook(conversation);
              const context = loanContext(conversation, user.id);
              const loan = conversation.loans?.find((item) => item.status === "requested" || item.status === "active") || conversation.loans?.[0];
              const isPast = pastConversations.includes(conversation);
              return <React.Fragment key={conversation.documentId || conversation.id}>
                {isPast && (pastConversations.indexOf(conversation) === 0) && <div className="conversation-section-heading conversation-section-past px-3 py-2 text-uppercase small fw-bold">Past loans</div>}
                <button className={`list-group-item list-group-item-action text-start ${isPast ? "conversation-item-past" : "conversation-item-current"}`} onClick={() => { setError(""); setActive(conversation); setConversations((current) => current.map((item) => (item.id === conversation.id ? { ...item, unreadCount: 0 } : item))); }}>
                  <span className="conversation-item-content">
                    <span className="conversation-item-details">
                      <span className="d-flex align-items-center gap-2">
                        <strong className={conversation.unreadCount > 0 ? "fw-bold" : "fw-normal"}>{book?.title || "Conversation"}</strong>
                        {conversation.unreadCount > 0 && <span className="badge rounded-pill bg-danger">{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</span>}
                      </span>
                      {book?.author && <small className="d-block text-muted">{book.author}</small>}
                      <span className={`badge loan-context-badge loan-context-${context.tone} mt-1`}>{context.label}</span>
                      {loanTiming(loan) && <small className="d-block text-muted conversation-timing mt-1">{loanTiming(loan)}</small>}
                    </span>
                    <img className="conversation-book-thumbnail" src={bookImage(book)} alt="" aria-hidden="true" />
                  </span>
                </button>
              </React.Fragment>;
            })}
          </div> : <div className="d-flex flex-column" style={{ minHeight: "420px" }}>
            <div className="border-bottom p-2">
              <button className="btn btn-sm btn-link" onClick={() => setActive(null)}><ArrowLeft size={16} /> Back</button>
              <div className="mt-2">
                <div className="conversation-header-content">
                  <div>
                    <strong className="d-block">{conversationBook(active)?.title || "Conversation"}</strong>
                    {conversationBook(active)?.author && <small className="d-block text-muted">{conversationBook(active).author}</small>}
                    <span className={`badge loan-context-badge loan-context-${loanContext(active, user.id).tone} mt-1`}>{loanContext(active, user.id).label}</span>
                    {loanTiming(active.loans?.find((loan) => loan.status === "requested" || loan.status === "active") || active.loans?.[0]) && <small className="d-block text-muted conversation-timing mt-1">{loanTiming(active.loans?.find((loan) => loan.status === "requested" || loan.status === "active") || active.loans?.[0])}</small>}
                  </div>
                  <img className="conversation-book-thumbnail conversation-header-thumbnail" src={bookImage(conversationBook(active))} alt="" aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="flex-grow-1 p-3 overflow-auto">
              {messages.map((message) => {
                const handoverNotice = message.isSystem && message.content?.startsWith("You can now discuss");
                const refusalNotice = message.isSystem && message.content?.startsWith("The loan request was refused");
                const receiptNotice = message.isSystem && message.content?.startsWith("The borrower confirmed receiving the book.");
                const completionNotice = message.isSystem && message.content?.startsWith("You recovered your book");
                const content = systemMessageText(message);
                if (content === null) return null;
                return <div key={message.id} className={`mb-2 ${handoverNotice || refusalNotice || receiptNotice || completionNotice ? "system-notice" : message.sender?.id === user.id ? "text-end" : ""}`}>
                  {handoverNotice && loans.some((loan) => loan.borrower?.id === user.id) && <div className="acceptance-notice">The owner accepted your request.</div>}
                  {handoverNotice || refusalNotice || receiptNotice || completionNotice ? <div className={handoverNotice ? "handover-notice" : refusalNotice ? "refusal-notice" : completionNotice ? "completion-notice" : "acceptance-notice"}>{content}</div> : <span className={`d-inline-block rounded px-3 py-2 ${message.isSystem ? "bg-light text-muted" : message.sender?.id === user.id ? "bg-primary text-white" : "bg-secondary-subtle"}`}>{content}</span>}
                </div>;
              })}
              {loans.filter((loan) => loan.status === "requested" && loan.lender?.id === user.id).map((loan) => <div className="loan-request-actions text-center mt-3" key={loan.documentId || loan.id}>
                <button className="btn btn-sm btn-success me-2" onClick={() => loanAction(loan, "accept")}>Accept</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => loanAction(loan, "refuse")}>Refuse</button>
              </div>)}
              {loans.filter((loan) => loan.status === "active" && loan.borrower?.id === user.id && !loan.borrowerReceivedAt).map((loan) => <div className="receipt-action-card" key={loan.documentId || loan.id}>
                <div className="receipt-action-title">Have you received the book?</div>
                <div className="receipt-action-help">Confirm this only after the handover has taken place.</div>
                <button className="btn btn-success receipt-action-button" onClick={() => loanAction(loan, "confirm-received")}>✓ I received the book</button>
              </div>)}
              {loans.filter((loan) => loan.status === "active" && loan.borrower?.id === user.id && loan.borrowerReceivedAt).map((loan) => <div className="return-reminder-notice" key={loan.documentId || loan.id}>
                When you return the book, the owner will confirm its return in the app. The book will become available again after that confirmation.
              </div>)}
              {loans.filter((loan) => loan.status === "active" && loan.lender?.id === user.id && !loan.borrowerReceivedAt).map((loan) => <div className="handover-waiting-notice" key={loan.documentId || loan.id}>
                Once you have handed over the book, ask {loan.borrower?.username || "the borrower"} to click “I received the book”.
              </div>)}
              {loans.filter((loan) => loan.status === "active" && loan.lender?.id === user.id && loan.borrowerReceivedAt && !loan.lenderReceivedBackAt).map((loan) => <div className="receipt-action-card recovery-action-card" key={loan.documentId || loan.id}>
                <div className="receipt-action-title">You lent this book to {loan.borrower?.username || otherParticipant(active, user.id)?.username || "the borrower"} on {new Date(loan.borrowerReceivedAt).toLocaleDateString()}.</div>
                <div className="receipt-action-help">When they return it, click below to confirm that you got it back. The book will then become available again.</div>
                <button className="btn btn-success receipt-action-button" onClick={() => loanAction(loan, "confirm-received-back")}>✓ I recovered my book</button>
              </div>)}
            </div>
            <form className="border-top p-2 d-flex gap-2" onSubmit={sendMessage}>
              <input className="form-control" value={draft} onChange={(e) => setDraft(e.target.value)} disabled={chatLocked} placeholder={chatLocked ? "Chat will be available after the request is accepted." : "Write a message…"} />
              <button className="btn btn-primary" disabled={chatLocked || !draft.trim()}><Send size={17} /></button>
            </form>
          </div>}
        </div>
      </div>
    </div>
  </div>;
}
