  import React, { useState, useEffect } from "react";
  import Countdown from "react-countdown";
  import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } from "recharts";
  import "./style.css";

  const colors = {
    cvxPrisma: "var(--color-cvx-prisma)",
    yPRISMA: "var(--color-y-prisma)",
  };

  const formatAttributeName = (attribute) => {
    switch (attribute) {
      case "peg":
        return "PEG";
      case "lock_gain":
        return "LOCKS BY WEEK";
      case "current_boost_multiplier":
        return "BOOST MULTIPLIER";
      case "global_weight_ratio":
        return "GOVERNANCE SHARE";
      default:
        return attribute.replace(/_/g, " ").toUpperCase();
    }
  };

  const formatValue = (value, attribute, context = 'graph') => {
    if (attribute === "global_weight_ratio") {
      const decimalPlaces = context === 'table' ? 2 : context === 'table-tooltip' ? 0 : 0; // No decimals for table and graph
      return context === 'table-tooltip' ? value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }) : `${(value * 100).toFixed(decimalPlaces)}%`;
    } else if (attribute === "current_boost_multiplier") {
      return `${value.toFixed(2)}x`;
    } else if (attribute === "lock_gain") {
      return value.toLocaleString(); 
    } else if (attribute === "boost_fees_collected") {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    } else {
      return parseFloat(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  };

  const transformDataForChart = (data, attribute) => {
    const cvxPrismaData = data.liquid_lockers.cvxPrisma.weekly_data.map(
      (weekData) => ({
        name: `Week ${weekData.week_number}`,
        cvxPrisma: weekData[attribute],
      })
    );

    const yPRISMAData = data.liquid_lockers.yPRISMA.weekly_data.map(
      (weekData) => ({
        name: `Week ${weekData.week_number}`,
        yPRISMA: weekData[attribute],
      })
    );

    const mergedData = cvxPrismaData.map((cvxData, index) => ({
      ...cvxData,
      yPRISMA: yPRISMAData[index] ? yPRISMAData[index].yPRISMA : null,
    }));

    return mergedData;
  };

  const CustomTooltip = ({ active, payload, label, attribute }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: "var(--color-background)" }}>
          <p className="label">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.dataKey} {formatValue(entry.value, attribute, 'tooltip')}
            </p>
          ))}
        </div>
      );
    }

    return null;
  };

  const yAxisTickFormatter = (value, attribute) => {
    return formatValue(value, attribute);
  };

  const xAxisTickFormatter = (value) => {
    // Assuming the value is in the format "Week X"
    const weekNumber = value.replace(/Week /, '');
    return `W${weekNumber}`; // Shortened week format
  };

  const LineAreaChart = ({ data, attribute }) => (
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
          <YAxis tickFormatter={(value) => yAxisTickFormatter(value, attribute)} />
          <Tooltip
            content={<CustomTooltip attribute={attribute} />}
          />
          <Legend />
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const getNextResetTime = () => {
    const now = new Date();
    const nextReset = new Date(now);
    nextReset.setUTCDate(now.getUTCDay() >= 4 ? now.getUTCDate() + (11 - now.getUTCDay()) : now.getUTCDate() + (4 - now.getUTCDay()));
    nextReset.setUTCHours(0, 0, 0, 0);
    return nextReset;
  };

  const CountdownRenderer = ({ days, hours, minutes, seconds }) => {
    return (
      <span>
        {String(days).padStart(2, '0')}d{' '}
        {String(hours).padStart(2, '0')}h{' '}
        {String(minutes).padStart(2, '0')}m{' '}
        {String(seconds).padStart(2, '0')}s
      </span>
    );
  };

  const InfoMark = ({ children }) => (
    <span className="info-mark">ⓘ
      <span className="info-content">{children}</span>
    </span>
  );


  const ComparisonTable = ({ data, attributes }) => {
    if (!data || !data.liquid_lockers) return null;

    const cvxPrismaAPRData = data.liquid_lockers.cvxPrisma;
    const yPRISMAAPRData = data.liquid_lockers.yPRISMA;

    const cvxPrismaLastWeekData = cvxPrismaAPRData.weekly_data.slice(-1)[0] || {};
    const yPRISMALastWeekData = yPRISMAAPRData.weekly_data.slice(-1)[0] || {};

    return (
      <div className="table-container">
        <table>
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
                <InfoMark>
                  Unboosted APR:<br/><b>{formatValue((yPRISMAAPRData.current_lp_apr / 2) * 100, 'current_lp_apr')}%</b>
                </InfoMark>
              </td>
              <td>
                <span style={{
                  fontWeight: cvxPrismaAPRData.current_lp_apr >= yPRISMAAPRData.current_lp_apr ? 900 : 100
                }} >
                  {formatValue(cvxPrismaAPRData.current_lp_apr * 100, 'current_lp_apr')}%
                </span>
                <InfoMark>
                  Unboosted APR:<br/><b>{formatValue((cvxPrismaAPRData.current_lp_apr / 2) * 100, 'current_lp_apr')}%</b>
                </InfoMark>
              </td>
            </tr>
            {attributes.map((attribute) => {
              if (attribute === "weight") return null;
              if (attribute === "lock_gain") return null;
              if (attribute === "boost_fees_collected") return null;

              const cvxPrismaValue = formatValue(cvxPrismaLastWeekData[attribute], attribute, 'table');
              const yPRISMAValue = formatValue(yPRISMALastWeekData[attribute], attribute, 'table');
              const isEqual = cvxPrismaValue === yPRISMAValue;
              const isCvxPrismaHigher = cvxPrismaValue > yPRISMAValue;
              const attributeName = formatAttributeName(attribute);

              let cvxPrismaInfoContent = null;
              let yPRISMAInfoContent = null;

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
                );
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
                );
              } else if (attribute === "global_weight_ratio") {
                cvxPrismaInfoContent = (
                  <>
                    <p>Locker Weight:<br/><b>{formatValue(cvxPrismaLastWeekData.weight, attribute, 'table-tooltip')}</b></p>
                    <p>Global Weight:<br/><b>{formatValue(cvxPrismaLastWeekData.global_weight, attribute, 'table-tooltip')}</b></p>
                  </>
                );
                yPRISMAInfoContent = (
                  <>
                    <p>Locker Weight:<br/><b>{formatValue(yPRISMALastWeekData.weight, attribute, 'table-tooltip')}</b></p>
                    <p>Global Weight:<br/><b>{formatValue(yPRISMALastWeekData.global_weight, attribute, 'table-tooltip')}</b></p>
                  </>
                );
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
                    {yPRISMAInfoContent && <InfoMark>{yPRISMAInfoContent}</InfoMark>}
                  </td>
                  <td>
                    <span style={{
                      fontWeight: isEqual || isCvxPrismaHigher ? 900 : 100,
                    }}>
                      {cvxPrismaValue}
                    </span>

                    {cvxPrismaInfoContent && <InfoMark>{cvxPrismaInfoContent}</InfoMark>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const useDarkMode = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
      const root = window.document.documentElement;
      root.classList.remove(theme === 'light' ? 'dark' : 'light');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
    }, [theme]);

    return [theme, setTheme];
  };

  const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 1) return 'less than a minute ago';
    if (diffInMinutes === 1) return '1 minute ago';
    return `${diffInMinutes} minutes ago`;
  };

  const App = () => {
    const [data, setData] = useState(null);
    const [paletteIndex, setPaletteIndex] = useState(0);
    const [theme, setTheme] = useDarkMode();
    const [showRelativeTime, setShowRelativeTime] = useState(true);


    const toggleTheme = () => {
      setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const toggleUpdatedTime = () => {
      setShowRelativeTime(!showRelativeTime);
    };

    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await fetch(
            "https://raw.githubusercontent.com/wavey0x/open-data/master/prisma_liquid_locker_data.json"
          );
          const newData = await response.json();
          setData(newData); 
        } catch (error) {
          console.error("Error fetching data: ", error);
        }
      };

      fetchData();

      const handleKeyPress = (event) => {
        if (event.code === "KeyP") {
          const palettes = Array.from({ length: 20 }).map(
            (el, i) => "palette-" + (i + 1)
          );
          const nextPaletteIndex = (paletteIndex + 1) % palettes.length;
          setPaletteIndex(nextPaletteIndex);
          const selectedPalette = palettes[nextPaletteIndex];
          const rootElement = document.documentElement;
          palettes.forEach((palette) => rootElement.classList.remove(palette));
          rootElement.classList.add(selectedPalette);
        }
      };

      window.addEventListener("keydown", handleKeyPress);

      return () => {
        window.removeEventListener("keydown", handleKeyPress);
      };
    }, [paletteIndex]);
    
    const attributes = [
      "peg",
      "lock_gain",
      "current_boost_multiplier",
      "global_weight_ratio",
      "boost_fees_collected",
      // "weight"
    ];

    const [activeTab, setActiveTab] = useState('claiming');

    // Add this function inside the App component to handle tab changes
    const handleTabChange = (tab) => {
      setActiveTab(tab);
    };

    return (
      <div className="app-container">

        <div className="title-container">
          <h1 className="neon-text">
            Prisma Liquid Lockers
          </h1>
        </div>
        {activeTab === 'claiming' && data && (
          <>
            {data && <ComparisonTable data={data} attributes={attributes} />}
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
          </>
        )}
        {activeTab === 'history' && data && (
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
          </>
        )}
        <div className="footer">
          <div>
            <span
              className={`footer-tab ${activeTab === 'claiming' ? 'active' : ''}`}
              onClick={() => handleTabChange('claiming')}
            >
              Claiming
            </span>
            <span
              className={`footer-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => handleTabChange('history')}
            >
              History
            </span>
            <span
              className={`footer-tab ${activeTab === 'emissions' ? 'active' : ''}`}
              onClick={() => handleTabChange('emissions')}
            >
              Emissions
            </span>
          </div>
          <div className='toggle-switch'>
            <label>
              <input type='checkbox' onClick={toggleTheme} defaultChecked={theme === 'light'}/>
              <span className='slider'></span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  export default App;
