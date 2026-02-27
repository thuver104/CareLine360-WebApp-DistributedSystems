import { STATUS_COLORS, PRIORITY_COLORS, PAYMENT_STATUS_COLORS } from "../../utils/constants";

export function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_COLORS[priority] || "bg-gray-100 text-gray-800"}`}>
      {priority}
    </span>
  );
}

export function PaymentBadge({ status }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_STATUS_COLORS[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
