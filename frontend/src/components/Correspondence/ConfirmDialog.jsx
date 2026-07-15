import { useTranslation } from 'react-i18next'
import '../Projects/ProjectForm.css'

const ConfirmDialog = ({ message, onConfirm, onCancel, confirmLabel, cancelLabel }) => {
  const { t } = useTranslation()

  return (
    <div className="modal-overlay">
      <div className="modal-content correspondence-confirm-dialog">
        <p>{message}</p>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelLabel || t('common.cancel')}
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm}>
            {confirmLabel || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
