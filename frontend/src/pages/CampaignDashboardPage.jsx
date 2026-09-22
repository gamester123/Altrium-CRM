import { useEffect, useState } from 'react'
import { getCampaignRoi } from '../api/dashboard'
import { friendlyError } from '../lib/errors'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'

const SOURCES = [
  'Google Ads',
  'LinkedIn',
  'Email Campaign',
  'Referral',
  'Other',
]

function dates(range) {
  const now = new Date()

  if (range === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 1)

    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    }
  }

  if (range === 'quarter') {
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 1)

    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    }
  }

  return {
    startDate: '',
    endDate: '',
  }
}

export default function CampaignDashboardPage() {
  const [range, setRange] = useState('month')
  const [custom, setCustom] = useState({
    startDate: '',
    endDate: '',
  })

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)

    const params = range === 'custom' ? custom : dates(range)

    getCampaignRoi(params)
      .then((response) => {
        setData(response.data || [])
      })
      .catch((err) => {
        setError(friendlyError(err))
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    if (range !== 'custom') {
      load()
    }
  }, [range])

  const totalLeads = data.reduce(
    (sum, row) => sum + Number(row.totalLeads || 0),
    0
  )

  const totalConverted = data.reduce(
    (sum, row) => sum + Number(row.convertedLeads || 0),
    0
  )

  const overallConversion =
    totalLeads > 0
      ? ((totalConverted / totalLeads) * 100).toFixed(1)
      : '0.0'

  return (
    <section className="page-space">

      {/* Header */}
      <div className="mb-7">
        <p className="crm-section-label">
          Marketing intelligence
        </p>

        <h1 className="crm-page-heading">
          Campaign conversion
        </h1>

        <p className="page-subtitle mt-2 max-w-2xl">
          Compare lead sources and see how effectively each campaign converts
          leads into deals.
        </p>
      </div>

      {/* Summary Cards */}
      {!loading && !error && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total leads
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalLeads}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Created in selected period
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Converted
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalConverted}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Leads converted to deals
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Conversion rate
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {overallConversion}%
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Across all sources
            </p>
          </div>

        </div>
      )}

      {/* Date / Range Controls */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Reporting period
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Select the period used for the campaign report.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            {[
              ['month', 'Last Month'],
              ['quarter', 'Last Quarter'],
              ['custom', 'Custom'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  range === value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}

          </div>

        </div>

        {/* Custom Dates */}
        {range === 'custom' && (
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end">

            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Start date
              </label>

              <input
                type="date"
                value={custom.startDate}
                onChange={(e) =>
                  setCustom({
                    ...custom,
                    startDate: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                End date
              </label>

              <input
                type="date"
                value={custom.endDate}
                onChange={(e) =>
                  setCustom({
                    ...custom,
                    endDate: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <Button
              size="sm"
              onClick={load}
              disabled={!custom.startDate || !custom.endDate}
            >
              Apply
            </Button>

          </div>
        )}

      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
          <Spinner label="Loading campaign report" />
        </div>
      )}

      {/* Campaign Table */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Lead source performance
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Conversion performance for each campaign source.
            </p>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[680px]">

              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Source
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total leads
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Converted to deal
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Conversion
                  </th>

                </tr>
              </thead>

              <tbody>
                {SOURCES.map((source) => {
                  const row =
                    data.find((item) => item.source === source) || {
                      totalLeads: 0,
                      convertedLeads: 0,
                      conversionRate: 0,
                    }

                  return (
                    <tr
                      key={source}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                    >

                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-slate-800">
                          {source}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-slate-700">
                        {row.totalLeads}
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-slate-700">
                        {row.convertedLeads}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex min-w-[64px] justify-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          {row.conversionRate}%
                        </span>
                      </td>

                    </tr>
                  )
                })}
              </tbody>

            </table>

          </div>

        </div>
      )}

    </section>
  )
}