import { Link } from 'react-router'
import { useTranslation } from '../../i18n/useTranslation'
import type { ApplicationRow } from '../../services/applications'
import { formatDate } from '../../utils/format'
import { ApplicationStatusBadge } from './ApplicationStatusBadge'

export function ApplicationTable({ rows }: { rows: ApplicationRow[] }) {
  const { t } = useTranslation()
  const columns = {
    applicant: t('applications.columns.applicant'),
    space: t('applications.columns.space'),
    desiredStart: t('applications.columns.desiredStart'),
    received: t('applications.columns.received'),
    status: t('applications.columns.status'),
  }

  return (
    <div className="card table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{columns.applicant}</th>
            <th scope="col">{columns.space}</th>
            <th scope="col">{columns.desiredStart}</th>
            <th scope="col">{columns.received}</th>
            <th scope="col">{columns.status}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ application, space, property }) => (
            <tr key={application.id}>
              <td className="data-table__main">
                <span>
                  <Link to={`/applications/${application.id}`} className="data-table__primary">
                    {application.name}
                  </Link>
                  <span className="data-table__line data-table__secondary-inline">
                    {t(`tenant.type.${application.applicantType}`)}
                    {application.contactPerson && ` · ${application.contactPerson}`}
                  </span>
                </span>
              </td>
              <td data-label={columns.space}>
                {space ? (
                  <span>
                    <span className="data-table__line">{space.name}</span>
                    {property && <span className="data-table__line data-table__secondary-inline">{property.name}</span>}
                  </span>
                ) : (
                  t('applications.unknownSpace')
                )}
              </td>
              <td data-label={columns.desiredStart}>{formatDate(application.desiredStartDate)}</td>
              <td data-label={columns.received}>{formatDate(application.createdAt)}</td>
              <td data-label={columns.status}>
                <ApplicationStatusBadge status={application.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
