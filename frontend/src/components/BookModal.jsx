import React, { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import api, { mediaUrl } from "../api";
import { languageName } from "../constants/languages";
import { ageBadgeLabel } from "../constants/ages";

const textLines = (value) => Array.isArray(value)
  ? value.map((block) => Array.isArray(block?.children) ? block.children.map((child) => child?.text || "").join("").trim() : "").filter(Boolean)
  : typeof value === "string" ? value.split("\n").map((line) => line.trim()).filter(Boolean) : [];

export default function BookModal({ selectedBook, showModal, onClose, onFilterByOwner, ownerCounts, isLoggedIn, user, onBorrowRequested, onOpenDiscussion, isFavorite, onFavoriteToggle }) {
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const [borrowError, setBorrowError] = useState("");
  const [loanStatus, setLoanStatus] = useState(null);
  const [loanInfo, setLoanInfo] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(0);
  const [imageChangeDirection, setImageChangeDirection] = useState("");
  const [imageScale, setImageScale] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const touchGesture = useRef(null);

  const book = selectedBook?.attributes || selectedBook || {};
  const owner = book.owner?.username || "Unknown";
  const images = book.image || [];

  const booksCount = ownerCounts?.[book.owner?.id] || 0;
  const bookIdentifier = selectedBook?.documentId || selectedBook?.id;
  const isOwner = user?.id && book.owner?.id === user.id;

  useEffect(() => {
    setLoanStatus(null);
    setLoanInfo(null);
    setConversationId(null);
    if (!showModal || !selectedBook || !isLoggedIn || !user?.id || !bookIdentifier) return undefined;
    const refreshLoanStatus = () => api.get(`/api/loans/status?bookId=${encodeURIComponent(bookIdentifier)}`)
      .then((res) => {
        const info = res.data.data || null;
        setLoanInfo(info);
        setLoanStatus(info?.status || null);
        setConversationId(info?.conversationId || null);
      })
      .catch(() => {});
    refreshLoanStatus();
    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") refreshLoanStatus();
    };
    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => {
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, [showModal, selectedBook, isLoggedIn, user?.id, bookIdentifier, isOwner]);

  const imageSources = images.length > 0
    ? images.map((img) => mediaUrl(img.formats?.large?.url || img.formats?.medium?.url || img.url || img.attributes?.url))
    : [book.coverUrl || "/images/open-book.png"];
  const openImageViewer = (src, index = 0) => { setZoomedImage(src); setZoomedImageIndex(index); setImageScale(1); setImagePan({ x: 0, y: 0 }); setImageChangeDirection(""); };
  const closeImageViewer = () => { setZoomedImage(null); setImageScale(1); setImagePan({ x: 0, y: 0 }); };
  const showAdjacentImage = (direction) => {
    if (imageSources.length < 2 || imageScale !== 1) return;
    const nextIndex = (zoomedImageIndex + direction + imageSources.length) % imageSources.length;
    setImageChangeDirection(direction > 0 ? "left" : "right");
    setZoomedImageIndex(nextIndex);
    setZoomedImage(imageSources[nextIndex]);
    setImagePan({ x: 0, y: 0 });
  };
  const handlePinchStart = (event) => {
    if (event.touches.length === 1 && imageScale > 1) {
      event.stopPropagation();
      touchGesture.current = { panning: true, startX: event.touches[0].clientX, startY: event.touches[0].clientY, pan: imagePan };
      return;
    }
    if (event.touches.length !== 2) return;
    event.stopPropagation();
    const [first, second] = event.touches;
    touchGesture.current = { pinch: true, distance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY), scale: imageScale };
  };
  const handlePinchMove = (event) => {
    const gesture = touchGesture.current;
    if (gesture?.panning && event.touches.length === 1) {
      event.stopPropagation();
      const viewport = event.currentTarget;
      const scale = imageScale;
      const maxX = Math.max(0, (viewport.clientWidth * (scale - 1)) / 2);
      const maxY = Math.max(0, (viewport.clientHeight * (scale - 1)) / 2);
      const x = gesture.pan.x + event.touches[0].clientX - gesture.startX;
      const y = gesture.pan.y + event.touches[0].clientY - gesture.startY;
      setImagePan({ x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) });
      return;
    }
    if (!gesture?.pinch || event.touches.length !== 2) return;
    event.stopPropagation();
    const [first, second] = event.touches;
    const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
    const nextScale = Math.min(4, Math.max(1, gesture.scale * (distance / gesture.distance)));
    setImageScale(nextScale);
    if (nextScale === 1) setImagePan({ x: 0, y: 0 });
  };
  const handlePinchEnd = (event) => { if (touchGesture.current?.panning || touchGesture.current?.pinch) event.stopPropagation(); touchGesture.current = null; };
  const handleViewerTouchStart = (event) => {
    if (event.touches.length === 1 && imageScale === 1) {
      touchGesture.current = { swipe: true, startX: event.touches[0].clientX, startY: event.touches[0].clientY };
      return;
    }
    handlePinchStart(event);
  };
  const handleViewerTouchEnd = (event) => {
    const gesture = touchGesture.current;
    if (gesture?.pinch || gesture?.panning) return handlePinchEnd(event);
    touchGesture.current = null;
    if (gesture?.swipe && event.changedTouches.length === 1) {
      const deltaX = event.changedTouches[0].clientX - gesture.startX;
      const deltaY = event.changedTouches[0].clientY - gesture.startY;
      if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) showAdjacentImage(deltaX < 0 ? 1 : -1);
    }
  };

  if (!showModal || !selectedBook) return null;

  const requestBorrow = async () => {
    setBorrowing(true);
    setBorrowError("");
    try {
      const response = await api.post("/api/loans/request", { bookId: bookIdentifier });
      setLoanStatus("requested");
      setConversationId(response.data.data?.conversationId || null);
      onBorrowRequested?.();
    } catch (err) {
      setBorrowError(err.response?.data?.error?.message || "Unable to send the borrowing request.");
    } finally {
      setBorrowing(false);
    }
  };
  const legacyDescription = textLines(book.description);
  const summaryLines = textLines(book.summary).length > 0
    ? textLines(book.summary)
    : book.catalogSource === "openlibrary" ? legacyDescription : [];
  const ownerCommentLines = textLines(book.ownerComment).length > 0
    ? textLines(book.ownerComment)
    : book.catalogSource !== "openlibrary" ? legacyDescription : [];

  return (
    <>
      {/* === MAIN BOOK MODAL === */}
      <div
        className="modal fade show"
        style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        tabIndex="-1"
        onClick={onClose}
      >
        <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title">{book.title}</h5>
                <h6 className="modal-subtitle">{book.author}</h6>
                <small className="owner">
                  Proposed by{" "}
                  <span
                    style={{ cursor: "pointer", color: "var(--bookmybook-navy)" }}
                    onClick={() => setShowOwnerModal(true)}
                  >
                    {owner}
                  </span>
                </small>
              </div>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body">
              {images.length > 0 ? (
                <div id="carouselBookImages" className="carousel slide mb-3" data-bs-ride="carousel">
                  <div className="carousel-inner">
                    {images.map((img, idx) => (
                      <div
                        className={`carousel-item ${idx === 0 ? "active" : ""}`}
                        key={idx}
                      >
                        <img
                          src={mediaUrl(img.formats?.medium?.url || img.formats?.small?.url || img.url || img.attributes?.url)}
                          className="d-block w-100"
                          alt={book.title}
                          style={{ maxHeight: "400px", objectFit: "contain", cursor: "zoom-in" }}
                          onClick={(event) => { event.stopPropagation(); openImageViewer(imageSources[idx], idx); }}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    className="carousel-control-prev book-carousel-control"
                    type="button"
                    data-bs-target="#carouselBookImages"
                    data-bs-slide="prev"
                  >
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button
                    className="carousel-control-next book-carousel-control"
                    type="button"
                    data-bs-target="#carouselBookImages"
                    data-bs-slide="next"
                  >
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                  </button>
                </div>
              ) : <img src={book.coverUrl || "/images/open-book.png"} className="d-block mx-auto mb-3" alt={book.title || "Book cover"} style={{ maxHeight: "400px", maxWidth: "100%", objectFit: "contain", cursor: "zoom-in" }} onClick={(event) => { event.stopPropagation(); openImageViewer(book.coverUrl || "/images/open-book.png"); }} />}

              <div className="book-details-badge-row mb-2">
                <div>
                  {book.age && <span className="badge bg-primary me-2">{ageBadgeLabel(book.age)}</span>}
                  {book.language && <span className="badge bg-warning">{languageName(book.language)}</span>}
                </div>
                <button type="button" className={`book-modal-favorite-button ${isFavorite ? "is-favorite" : ""}`} aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"} aria-pressed={isFavorite} onClick={onFavoriteToggle}>
                  <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
                </button>
              </div>
              {(summaryLines.length > 0 || ownerCommentLines.length > 0) && <hr />}
              {summaryLines.length > 0 && <section className="book-info-section mt-3">
                <h6 className="text-muted">Summary</h6>
                <div>{summaryLines.map((line, index) => <p key={index} className="mb-2">{line}</p>)}</div>
              </section>}
              {ownerCommentLines.length > 0 && <section className="book-info-section mt-3">
                <h6 className="text-muted">Owner’s note</h6>
                <div>{ownerCommentLines.map((line, index) => <p key={index} className="mb-2">{line}</p>)}</div>
              </section>}
            </div>

            <div className="modal-footer">
              {!isLoggedIn && (
                <small className="text-muted me-auto">
                  Please log in to borrow books.
                </small>
              )}
              {borrowError && <small className="text-danger me-auto">{borrowError}</small>}
              <button className="btn btn-primary" disabled={!isLoggedIn || !book.available || isOwner || borrowing || loanStatus === "requested" || loanStatus === "active"} onClick={requestBorrow}>
                {borrowing ? "Sending…" : loanStatus === "requested" ? "A request was sent to the owner" : loanStatus === "active" ? "You’re currently borrowing this book" : book.available ? "Borrow this book" : "Currently unavailable"}
              </button>
              {loanStatus === "requested" && <div className="borrow-request-followup">
                <small className="text-muted">{isOwner ? `${loanInfo?.borrower?.username || "The borrower"} has requested this book.` : `${owner} has been notified.`}</small>
                {conversationId && <button type="button" className="btn btn-link btn-sm" onClick={() => { onClose(); onOpenDiscussion?.(conversationId); }}>Open the discussion</button>}
              </div>}
              {loanStatus === "active" && isOwner && <div className="borrow-request-followup"><small className="text-muted">{loanInfo?.borrower?.username || "The borrower"} is currently borrowing this book.</small>{conversationId && <button type="button" className="btn btn-link btn-sm" onClick={() => { onClose(); onOpenDiscussion?.(conversationId); }}>Open the discussion</button>}</div>}
            </div>
          </div>
        </div>
      </div>

      {zoomedImage && <div className="book-image-viewer" role="dialog" aria-modal="true" aria-label="Enlarged book image" onClick={closeImageViewer}>
        <div className="book-image-viewer-topbar" onClick={(event) => event.stopPropagation()}>
          <span>{book.title || "Book image"}</span>
          <button type="button" className="book-image-viewer-close btn-close" aria-label="Close enlarged image" onClick={closeImageViewer} />
        </div>
        <div className="book-image-viewer-viewport" onClick={(event) => event.stopPropagation()} onWheel={(event) => { const nextScale = Math.min(4, Math.max(1, imageScale + (event.deltaY < 0 ? 0.15 : -0.15))); setImageScale(nextScale); if (nextScale === 1) setImagePan({ x: 0, y: 0 }); }} onTouchStart={handleViewerTouchStart} onTouchMove={handlePinchMove} onTouchEnd={handleViewerTouchEnd}>
          <img key={zoomedImageIndex} className={imageChangeDirection ? `book-image-change-${imageChangeDirection}` : ""} src={zoomedImage} alt={book.title || "Book image"} style={{ transform: `translate(${imagePan.x}px, ${imagePan.y}px) scale(${imageScale})` }} onAnimationEnd={() => setImageChangeDirection("")} />
        </div>
        <div className="book-image-viewer-bottombar" onClick={(event) => event.stopPropagation()}>
          <span>{imageScale === 1 ? "Swipe to browse · pinch or scroll to zoom" : "Drag to move · reset zoom to browse"}</span>
          <button type="button" className="btn btn-sm btn-light" onClick={() => { setImageScale(1); setImagePan({ x: 0, y: 0 }); }}>Reset zoom</button>
        </div>
      </div>}

      {/* === OWNER INFO SMALL MODAL === */}
      {showOwnerModal && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.3)", // semi-transparent overlay
            padding: "2rem", // ensures modal does not touch screen edges
          }}
          tabIndex="-1"
          onClick={() => setShowOwnerModal(false)}
        >
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              margin: "auto", 
              marginTop: "auto", // pushes modal to bottom
              marginBottom: "2rem", // space from bottom
              maxWidth: "400px",
            }}
          >
            <div className="modal-content rounded-4 shadow-lg">
              <div className="modal-header border-0">
                <h5 className="modal-title">{owner}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowOwnerModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {book.owner?.createdAt && (
                  <p className="text-muted mb-2">
                    Member since {new Date(book.owner.createdAt).toLocaleDateString()}
                  </p>
                )}
                  <p>
                    {owner} is proposing <strong>{booksCount ?? "?"}</strong> {booksCount === 1 ? "book" : "books"} on the platform.
                  </p>                
                  <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => {
                    setShowOwnerModal(false);
                    onClose(); // close book modal
                    onFilterByOwner(book.owner?.username);
                  }}
                >
                  See {booksCount === 1 ? "the book" : "the books"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
