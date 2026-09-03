import React, { useState } from "react";
import { communityCharterIntro, communityCharterPoints, communityCharterClosing } from "../constants/communityCharter";

export default function SiteFooter({ canInstallApp = false, onInstallApp }) {
  const [section, setSection] = useState(null);
  const content = {
    about: {
      title: "About BookMyBook",
      body: [
        "We started BookMyBook in Heraklion after moving to Crete as a French family and realising we couldn’t bring all the books we wanted to keep reading. 📚 Finding books in French was not always easy, so we created a simple way for local readers to lend and borrow books freely.",
        "Today, BookMyBook is open to every language. 🌍",
      ],
      signature: "Made with care by Charlotte, Damien, Jeanne, Madeleine and Marius. ❤️",
    },
    help: {
      title: "Help",
      body: [
        "Choose a book to view its details. You need to be logged in to send a borrowing request. Once the owner accepts, use the Discussions area to arrange the handover and confirm each step of the exchange.",
        "You can install BookMyBook on your device so it appears on your home screen and opens like an app, without having to find it in the browser each time. On Android/Chrome, use the browser menu and choose Add to Home screen or Install app. On iPhone/Safari, use Share and then Add to Home Screen.",
      ],
      installAvailable: true,
    },
    legal: {
      title: "Legal",
      body: "BookMyBook is an independent family project. The original code, text and visual design are © 2026 Damien Devienne. They may not be copied, modified or redistributed without permission. Third-party software and catalogue content follow their own licenses. User-submitted content remains the responsibility of its author.",
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
                {section.installAvailable && canInstallApp && <button type="button" className="btn btn-primary w-100 mb-2" onClick={onInstallApp}>Install BookMyBook as an app</button>}
                {section.signature && <p className="about-signature mb-0">{section.signature}</p>}
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
