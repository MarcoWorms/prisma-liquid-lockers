import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from 'react-router-dom'
import Countdown from "react-countdown"
import Markdown from 'react-markdown'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts"
import "./style.css"
import "./palettes.css"

const colors = {
  cvxPrisma: "var(--color-cvx-prisma)",
  yPRISMA: "var(--color-y-prisma)",
  ratio: "var(--color-text)",
}

const formatAttributeName = (attribute) => {
  switch (attribute) {
    case "peg":
      return "PEG"
    case "lock_gain":
      return "LOCKS BY WEEK"
    case "current_boost_multiplier":
      return "BOOST MULTIPLIER"
    case "global_weight_ratio":
      return "GOV SHARE"
    default:
      return attribute.replace(/_/g, " ").toUpperCase()
  }
}

const formatValue = (value, attribute, context = 'graph') => {
  if (attribute === "global_weight_ratio") {
    if (context === 'table-tooltip') {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    }
    const decimalPlaces = context === 'table' ? 2 : context === 'tooltip' ? 2 : 0 
    return `${(value * 100).toFixed(decimalPlaces)}%`
  } else if (attribute === "liquid_locker_weekly_dominance") {
    return `${(value * 100).toFixed(2)}%`
  } else if (attribute === "current_boost_multiplier") {
    return `${value.toFixed(2)}x`
  } else if (attribute === "peg") {
    return parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })
  } else if (attribute === "lock_gain") {
    return value.toLocaleString() 
  } else if (attribute === "boost_fees_collected") {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  } else {
    return parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
}

const transformDataForChart = (data, attribute) => {
  const cvxPrismaData = data.liquid_lockers.cvxPrisma.weekly_data.map(
    (weekData) => ({
      name: `Week ${weekData.week_number}`,
      cvxPrisma: weekData[attribute],
    })
  )

  const yPRISMAData = data.liquid_lockers.yPRISMA.weekly_data.map(
    (weekData) => ({
      name: `Week ${weekData.week_number}`,
      yPRISMA: weekData[attribute],
    })
  )

  const mergedData = cvxPrismaData.map((cvxData, index) => ({
    ...cvxData,
    yPRISMA: yPRISMAData[index] ? yPRISMAData[index].yPRISMA : null,
    Ratio: yPRISMAData[index] ? yPRISMAData[index].yPRISMA : null,
  }))

  return mergedData
}

const CustomTooltip = ({ active, payload, label, attribute }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ backgroundColor: "var(--color-background)" }}>
        <p className="label"><b>{label}</b></p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.dataKey} {formatValue(entry.value, attribute, 'tooltip')}
          </p>
        ))}
      </div>
    )
  }

  return null
}

const yAxisTickFormatter = (value, attribute) => {
  return formatValue(value, attribute)
}

const xAxisTickFormatter = (value) => {
  const weekNumber = value.replace(/Week /, '')
  return `W${weekNumber}`
}


const LineAreaChart = ({ data, attribute }) => {
  
  const lastWeekName = data.length > 0 ? data[data.length - 2].name : null;
  return (
    <div className="chart-container">
      <h3 className="chart-title">{formatAttributeName(attribute)}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 40,
            left: 30,
            bottom: 5,
          }}
        >
          <XAxis dataKey="name" tickFormatter={xAxisTickFormatter} />

          <YAxis tickFormatter={(value) => yAxisTickFormatter(value, attribute)} domain={
            attribute === 'current_boost_multiplier'
              ? [1,2]
              : attribute === 'liquid_locker_weekly_dominance'
                ?  [
                  Math.min(
                    data.reduce((acc, el) => (el.yPRISMA < acc) ? el.yPRISMA : acc, 100),
                    data.reduce((acc, el) => (el.cvxPRISMA < acc) ? el.cvxPRISMA : acc, 100)
                  ),
                  Math.max(
                    data.reduce((acc, el) => (el.yPRISMA > acc) ? el.yPRISMA : acc, 0),
                    data.reduce((acc, el) => (el.cvxPRISMA > acc) ? el.cvxPRISMA : acc, 0)
                  ),
                ] 
                : undefined
          }/>

          <Tooltip
            content={<CustomTooltip attribute={attribute} />}
          />
          <Legend />
          {lastWeekName && (
            <ReferenceArea x1={lastWeekName} strokeOpacity={0} fill="var(--color-text)" fillOpacity={0.1} />
          )}
          {attribute === 'liquid_locker_weekly_dominance' ? (
            <Line
              type="monotone"
              dataKey="Ratio"
              dot={false}
              activeDot={{
                stroke: colors.ratio,
                fill: colors.ratio,
                strokeWidth: 4,
              }}
              stroke={colors.ratio}
              strokeWidth={4}
            />
          ) : (<>
            <Line
              type="monotone"
              dataKey="yPRISMA"
              dot={false}
              activeDot={{
                stroke: colors.yPRISMA,
                fill: colors.yPRISMA,
                strokeWidth: 4,
              }}
              stroke={colors.yPRISMA}
              strokeWidth={4}
            />
            <Line
              type="monotone"
              dataKey="cvxPrisma"
              dot={false}
              activeDot={{
                stroke: colors.cvxPrisma,
                fill: colors.cvxPrisma,
                strokeWidth: 4,
              }}
              stroke={colors.cvxPrisma}
              strokeWidth={4}
            />
          </>)}
        </LineChart>
      </ResponsiveContainer>
      <p style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
        {attribute === 'adjusted_weight_capture' && (
            <span className="undertable" style={{width: "95%", opacity: 0.6, marginBottom: 0}}>
              Ratio of users's weekly weight gain to total net weekly weight gain, divided by user's starting governance share.
            </span>
        )}
        {attribute === 'liquid_locker_weekly_dominance' && (
          <p className="undertable" style={{width: "95%", opacity: 0.6, marginBottom: 0}}>
            Percentage of weekly emissions captured by liquid lockers through emission claims. 
          </p>
        )}
      </p>
    </div>
  )
}

