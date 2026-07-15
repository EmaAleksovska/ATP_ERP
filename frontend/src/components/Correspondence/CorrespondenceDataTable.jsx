import { useTranslation } from 'react-i18next'
import { getCellValue } from './columnConfig'

const CorrespondenceDataTable = ({
  columns,
  records,
  selectedId,
  onRowClick,
  printableId = 'correspondence-print-area',
  showPdfActions = false,
  onViewPdf,
  onDownloadPdf,
}) => {
  const { t } = useTranslation()

  return (
    <div id={printableId} className="correspondence-table-wrap">
      <table className="data-table correspondence-data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{t(column.labelKey)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{t('correspondence.noRecords')}</td>
            </tr>
          ) : (
            records.map((record) => (
              <tr
                key={record.id}
                onClick={onRowClick ? () => onRowClick(record) : undefined}
                className={[
                  onRowClick ? 'correspondence-clickable-row' : '',
                  selectedId === record.id ? 'correspondence-selected-row' : '',
                ].filter(Boolean).join(' ') || undefined}
              >
                {columns.map((column) => {
                  if (column.isPdf && showPdfActions) {
                    return (
                      <td key={column.key}>
                        {record.hasPdf ? (
                          <>
                            <span className="correspondence-pdf-print-label">
                              {getCellValue(record, column)}
                            </span>
                            <div
                              className="correspondence-pdf-actions no-print"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              role="presentation"
                            >
                              <button
                                type="button"
                                className="btn-edit correspondence-pdf-btn"
                                onClick={() => onViewPdf?.(record)}
                              >
                                {t('correspondence.viewPdf')}
                              </button>
                              <button
                                type="button"
                                className="btn-edit correspondence-pdf-btn"
                                onClick={() => onDownloadPdf?.(record)}
                              >
                                {t('correspondence.downloadPdf')}
                              </button>
                            </div>
                          </>
                        ) : (
                          <span className="correspondence-pdf-missing">{t('correspondence.noPdf')}</span>
                        )}
                      </td>
                    )
                  }

                  return (
                    <td key={column.key}>{getCellValue(record, column)}</td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default CorrespondenceDataTable
