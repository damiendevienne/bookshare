import React from "react";
import { languages } from "../constants/languages";

export default function FilterPanel({ filters, setFilters, matchingCount, onApply }) {
  return (
    <div
      className="offcanvas offcanvas-end"
      tabIndex="-1"
      id="filterCanvas"
      aria-labelledby="filterCanvasLabel"
      style={{ width: "250px" }}
    >
      <div className="offcanvas-header">
        <h5 id="filterCanvasLabel">Filter books</h5>
        <button
          type="button"
          className="btn-close text-reset"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        ></button>
      </div>

      <div className="offcanvas-body">
        {/* Age */}
        <div className="mb-3">
          <label className="form-label">Age</label>
          <select
            className="form-select"
            value={filters.age}
            onChange={(e) => setFilters({ ...filters, age: e.target.value })}
          >
            <option value="">All</option>
            <option value="young_children">Young children (0–6)</option>
            <option value="children">Children (7–11)</option>
            <option value="teenagers">Teenagers (12–17)</option>
            <option value="adults">Adults (18+)</option>
          </select>
        </div>

        {/* Language */}
        <div className="mb-3">
          <label className="form-label">Language</label>
          <select
            className="form-select"
            value={filters.language}
            onChange={(e) => setFilters({ ...filters, language: e.target.value })}
          >
            <option value="">All</option>
            {languages.map(([code, name]) => <option value={code} key={code}>{name} ({code})</option>)}
          </select>
        </div>

        {/* Availability */}
        <div className="mb-3">
          <label className="form-label">Availability</label>
          <select
            className="form-select"
            value={filters.available}
            onChange={(e) => setFilters({ ...filters, available: e.target.value })}
          >
            <option value="">All</option>
            <option value="yes">Available</option>
            <option value="no">Not available</option>
          </select>
        </div>

        {/* 🆕 Owner */}
        <div className="mb-3">
          <label className="form-label">Owner</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Enter owner's username"
              value={filters.owner || ""}
              onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
            />
            {filters.owner && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                aria-label="Clear owner filter"
                onClick={() => setFilters({ ...filters, owner: "" })}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="filter-preview-count text-muted small text-center mb-3">
          {matchingCount} {matchingCount === 1 ? "book" : "books"} match these filters
        </div>

        {/* Reset and apply buttons */}
        <div className="d-grid">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() =>
              setFilters({ age: "", available: "", language: "", owner: "" })
            }
          >
            Reset all filters
          </button>
          <button type="button" className="btn btn-primary mt-2" data-bs-dismiss="offcanvas" onClick={onApply}>Apply filters</button>
        </div>
      </div>
    </div>
  );
}