const getNextResetTime = () => {
  const now = new Date()
  const nextReset = new Date(now)
  nextReset.setUTCDate(now.getUTCDay() >= 4 ? now.getUTCDate() + (11 - now.getUTCDay()) : now.getUTCDate() + (4 - now.getUTCDay()))
  nextReset.setUTCHours(0, 0, 0, 0)
  return nextReset
}

const CountdownRenderer = ({ days, hours, minutes, seconds }) => {
  return (
    <span>
      {String(days).padStart(2, '0')}d{' '}
      {String(hours).padStart(2, '0')}h{' '}
      {String(minutes).padStart(2, '0')}m{' '}
      {String(seconds).padStart(2, '0')}s
    </span>
  )
}

const InfoMark = ({ children, yearn, convex }) => (
  <span className={'info-mark'}>ⓘ
    <span className={'info-content' + (yearn ? ' yearn' : '') + (convex ? ' convex' : '')}>{children}</span>
  </span>
)


const ComparisonTable = ({ data, attributes }) => {
  if (!data || !data.liquid_lockers) return null

  const cvxPrismaAPRData = data.liquid_lockers.cvxPrisma
  const yPRISMAAPRData = data.liquid_lockers.yPRISMA

  const cvxPrismaLastWeekData = cvxPrismaAPRData.weekly_data.slice(-1)[0] || {}
  const yPRISMALastWeekData = yPRISMAAPRData.weekly_data.slice(-1)[0] || {}

  return (
    <div className="table-container">
      <table className="claim">
        <colgroup>
          <col className="col1" span="1" style={{ width: "24%" }} />
          <col className="col2" span="1" style={{ width: "38%" }} />
          <col className="col3" span="1" style={{ width: "38%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>
            </th>
            <th>
              <a
                target="_blank"
                className="link-container"
                href="https://yprisma.yearn.fi/"
              >
                <img
                  src="https://yprisma.yearn.fi/_next/image?url=https%3A%2F%2Fassets.smold.app%2Fapi%2Ftoken%2F1%2F0xe3668873D944E4A949DA05fc8bDE419eFF543882%2Flogo-128.png&w=64&q=75"
                  width="70px"
                />
                yPRISMA
              </a>
            </th>
            <th>
              <a
                target="_blank"
                className="link-container"
                href="https://prisma.convexfinance.com/"
              >
                <img
                  src="https://assets.coingecko.com/coins/images/32961/standard/cvxprisma.png?1700026172"
                  width="70px"
                />
                cvxPrisma
              </a>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>STAKING APR</td>
            <td
              style={{
                fontWeight:
                  yPRISMAAPRData.current_staking_apr ===
                    cvxPrismaAPRData.current_staking_apr ||
                  yPRISMAAPRData.current_staking_apr >
                    cvxPrismaAPRData.current_staking_apr
                    ? 900
                    : 100,
              }}
            >
              {(yPRISMAAPRData.current_staking_apr * 100).toFixed(2)}%
            </td>
            <td
              style={{
                fontWeight:
                  yPRISMAAPRData.current_staking_apr ===
                    cvxPrismaAPRData.current_staking_apr ||
                  yPRISMAAPRData.current_staking_apr <
                    cvxPrismaAPRData.current_staking_apr
                    ? 900
                    : 100,
              }}
            >
              {(cvxPrismaAPRData.current_staking_apr * 100).toFixed(2)}%
            </td>
          </tr>
          <tr>
            <td>LP APR</td>
            <td>
              <span style={{
                fontWeight: yPRISMAAPRData.current_lp_apr >= cvxPrismaAPRData.current_lp_apr ? 900 : 100
              }}>
                {formatValue(yPRISMAAPRData.current_lp_apr * 100, 'current_lp_apr')}%
              </span>
              <InfoMark yearn>
                Unboosted APR:<br/><b>{formatValue((yPRISMAAPRData.current_lp_apr / 2) * 100, 'current_lp_apr')}%</b>
              </InfoMark>
            </td>
            <td>
              <span style={{
                fontWeight: cvxPrismaAPRData.current_lp_apr >= yPRISMAAPRData.current_lp_apr ? 900 : 100
              }} >
                {formatValue(cvxPrismaAPRData.current_lp_apr * 100, 'current_lp_apr')}%
              </span>
              <InfoMark convex>
                Unboosted APR:<br/><b>{formatValue((cvxPrismaAPRData.current_lp_apr / 2) * 100, 'current_lp_apr')}%</b>
              </InfoMark>
            </td>
          </tr>
          {attributes.map((attribute) => {
            if (attribute === "weight") return null
            if (attribute === "lock_gain") return null
            if (attribute === "boost_fees_collected") return null
            if (attribute === "adjusted_weight_capture") return null
            if (attribute === "liquid_locker_weekly_dominance") return null

            const cvxPrismaValue = formatValue(cvxPrismaLastWeekData[attribute], attribute, 'table')
            const yPRISMAValue = formatValue(yPRISMALastWeekData[attribute], attribute, 'table')
            const isEqual = cvxPrismaValue === yPRISMAValue
            const isCvxPrismaHigher = cvxPrismaValue > yPRISMAValue
            const attributeName = formatAttributeName(attribute)

            let cvxPrismaInfoContent = null
            let yPRISMAInfoContent = null

            if (attribute === "current_boost_multiplier") {
              cvxPrismaInfoContent = (
                <>
                  <p>Max Boost Remaining:<br/><b>{cvxPrismaLastWeekData.remaining_boost_data.max_boost_remaining.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}</b></p>
                  <p>Allocated:<br/><b>{cvxPrismaLastWeekData.remaining_boost_data.max_boost_allocation.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}</b></p>
                  <p style={{fontWeight:100, fontSize: '0.9em'}}><i>Allocations of max boost refill every Thursday at 00:00 UTC</i></p>
                </>
              )
              yPRISMAInfoContent = (
                <>
                  <p>Max Boost Remaining:<br/><b>{yPRISMALastWeekData.remaining_boost_data.max_boost_remaining.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}</b></p>
                  <p>Allocated:<br/><b>{yPRISMALastWeekData.remaining_boost_data.max_boost_allocation.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}</b></p>
                  <p style={{fontWeight:100, fontSize: '0.9em'}}><i>Allocations of max boost refill every Thursday at 00:00 UTC</i></p>
                </>
              )
            } else if (attribute === "global_weight_ratio") {
              cvxPrismaInfoContent = (
                <>
                  <p>Locker Weight:<br/><b>{formatValue(cvxPrismaLastWeekData.weight, attribute, 'table-tooltip')}</b></p>
                  <p>Global Weight:<br/><b>{formatValue(cvxPrismaLastWeekData.global_weight, attribute, 'table-tooltip')}</b></p>
                </>
              )
              yPRISMAInfoContent = (
                <>
                  <p>Locker Weight:<br/><b>{formatValue(yPRISMALastWeekData.weight, attribute, 'table-tooltip')}</b></p>
                  <p>Global Weight:<br/><b>{formatValue(yPRISMALastWeekData.global_weight, attribute, 'table-tooltip')}</b></p>
                </>
              )
            }

            return (
              <tr key={attribute}>
                <td>{attributeName}</td>
                <td>
                  <span style={{
                    fontWeight: isEqual || !isCvxPrismaHigher ? 900 : 100,
                  }}>
                    {yPRISMAValue}
                  </span>
                  {yPRISMAInfoContent && <InfoMark yearn>{yPRISMAInfoContent}</InfoMark>}
                </td>
                <td>
                  <span style={{
                    fontWeight: isEqual || isCvxPrismaHigher ? 900 : 100,
                  }}>
                    {cvxPrismaValue}
                  </span>

                  {cvxPrismaInfoContent && <InfoMark convex>{cvxPrismaInfoContent}</InfoMark>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const DistributionScheduleTable = ({ distributionData }) => {
  return (
    <table className="emissions" style={{textAlign: 'center'}}>
      <thead>
        <tr>
          <th>Starting Date</th>
          <th>Emissions Schedule *</th>
        </tr>
      </thead>
      <tbody>
        {distributionData.map((item, index) => (
          <tr key={index} style={((new Date(item.end_ts * 1000) < new Date()) && item.end_ts !== 0) ? {opacity: 0.4} : {}} className={
            ((new Date(item.end_ts * 1000) >= new Date() || item.end_ts === 0) && (new Date(item.start_ts * 1000) <= new Date())) ? 'rainbow-row' : ''
          }>
            <td>{new Date(item.start_ts * 1000).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
            <td>{item.rate === 0 ? '-- **' : `${(item.rate).toFixed(2)}%`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const EmissionsTable = ({ emissionsData, week, distributionData, showEmissions, handleOutsideClick }) => {

  return  (
    <>
      
      <div className="table-container emi">
        <table className="emissions">
          <colgroup>
            <col span="1" style={{ width: "25%" }} />
            <col span="1" style={{ width: "20%" }} />
            <col span="1" style={{ width: "20%" }} />
            <col span="1" style={{ width: "15%" }} />
            <col span="1" style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr>
              <th className="emissions-cell">
                System Week
                <div className="emissions-tooltip tipone red">
                  <div className="emissions-tooltip-content">
                    Week value returned by prisma contract.
                  </div>
                </div>
              </th>
              <th className="emissions-cell">
                Allocated Emissions
                <div className="emissions-tooltip blue">
                  <div className="emissions-tooltip-content">
                    The amount of emissions allocated to go out in a given week.
                  </div>
                </div>
              </th>
              <th className="emissions-cell">
                Net Emissions Returned
                <div className="emissions-tooltip green">
                  <div className="emissions-tooltip-content">
                    Difference between allocated and consumed emissions + misc increases.
                  </div>
                </div>
              </th>
              <th className="emissions-cell">
                Lock Weeks
                <div className="emissions-tooltip tiplast pink">
                  <div className="emissions-tooltip-content">
                    Number of weeks that all claims are locked for.
                  </div>
                </div>
              </th>
              <th className="emissions-cell">
                Protocol Fee Distribution
                <div className="emissions-tooltip tiplast cyan">
                  <div className="emissions-tooltip-content">
                    Protocol fees are distributed to vePRISMA holders weekly.
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {emissionsData.map((emission, index) => (
              <tr key={index} className={ (emission.projected ? 'projected ' : '') + (emission.system_week === week ? ' current' : '')}>
                <td className="emissions-cell">
                  <span style={emission.system_week === week ? {fontWeight:500} : {}}>{emission.projected && (<span style={{fontSize: '0.5em', display: 'inline-block', verticalAlign: 'top'}}>*</span>)}
                    <span>{emission.system_week}</span> <pre style={{opacity: emission.projected ? 1 : 0.4, fontSize: '0.8em', wordWrap:'no', display: 'inline'}}>{new Date(emission.week_start_ts * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</pre>
                  </span>
                  <div className="emissions-tooltip tipone red">
                    <div className="emissions-tooltip-content">
                      <span>Emissons Week:</span>
                      <b>{emission.emissions_week}</b>
                      {emission.projected && (<>
                        <br/>
                        <span className="italic-disc">Next week projected value.</span>
                      </>)}
                    </div>
                  </div>
                </td>
                  {emission.projected ? (<>
                    <td className="emissions-cell">
                    <span style={emission.system_week === week ? {fontWeight:500} : {}}>{emission.allocated_emissions.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}</span>
                      <div className="emissions-tooltip blue">
                        <div className="emissions-tooltip-content">
                          <span className="italic-disc">Next week projected value.</span>
                        </div>
                      </div>
                    </td>
                
                  </>) : <td><span style={emission.system_week === week ? {fontWeight:500} : {}}>{emission.allocated_emissions.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}</span></td>}

                
                <td className={ emission.net_emissions_notes ? 'emissions-cell' : ''}>
                  <span style={emission.system_week === week ? {fontWeight:500} : {}}>{emission.net_emissions_notes && (<span style={{fontSize: '0.5em', display: 'inline-block', verticalAlign: 'top'}}>*</span>)}{emission.net_emissions_returned.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}</span>
                  {emission.net_emissions_notes && <div className="emissions-tooltip green">
                    <div className="emissions-tooltip-content">
                      <b><span>Notes:</span></b>
                      <Markdown>{emission.net_emissions_notes}</Markdown>
                      {emission.projected && (<>
                        <br/>
                        <span className="italic-disc">Next week projected value.</span>
                      </>)}
                    </div>
                  </div>}
                </td>
                <td className="emissions-cell">
                  <span style={emission.system_week === week ? {fontWeight:500} : {}}>{emission.lock_weeks}</span>
                  <div className="emissions-tooltip penalty pink">
                    <div className="emissions-tooltip-content">
                      <span>Withdraw Penalty:</span>
                      <b>{emission.penalty_pct.toFixed(2)}%</b>
                      {emission.projected && (<>
                        <br/>
                        <span className="italic-disc">Next week projected value.</span>
                      </>)}
                    </div>
                  </div>
                </td>
                <td className={emission.protocol_fee_distribution.total_value > 0 ? "emissions-cell" : ''}>
                  <span style={emission.system_week === week ? {fontWeight:500} : {}}>${emission.protocol_fee_distribution.total_value.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}</span>
                  {emission.protocol_fee_distribution.total_value > 0 && <div className="emissions-tooltip penalty cyan">
                    <div className="emissions-tooltip-content">
                      <span>Tokens:</span>
                      {emission.protocol_fee_distribution.distros.map(distro => (<p key={distro.symbol} style={{display: 'flex', flexDirection: 'column', animation: 'unset'}}>
                        <b style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}><img src={distro.token_logo_url} style={{marginRight: 5, width: 25}}/>{distro.symbol}</b>
                        ${distro.value.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>))}
                      
                      {emission.projected && (<>
                        <span className="italic-disc">Next week projected value.</span>
                      </>)}
                    </div>
                  </div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!showEmissions && (
        <div id="modalBackground" className="modal-background" onClick={handleOutsideClick}>
          <div className="modal">
            <DistributionScheduleTable distributionData={distributionData} />
            <p>*Weekly emissions as a percent of total remaining unallocated</p>
            <p>**Initial 4 weeks had 2,250,000 tokens emitted</p>
          </div>
        </div>
      )}
    </>
  )
}

const useDarkMode = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove(theme === 'light' ? 'dark' : 'light')
    root.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return [theme, setTheme]
}

const formatRelativeTime = (timestamp) => {
  const now = Date.now()
  const diffInSeconds = Math.floor((now - timestamp) / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 1) return 'less than a minute ago'
  if (diffInMinutes === 1) return '1 minute ago'
  return `${diffInMinutes} minutes ago`
}

const Toast = ({ message, show, onClose }) => {
  if (!show) return null

  return (
    <div className="toast" onClick={onClose}>
      {message}
    </div>
  )
}

const shortenAddress = (address) => `${address.slice(0, 5)}...${address.slice(-2)}`
const shortenENS = (ens) => ens.length > 20 ? `${ens.slice(0, 8)}...${ens.slice(-8)}` : ens

const BoostsTable = ({ boostsData, onSort, sortConfig, hideAllocationsSmallerThan200 }) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [timeoutId, setTimeoutId] = useState(-1);
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null); 

  const renderTooltip = (boost) => (
    <div className="boost-tooltip">
      <span style={{fontWeight: 900, fontSize: '1.2em'}}>{boost.delegate_ens ? boost.delegate_ens : shortenAddress(boost.boost_delegate)}</span><br /><br />
      <p>
        Max boost allocation:<br /><span style={{fontWeight: 900}}>{boost.max_boost_allocation.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}</span><br />
        Consumed: <span style={{fontWeight: 900}}>{boost.pct_max_consumed.toFixed(2)}%</span><br /><br />
      </p>
      <p>
        Decay boost allocation:<br /><span style={{fontWeight: 900}}>{boost.decay_boost_allocation.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}</span><br />
        Consumed: <span style={{fontWeight: 900}}>{boost.pct_decay_consumed.toFixed(2)}%</span>
      </p>
    </div>
  );

  const getHeaderClass = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === 'ascending' ? 'ascending' : 'descending';
  };

  const tooltips = {
    fee: "Amount charged by delegate to use their boost.",
    max_boost_remaining: "Amount of claim tokens this delegate can boost up to 2x before falling below 2x.",
    decay_boost_remaining: "After max boost is exhausted, boost is decayed linearly for this amount until it reaches 1x."
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setToastMessage(`Copied: ${text}`)
      setShowToast(false)
      setTimeout(() => {
        setShowToast(true)
        clearTimeout(timeoutId)
        setTimeoutId(setTimeout(() => setShowToast(false), 3000))
      }, 10)
    
    } catch (err) {
      console.error("Failed to copy: ", err)
      setToastMessage("Failed to copy address.")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  return (
    <div className="table-container">
      <table className="table-boosts">
        <colgroup>
          <col span="1" style={{ width: "31%" }} />
          <col span="1" style={{ width: "23%" }} />
          <col span="1" style={{ width: "23%" }} />
          <col span="1" style={{ width: "23%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Boost Delegate</th>
            <th className={getHeaderClass('fee') + ' emissions-cell'} onClick={() => onSort('fee')}>
              {sortConfig.key === 'fee' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : '*'} Fee
              <div className="emissions-tooltip blue">
                <div className="emissions-tooltip-content">{tooltips.fee}<br /><br /><i style={{opacity: 0.5}}>Click to sort</i></div>
              </div>
            </th>
            <th className={getHeaderClass('max_boost_remaining') + ' emissions-cell'} onClick={() => onSort('max_boost_remaining')}>
              {sortConfig.key === 'max_boost_remaining' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : '*'} Max Boost Remaining
              <div className="emissions-tooltip green">
                <div className="emissions-tooltip-content">{tooltips.max_boost_remaining}<br /><br /><i style={{opacity: 0.5}}>Click to sort</i></div>
              </div>
            </th>
            <th className={getHeaderClass('decay_boost_remaining') + ' emissions-cell'} onClick={() => onSort('decay_boost_remaining')}>
              {sortConfig.key === 'decay_boost_remaining' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : '*'} Decay Boost Remaining
              <div className="emissions-tooltip pink tiplast">
                <div className="emissions-tooltip-content">{tooltips.decay_boost_remaining}<br /><br /><i style={{opacity: 0.5}}>Click to sort</i></div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {boostsData.filter(boost => hideAllocationsSmallerThan200 && boost.max_boost_allocation < 200 ? false : true).map((boost, index) => (
            <tr key={index}
              onMouseEnter={() => setHoveredRowIndex(index)} 
              onMouseLeave={() => setHoveredRowIndex(null)}
            >
              <td className="clickable" onClick={() => copyToClipboard(boost.boost_delegate)}>
                {boost.delegate_ens ? boost.delegate_ens : shortenAddress(boost.boost_delegate)}
              </td>
              <td>{(boost.fee/100).toFixed(2)}%</td>
              <td>{boost.max_boost_remaining.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}</td>
              <td>{boost.decay_boost_remaining.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}</td>
              {hoveredRowIndex === index && renderTooltip(boost)}
            </tr>
          ))}
        </tbody>
      </table>
      <Toast message={toastMessage} show={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
};

const DataModal = ({ name, show, onClose, data, columns, renderRow, searchPlaceholder }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!show) return null;

  const filteredData = data.filter(item =>
    Object.values(item).some(value => value.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="modal-background alt" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{name}</h2>
        <input
          type="text"
          placeholder={searchPlaceholder || "Search..."}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {filteredData.length === 0 ? 'No matching rows were found.' : (
          <table className="modal-table">
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={index}>{column.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => renderRow(item, index))}
            </tbody>
          </table>
        ) }

      </div>
    </div>
  );
};

const App = () => {
  const [data, setData] = useState(null)
  const [theme, setTheme] = useDarkMode()
  const [showRelativeTime, setShowRelativeTime] = useState(true)
  const [showEmissions, setShowEmissions] = useState(true)
  const [sortConfig, setSortConfig] = useState({ key: 'fee', direction: 'ascending' })
  const [isDataStale, setIsDataStale] = useState(false);

  const [showFeesPaidModal, setShowFeesPaidModal] = useState(false);
  const [showEmissionsClaimedModal, setShowEmissionsClaimedModal] = useState(false);
  const [showFeesEarnedModal, setShowFeesEarnedModal] = useState(false);
  const [showReceiversByEmissionsModal, setShowReceiversByEmissionsModal] = useState(false);

  const [topAccountsByFeesPaid, setTopAccountsByFeesPaid] = useState([]);
  const [topAccountsByTotalEmissionsClaimed, setTopAccountsByTotalEmissionsClaimed] = useState([]);
  const [topBoostDelegatesByFeesEarned, setTopBoostDelegatesByFeesEarned] = useState([]);
  const [topReceiversByEmissionsClaimed, setTopReceiversByEmissionsClaimed] = useState([]);
  const [hideAllocationsSmallerThan200, setHideAllocationsSmallerThan200] = useState(true);

  const toggleHideAllocationsSmallerThan200 = () => {
    setHideAllocationsSmallerThan200(!hideAllocationsSmallerThan200)
  }

  useEffect(() => {
    fetchTopAccountsByFeesPaid();
    fetchTopAccountsByTotalEmissionsClaimed();
    fetchTopBoostDelegatesByFeesEarned();
    fetchTopReceiversByEmissionsClaimed();
  }, []);
  
  const fetchTopAccountsByFeesPaid = async () => {
    const response = await fetch('https://raw.githubusercontent.com/wavey0x/open-data/master/query_results/top_accounts_by_fees_paid.json');
    const data = await response.json();
    setTopAccountsByFeesPaid(data.data);
  };

  const fetchTopAccountsByTotalEmissionsClaimed = async () => {
    const response = await fetch('https://raw.githubusercontent.com/wavey0x/open-data/master/query_results/top_accounts_by_total_emissions_claimed.json');
    const data = await response.json();
    setTopAccountsByTotalEmissionsClaimed(data.data);
  };

  const fetchTopBoostDelegatesByFeesEarned = async () => {
    const response = await fetch('https://raw.githubusercontent.com/wavey0x/open-data/master/query_results/top_boost_delegates_by_fees_earned.json');
    const data = await response.json();
    setTopBoostDelegatesByFeesEarned(data.data);
  };

  const fetchTopReceiversByEmissionsClaimed = async () => {
    const response = await fetch('https://raw.githubusercontent.com/wavey0x/open-data/master/query_results/top_receivers_by_emissions_claimed.json');
    const data = await response.json();
    setTopReceiversByEmissionsClaimed(data.data);
  };

  const toggleTable = () => {
    setShowEmissions(!showEmissions)
  }
  
  const handleOutsideClick = (e) => {
    if (e.target.id === "modalBackground") {
      toggleTable()
    }
  }


  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const toggleUpdatedTime = () => {
    setShowRelativeTime(!showRelativeTime)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/wavey0x/open-data/master/prisma_liquid_locker_data.json"
        )
        const newData = await response.json()
        setData(newData)
        setSortConfig({ key: 'fee', direction: 'ascending' })
        const now = Date.now();
        const lastUpdated = newData.updated_at * 1000;
        const fiveHours = 5 * 60 * 60 * 1000;
        if (now - lastUpdated > fiveHours) {
          setIsDataStale(true);
        } else {
          setIsDataStale(false);
        }

      } catch (error) {
        console.error("Error fetching data: ", error)
      }
    }
    fetchData()
  }, [])
  
  const attributes = [
    "peg",
    "lock_gain",
    "current_boost_multiplier",
    "global_weight_ratio",
    "boost_fees_collected",
    "adjusted_weight_capture",
    "liquid_locker_weekly_dominance",

  ]

  const [activeTab, setActiveTab] = useState('dashboard')

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [location])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    navigate(`?tab=${tab}`)
  }

  const handleSort = (key) => {
    let direction = 'ascending'
    if (
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }
  
  useEffect(() => {
    if (!sortConfig.key || !data) return
    const sortedData = [...data.active_fowarders].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1
      }
      return 0
    })
    setData({ ...data, active_fowarders: sortedData })
  }, [sortConfig])

  useEffect(() => {
    setSortConfig({ key: 'fee', direction: 'ascending' })
  }, [])

  const Undertable = () => (
    <div className="undertable">
      <span>Week {data?.prisma_week}</span>
      <div className="countdown-container-text">
        <div className="countdown-container">
          <Countdown date={getNextResetTime()} renderer={CountdownRenderer} />
        </div>
      </div>
      {data?.updated_at && (
        <div
          className="updated-at"
          onClick={toggleUpdatedTime}
          style={{ cursor: 'pointer' }}
        >
          {showRelativeTime
            ? `Updated: ${formatRelativeTime(data.updated_at * 1000)}`
            : `Updated At: ${new Date(data.updated_at * 1000).toLocaleString()}`}
        </div>
      )}
    </div>   
  )

  return (
    <div className="app-container">
      {isDataStale ? (
        <div className="data-stale-banner">
          <p>Current data is stale. We are aware and working to fix it.</p>
        </div>
      ) : data && (
        <div className="data-normal-banner">
          <div>
            <img width="36px" src={data.token_info['0xdA47862a83dac0c112BA89c6abC2159b95afd71C'].token_logo_url} />
            <span>{data.token_info['0xdA47862a83dac0c112BA89c6abC2159b95afd71C'].symbol}: <b>${data.token_info['0xdA47862a83dac0c112BA89c6abC2159b95afd71C'].price.toFixed(4)}</b></span>
          </div>
          <div>
            <img width="36px" src={data.token_info['0x4591DBfF62656E7859Afe5e45f6f47D3669fBB28'].token_logo_url} />
            <span>{data.token_info['0x4591DBfF62656E7859Afe5e45f6f47D3669fBB28'].symbol}: <b>${data.token_info['0x4591DBfF62656E7859Afe5e45f6f47D3669fBB28'].price.toFixed(4)}</b></span>
          </div>
          <div>
            <img width="36px" src={data.token_info['0x35282d87011f87508D457F08252Bc5bFa52E10A0'].token_logo_url} />
            <span>{data.token_info['0x35282d87011f87508D457F08252Bc5bFa52E10A0'].symbol}: <b>${data.token_info['0x35282d87011f87508D457F08252Bc5bFa52E10A0'].price.toFixed(4)}</b></span>
          </div>
        </div>
      )}
      <div className='toggle-switch'>
        <label className="switch">
          <input type='checkbox' onClick={toggleTheme} defaultChecked={theme === 'light'}/>
          <span className='slider'></span>
        </label>
      </div>

      <div className="title-container">
        <h1 className="neon-text">
          Prisma Liquid Lockers
        </h1>
      </div>
      {activeTab === 'dashboard' && data && (
        <>
          {data && <ComparisonTable data={data} attributes={attributes} />}
          <Undertable />
        </>
      )}
      {activeTab === 'charts' && data && (
        <>
          {data &&
            attributes.map((attribute) => (
              <div key={attribute} className="chart-wrapper">
                <LineAreaChart
                  data={transformDataForChart(data, attribute)}
                  attribute={attribute}
                />
              </div>
            ))
          }
          <Undertable />
        </>
      )}
      {activeTab === 'emissions' && data && (
        <>
          <button className="toggle-table" onClick={toggleTable}>
            View all scheduled emissions changes
          </button>
          <EmissionsTable emissionsData={data.emissions_schedule} week={data.prisma_week} distributionData={data.distribution_schedule} showEmissions={showEmissions} handleOutsideClick={handleOutsideClick} />
          <Undertable />
        </>
      )}
      {activeTab === 'boosts' && data && (
        <>
          <div className="modal-buttons-container">
            <button className="toggle-table" onClick={() => setShowFeesPaidModal(true)}>Top Accounts by Fees Paid</button>
            <button className="toggle-table" onClick={() => setShowEmissionsClaimedModal(true)}>Top Accounts by Emissions Claimed</button>
            <button className="toggle-table" onClick={() => setShowFeesEarnedModal(true)}>Top Boost Delegates by Fees Earned</button>
            <button className="toggle-table" onClick={() => setShowReceiversByEmissionsModal(true)}>Top Receivers by Emissions Claimed</button>
          </div>
          <span className="boosts-disclaimer">The following table displays all boost delegates who have opt-ed into the new architecture which allows liquid lockers users to claim using their boost. We hope that surfacing this data will help encourage a more efficient and competitive marketplace.</span>
          <div className="check-container">  
            <label for="hideAllocationsSmallerThan200">
              <input type="checkbox" id="hideAllocationsSmallerThan200" checked={hideAllocationsSmallerThan200} onChange={toggleHideAllocationsSmallerThan200} />
              <i className="filter200">Hide users with allocations smaller than 200</i>
            </label>
          </div>
          {/* Top Accounts by Fees Paid Modal */}
          <DataModal
            name="Top Accounts by Fees Paid"
            show={showFeesPaidModal}
            onClose={() => setShowFeesPaidModal(false)}
            data={topAccountsByFeesPaid}
            columns={[
              { title: "Account" },
              { title: "Total Fees Paid" }
            ]}
            renderRow={(item, index) => (
              <tr key={index}>
                <td>{shortenENS(item.ens) || shortenAddress(item.account)}</td>
                <td>{item.total_fees_paid.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}</td>
              </tr>
            )}
            searchPlaceholder="Search by account or ENS..."
          />

          {/* Top Accounts by Emissions Claimed Modal */}
          <DataModal
            name="Top Accounts by Emissions Claimed"
            show={showEmissionsClaimedModal}
            onClose={() => setShowEmissionsClaimedModal(false)}
            data={topAccountsByTotalEmissionsClaimed}
            columns={[
              { title: "Account" },
              { title: "Total Emissions Claimed" }
            ]}
            renderRow={(item, index) => (
              <tr key={index}>
                <td>{shortenENS(item.ens) || shortenAddress(item.account)}</td>
                <td>{item.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}</td>
              </tr>
            )}
            searchPlaceholder="Search by account or ENS..."
          />

          {/* Top Boost Delegates by Fees Earned Modal */}
          <DataModal
            name="Top Boost Delegates by Fees Earned"
            show={showFeesEarnedModal}
            onClose={() => setShowFeesEarnedModal(false)}
            data={topBoostDelegatesByFeesEarned}
            columns={[
              { title: "Boost Delegate" },
              { title: "Earned Fees" }
            ]}
            renderRow={(item, index) => (
              <tr key={index}>
                <td>{shortenENS(item.ens) || shortenAddress(item.boost_delegate)}</td>
                <td>{item.earned_fees.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}</td>
              </tr>
            )}
            searchPlaceholder="Search by delegate or ENS..."
          />

          {/* Top Receivers by Emissions Claimed Modal */}
          <DataModal
            name="Top Receivers by Emissions Claimed"
            show={showReceiversByEmissionsModal}
            onClose={() => setShowReceiversByEmissionsModal(false)}
            data={topReceiversByEmissionsClaimed}
            columns={[
              { title: "Receiver" },
              { title: "Total Emissions Claimed" }
            ]}
            renderRow={(item, index) => (
              <tr key={index}>
                <td>{shortenENS(item.ens) || shortenAddress(item.receiver)}</td>
                <td>{item.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}</td>
              </tr>
            )}
            searchPlaceholder="Search by receiver or ENS..."
          />
          <BoostsTable boostsData={data.active_fowarders} onSort={handleSort} sortConfig={sortConfig} hideAllocationsSmallerThan200={hideAllocationsSmallerThan200} />
          <Undertable />
        </>
      )}
      <div className="footer">
        <div className="footer-tabs">
          <span
            className={`footer-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            Dashboard
          </span>
          <span
            className={`footer-tab ${activeTab === 'charts' ? 'active' : ''}`}
            onClick={() => handleTabChange('charts')}
          >
            Charts
          </span>
          <span
            className={`footer-tab ${activeTab === 'emissions' ? 'active' : ''}`}
            onClick={() => handleTabChange('emissions')}
          >
            Emissions
          </span>
          <span
            className={`footer-tab ${activeTab === 'boosts' ? 'active' : ''}`}
            onClick={() => handleTabChange('boosts')}
          >
            Boosts
          </span>
        </div>
      </div>
    </div>
  )
}

export default App
