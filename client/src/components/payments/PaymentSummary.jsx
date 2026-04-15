import { PaymentBadge } from "../ui/StatusBadge";

export default function PaymentSummary({ payment }) {
  if (!payment) return null;

  return (
    <div className="glass-card rounded-2xl p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Payment Details</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Amount:</span>
          <span className="font-medium text-gray-900 dark:text-white">LKR {payment.amount?.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Method:</span>
          <span className="capitalize text-gray-900 dark:text-white">{payment.method}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Status:</span>
          <PaymentBadge status={payment.status} />
        </div>
        {payment.transactionRef && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Ref:</span>
            <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{payment.transactionRef}</span>
          </div>
        )}
        {payment.verifiedAt && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Verified:</span>
            <span className="text-gray-700 dark:text-gray-300">{new Date(payment.verifiedAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
