import React from "react";

export default function EmailConfirmedPage() {
  const invalid = new URLSearchParams(window.location.search).get("error") === "invalid-token";
  return <main className="container py-5 auth-page"><div className="row justify-content-center"><div className="col-12 col-md-6 col-lg-4"><div className="card shadow-sm text-center"><div className="card-body p-4"><div className="display-6 mb-2">{invalid ? "!" : "✓"}</div><h1 className="h4">{invalid ? "Link no longer valid" : "Email confirmed"}</h1><p className="text-muted">{invalid ? "This confirmation link has expired or has already been used. Please create a new account or contact us if you need help." : "Your account is ready. You can now log in to Maki Books."}</p><a className="btn btn-primary w-100" href="/?login=1">Go to Maki Books</a></div></div></div></div></main>;
}
