import { useEffect, useState } from 'react'
import { getLeadershipSummary } from '../api/dashboard'
import { friendlyError } from '../lib/errors'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'

const labels = {
  new: 'New',
  contacted: 'Contacted',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

const money = (n) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(n || 0)

function makePdf(data) {
  const esc = (value) =>
    String(value)
      .replaceAll('\\', '\\\\')
      .replaceAll('(', '\\(')
      .replaceAll(')', '\\)')

  const lines = []
  let y = 790

  const add = (text, size) => {
    lines.push(
      `BT /F1 ${size} Tf 50 ${y} Td (${esc(text)}) Tj ET`
    )
    y -= 18
  }

  add('Altrium Leadership Dashboard', 20)
  add(
    `Generated ${new Date().toLocaleDateString()}`,
    10
  )

  y -= 8

  add(
    `Open pipeline value: ${money(data.pipelineValue)}`,
    13
  )
  add(`Won: ${data.wonCount}`, 11)
  add(`Lost: ${data.lostCount}`, 11)
  add(`Win rate: ${data.winRate}%`, 11)

  y -= 8

  add('Deal funnel', 14)

  data.funnel.forEach((item) =>
    add(
      `${labels[item.stage]}: ${item.count}`,
      10
    )
  )

  const body = lines.join('\n')

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(pdf.length)

    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xref = pdf.length

  pdf += `xref
0 6
0000000000 65535 f 
${offsets
  .slice(1)
  .map(
    (n) =>
      `${String(n).padStart(10, '0')} 00000 n \n`
  )
  .join('')}trailer << /Size 6 /Root 1 0 R >>
startxref
${xref}
%%EOF`

  const url = URL.createObjectURL(
    new Blob([pdf], {
      type: 'application/pdf',
    })
  )

  const a = document.createElement('a')

  a.href = url
  a.download = `Leadership_Dashboard_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`

  document.body.appendChild(a)
  a.click()
  a.remove()

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  )
}

export default function LeadershipDashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const load = () => {
    setError(null)

    getLeadershipSummary()
      .then(setData)
      .catch((e) =>
        setError(friendlyError(e))
      )
  }

  useEffect(() => {
    load()
  }, [])

  if (!data && !error) {
    return (
      <Spinner label="Loading leadership dashboard" />
    )
  }

  if (error) {
    return (
      <section className="page-space">
        <p className="alert-error">{error}</p>
      </section>
    )
  }

  const funnelStages = [
    'new',
    'contacted',
    'proposal',
    'negotiation',
    'won',
  ]

  const funnelData = funnelStages.map(
    (stage) =>
      data.funnel.find(
        (item) => item.stage === stage
      ) || {
        stage,
        count: 0,
      }
  )

  const max =
    Math.max(
      ...funnelData.map((item) => item.count),
      1
    )

  return (
    <section className="page-space">

      <div className="page-header">
        <div>
          <p className="crm-section-label">
            Leadership
          </p>

          <h1 className="crm-page-heading">
            Pipeline overview
          </h1>

          <p className="page-subtitle">
            A live whole-pipeline snapshot for
            leadership and administration.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={load}
          >
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => makePdf(data)}
          >
            Export PDF
          </Button>
        </div>
      </div>

      <div className="s2-dashboard-grid">
        <div className="s2-stat">
          <span>Open pipeline value</span>
          <strong>
            {money(data.pipelineValue)}
          </strong>
        </div>

        <div className="s2-stat">
          <span>Win rate</span>
          <strong>
            {data.winRate}%
          </strong>
        </div>

        <div className="s2-stat">
          <span>Won deals</span>
          <strong>
            {data.wonCount}
          </strong>
        </div>

        <div className="s2-stat">
          <span>Lost deals</span>
          <strong>
            {data.lostCount}
          </strong>
        </div>
      </div>

      {/* SALES FUNNEL */}
      <div className="s2-panel mt-3">
        <p className="crm-section-label">
          Funnel
        </p>

        <h2>Deals by stage</h2>

        <div className="leadership-funnel">

          {funnelData.map((item, index) => {
            const stageWidths = [100, 85, 70, 55, 40]
            const bottomWidths = [85, 70, 55, 40, 30]

            const height = Math.max(
              55,
              (item.count / max) * 110
            )

            return (
              <div
                className="leadership-funnel-stage"
                key={item.stage}
                style={{
                  height: `${height}px`,
                  '--funnel-top': `${stageWidths[index]}%`,
                  '--funnel-bottom': `${bottomWidths[index]}%`,
                }}
              >
                <div className="leadership-funnel-shape">
                  <div className="leadership-funnel-content">
                    <span>{labels[item.stage]}</span>
                    <strong>{item.count}</strong>
                  </div>
                </div>
              </div>
            )
          })}

        </div>
      </div>

    </section>
  )
}
