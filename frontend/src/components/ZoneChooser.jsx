import React from "react";

export default function ZoneChooser({ zones, onSelect }) {
  return (
    <div className="modal fade show zone-chooser" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.62)" }}>
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content text-center">
          <div className="modal-body p-4">
            <div className="fs-1 mb-2">📍</div>
            <h4>Choose your area</h4>
            <p className="text-muted mb-4">See books available around you.</p>
            <div className="d-grid gap-2">
              {zones.map((zone) => (
                <button type="button" className="btn btn-primary" key={zone.slug} onClick={() => onSelect(zone.slug)}>
                  {zone.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
