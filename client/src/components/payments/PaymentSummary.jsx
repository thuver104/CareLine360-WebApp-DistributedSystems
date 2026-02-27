import { PaymentBadge } from "../ui/StatusBadge";

export default function PaymentSummary({ payment }) {
  if (!payment) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4">
      <h3 className="font-semibold mb-3">Payment Details</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-medium">${payment.amount?.toFixed(2)} {payment.currency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Method:</span>
          <span className="capitalize">{payment.method}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <PaymentBadge status={payment.status} />
        </div>
        {payment.transactionRef && (
          <div className="flex justify-between">
            <span className="text-gray-600">Ref:</span>
            <span className="font-mono text-xs">{payment.transactionRef}</span>
          </div>
        )}
        {payment.verifiedAt && (
          <div className="flex justify-between">
            <span className="text-gray-600">Verified:</span>
            <span>{new Date(payment.verifiedAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
