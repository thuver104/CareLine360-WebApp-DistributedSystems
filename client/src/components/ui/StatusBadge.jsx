import { STATUS_BADGE, PRIORITY_BADGE, PAYMENT_BADGE } from "../../utils/colors";

export function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_BADGE[priority] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
      {priority}
    </span>
  );
}

export function PaymentBadge({ status }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_BADGE[status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
      {status}
    </span>
  );
}
