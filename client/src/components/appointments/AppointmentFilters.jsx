const fieldBase =
  "w-full h-8 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-800 " +
  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 " +
  "transition-shadow duration-150";

export default function AppointmentFilters({ filters, onChange }) {
  const handleChange = (e) => {
    onChange({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 px-4 py-3 mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
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

        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            From
          </label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom || ""}
            onChange={handleChange}
            className={fieldBase}
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            To
          </label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo || ""}
            onChange={handleChange}
            className={fieldBase}
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
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
