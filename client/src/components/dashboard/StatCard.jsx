// A single bento-grid metric card. `size` controls how many columns it spans
// (sm = 1, md = 2, lg = 3). `children` can hold a breakdown list.
export default function StatCard({ label, value, hint, size = 'sm', children }) {
  return (
    <div className={'bento-card bento-' + size}>
      <div className="stat-card-label">{label}</div>
      {value != null && <div className="stat-card-value">{value}</div>}
      {hint && <div className="stat-card-hint">{hint}</div>}
      {children}
    </div>
  )
}
