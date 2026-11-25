export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `₹${num.toFixed(2)}`;
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
