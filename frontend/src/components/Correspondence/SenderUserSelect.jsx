import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { userService } from '../../services/userService'

const formatUserLabel = (user, nameOnly = false) => {
  const name = [user.first_name || user.firstName, user.last_name || user.lastName]
    .filter(Boolean)
    .join(' ')
  if (nameOnly) return name || user.email
  return name ? `${name} (${user.email})` : user.email
}

const SenderUserSelect = ({ value, onChange, required = false, compact = false, nameOnly = false }) => {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['sender-user-options'],
    queryFn: () => userService.getSenderUserOptions(),
  })

  const users = data?.users || []

  return (
    <select
      className={compact ? 'correspondence-compact-select' : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={isLoading}
    >
      <option value="">{t('correspondence.selectSender')}</option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {formatUserLabel(user, nameOnly)}
        </option>
      ))}
    </select>
  )
}

export default SenderUserSelect
