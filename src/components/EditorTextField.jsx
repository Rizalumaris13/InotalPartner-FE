export default function EditorTextField({ id, label, value, onChange, maxLength, textarea, type = 'text', error, help }) {
  const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ')
  const input = {
    id,
    value,
    onChange: (event) => onChange(event.target.value),
    maxLength,
    'aria-invalid': Boolean(error),
    'aria-describedby': describedBy || undefined,
    className: 'mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100',
  }

  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-gray-600">{label}</label>
      {textarea ? <textarea {...input} rows={3} /> : <input {...input} type={type} />}
      {help && <p id={`${id}-help`} className="mt-1 text-xs text-gray-400">{help}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
