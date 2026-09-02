import React, { useState } from "react";
import { communityCharterIntro, communityCharterPoints, communityCharterClosing } from "../constants/communityCharter";

export default function SiteFooter() {
  const [section, setSection] = useState(null);
  const content = {
    about: {
      title: "About BookMyBook",
      body: [
        "BookMyBook began in Heraklion when a French family moved to Crete and realised they couldn’t bring all the books they wanted to keep reading. 📚 Finding books in French was not always easy, so we created a simple way for local readers to lend and borrow books freely.",
        "Today, BookMyBook is open to every language and every expat community. 🌍",
      ],
    },
    help: {
      title: "Help",
      body: "Choose a book to view its details. You need to be logged in to send a borrowing request. Once the owner accepts, use the Messages area to arrange the handover and confirm each step of the exchange.",
    },
    legal: {
      title: "Legal",
      body: "BookMyBook is an independent project. The application code and BookMyBook identity are protected by copyright. Third-party libraries and catalogue content remain subject to their respective licenses and terms.",
    },
    charter: {
      title: "Community Charter",
      body: communityCharterIntro,
      points: communityCharterPoints,
    },
  };

  return (
    <>
      <footer className="site-footer" aria-label="Site information">
        <div className="container">
        <div className="site-footer-links">
          {Object.entries(content).map(([key, value]) => (
            <button type="button" key={key} onClick={() => setSection(value)}>{value.title.replace("BookMyBook", "").trim() || "About"}</button>
          ))}
        </div>
        <div className="site-footer-copyright">
          © 2026 BookMyBook. All rights reserved.
        </div>
        </div>
      </footer>
      {section && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setSection(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(event) => event.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{section.title}</h5>
                <button type="button" className="btn-close" onClick={() => setSection(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                {Array.isArray(section.body) ? section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : <p>{section.body}</p>}
                {section.points && <><ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul><p className="mb-0 fw-semibold text-center">{communityCharterClosing}</p></>}
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setSection(null)}>Close</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
