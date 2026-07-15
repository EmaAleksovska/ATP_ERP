export function exportRecordsToCsv(records, columns, filename) {
  const header = columns.map((col) => col.key).join(',')
  const rows = records.map((record) =>
    columns
      .map((column) => {
        let value = column.virtual && column.key === 'atp'
          ? 'ATP'
          : column.isPdf
            ? (record.hasPdf ? 'PDF' : '')
            : (record[column.displayKey || column.key] ?? '')
        value = String(value).replace(/"/g, '""')
        return `"${value}"`
      })
      .join(',')
  )

  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
