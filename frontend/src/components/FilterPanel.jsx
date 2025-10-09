import React from "react";

export default function FilterPanel({ filters, setFilters }) {
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
            <option value="kids">Kids</option>
            <option value="adults">Adults</option>
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
            <option value="FR">FR</option>
            <option value="EN">EN</option>
            <option value="GR">GR</option>
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
          <input
            type="text"
            className="form-control"
            placeholder="Enter owner's username"
            value={filters.owner || ""}
            onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
          />
        </div>

        {/* 🆕 Reset button */}
        <div className="d-grid">
          <button
            className="btn btn-outline-secondary"
            onClick={() =>
              setFilters({ age: "", available: "", language: "", owner: "" })
            }
          >
            Reset all filters
          </button>
        </div>
      </div>
    </div>
  );
}
