const fieldBase =
  "w-full h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 " +
  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 " +
  "transition-shadow duration-150 shadow-sm hover:border-gray-300";

export default function AppointmentFilters({ filters, onChange }) {
  const handleChange = (e) => {
    onChange({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 px-5 py-4 mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Status
          </label>
          <select
            name="status"
            value={filters.status || ""}
            onChange={handleChange}
            className={fieldBase}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>

        {/* From Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            From Date
          </label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom || ""}
            onChange={handleChange}
            className={fieldBase}
          />
        </div>

        {/* To Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            To Date
          </label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo || ""}
            onChange={handleChange}
            className={fieldBase}
          />
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Sort
          </label>
          <select
            name="sort"
            value={filters.sort || "-date"}
            onChange={handleChange}
            className={fieldBase}
          >
            <option value="-date">Newest First</option>
            <option value="date">Oldest First</option>
            <option value="-priority">Highest Priority</option>
          </select>
        </div>
      </div>
    </div>
  );
}
