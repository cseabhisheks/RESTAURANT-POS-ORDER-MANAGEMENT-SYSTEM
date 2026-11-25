const ORDER_STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Preparing: 'bg-blue-100 text-blue-800 border-blue-200',
  Ready: 'bg-purple-100 text-purple-800 border-purple-200',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const PAYMENT_STATUS_STYLES = {
  Paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Unpaid: 'bg-rose-100 text-rose-800 border-rose-200',
};

export function OrderStatusBadge({ status }) {
  const style = ORDER_STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
}

export function PaymentStatusBadge({ status, method }) {
  const style = PAYMENT_STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status}{method ? ` (${method})` : ''}
    </span>
  );
}
