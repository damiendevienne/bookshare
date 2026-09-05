import React, { useState } from "react";
import { communityCharterIntro, communityCharterPoints, communityCharterClosing } from "../constants/communityCharter";

export default function SiteFooter({ canInstallApp = false, onInstallApp }) {
  const [section, setSection] = useState(null);
  const sourceUrl = import.meta.env.VITE_SOURCE_URL || "https://github.com/damiendevienne/makibooks";
  const supportUrl = import.meta.env.VITE_SUPPORT_URL || "https://buymeacoffee.com/damiendevienne";
  const content = {
    about: {
      title: "About Maki Books",
      body: [
        "We started Maki Books in Heraklion after moving to Crete as a French family and realising we couldn’t bring all the books we wanted to keep reading. 📚 Finding books in French was not always easy, so we created a simple way for local readers to lend and borrow books freely.",
        "Today, Maki Books is open to every language. 🌍",
      ],
      signature: "Made with care by Charlotte, Damien, Jeanne, Madeleine and Marius. ❤️",
    },
    help: {
      title: "Help",
      body: [
        "Choose a book to view its details. You need to be logged in to send a borrowing request. Once the owner accepts, use the Discussions area to arrange the handover and confirm each step of the exchange.",
        "You can install Maki Books on your device so it appears on your home screen and opens like an app, without having to find it in the browser each time. On Android/Chrome, use the browser menu and choose Add to Home screen or Install app. On iPhone/Safari, use Share and then Add to Home Screen.",
      ],
      installAvailable: true,
    },
    legal: {
      title: "Legal",
      body: [
        "Maki Books is an independent, open-source family project. Copyright © 2026 Damien de Vienne. The original code and project-owned content are licensed under the GNU Affero General Public License version 3 (AGPL-3.0-only). You may use, modify and redistribute them under that license, including its source-sharing requirements for modified versions used over a network.",
        "Maki Books is provided without warranty, to the extent permitted by law. Third-party software, catalogue metadata and book covers remain subject to their respective licenses and rights. User-submitted content belongs to its respective rights holders and is not relicensed under the AGPL by this notice.",
      ],
      sourceUrl,
    },
    support: {
      title: "Want to support Maki Books?",
      footerLabel: "Support ☕",
      body: "If Maki Books is useful to your family and you’d like to help us keep it running, you can support this family-made project. Contributions help with hosting, email delivery and ongoing development. ☕✨",
      supportUrl,
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
            <button type="button" key={key} onClick={() => setSection(value)}>{value.footerLabel || value.title.replace("Maki Books", "").trim() || "About"}</button>
          ))}
        </div>
        <div className="site-footer-copyright">
          © 2026 Damien de Vienne — Maki Books · <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noreferrer">AGPLv3</a> · <a href={sourceUrl} target="_blank" rel="noreferrer">Source code</a>
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
                {section.sourceUrl && <p><a href={section.sourceUrl} target="_blank" rel="noreferrer">Get the source code</a>{" · "}<a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noreferrer">Read the AGPLv3 license</a></p>}
                {section.installAvailable && canInstallApp && <button type="button" className="btn btn-primary w-100 mb-2" onClick={onInstallApp}>Install Maki Books as an app</button>}
                {section.supportUrl && <a className="support-link" href={section.supportUrl} target="_blank" rel="noreferrer">Buy us a coffee! ☕</a>}
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
