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

const formatValue = (value, attribute) => {
  if (attribute === "global_weight_ratio") {
    return `${(value * 100).toFixed(2)}%`;
  } else if (attribute === "current_boost_multiplier") {
    return `${value.toFixed(2)}x`;
  } else if (attribute === "lock_gain") {
    return value.toLocaleString();
  } else {
    return parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
};

const transformData = (data) => {
  const cvxPrismaData = data.liquid_lockers.cvxPrisma.weekly_data;
  const yPRISMAData = data.liquid_lockers.yPRISMA.weekly_data;

  const mergedData = cvxPrismaData.map((cvxData, index) => {
    const yData = yPRISMAData[index] || {};
    const weekData = {
      name: `Week ${cvxData.week_number}`,
      cvxPrisma: {},
      yPRISMA: {},
    };
    for (const key in cvxData) {
      if (key !== "week_number") {
        weekData.cvxPrisma[key] = cvxData[key];
        weekData.yPRISMA[key] = yData[key] || null;
      }
    }
    return weekData;
  });

  return mergedData;
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ backgroundColor: "var(--color-background)" }}>
        <p className="label">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {formatAttributeName(entry.name)}: {formatValue(entry.value, entry.name)}
          </p>
        ))}
      </div>
    );
  }

  return null;
};
// Custom tick formatter for the YAxis
const yAxisTickFormatter = (value, attribute) => {
  return formatValue(value, attribute);
};

// Custom tick formatter for the XAxis
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
          content={<CustomTooltip />}
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
          <col span="1" style={{ width: "24%" }} />
          <col span="1" style={{ width: "43%" }} />
          <col span="1" style={{ width: "43%" }} />
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
            <td
              style={{
                fontWeight:
                  yPRISMAAPRData.current_lp_apr ===
                    cvxPrismaAPRData.current_lp_apr ||
                  yPRISMAAPRData.current_lp_apr >
                    cvxPrismaAPRData.current_lp_apr
                    ? 900
                    : 100,
              }}
            >
              {(yPRISMAAPRData.current_lp_apr * 100).toFixed(2)}%
            </td>
            <td
              style={{
                fontWeight:
                  yPRISMAAPRData.current_lp_apr ===
                    cvxPrismaAPRData.current_lp_apr ||
                  yPRISMAAPRData.current_lp_apr <
                    cvxPrismaAPRData.current_lp_apr
                    ? 900
                    : 100,
              }}
            >
              {(cvxPrismaAPRData.current_lp_apr * 100).toFixed(2)}%
            </td>
          </tr>
          {attributes.map((attribute) => {
            if (attribute === "weight") return null;
            if (attribute === "lock_gain") return null;
            const cvxPrismaValue = formatValue(
              cvxPrismaLastWeekData[attribute],
              attribute
            );
            const yPRISMAValue = formatValue(
              yPRISMALastWeekData[attribute],
              attribute
            );
            const isEqual = cvxPrismaValue === yPRISMAValue;
            const isCvxPrismaHigher = cvxPrismaValue > yPRISMAValue;
            const attributeName = formatAttributeName(attribute);
            return (
              <tr key={attribute}>
                <td>{attributeName}</td>
                <td
                  style={{
                    fontWeight: isEqual || !isCvxPrismaHigher ? 900 : 100,
                  }}
                >
                  {yPRISMAValue}
                </td>
                <td
                  style={{
                    fontWeight: isEqual || isCvxPrismaHigher ? 900 : 100,
                  }}
                >
                  {cvxPrismaValue}
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
          "https://wavey.info/data/prisma_liquid_locker_data.json"
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
        const palettes = Array.from({ length: 6 }).map(
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
    // "weight"
  ];

  return (
      <div className="app-container">

      <div class = 'toggle-switch' >
        <label>
          <input type='checkbox' onClick={toggleTheme} defaultChecked={theme === 'light'}/>
          <span className='slider'></span>
        </label>
      </div>

      <div className="title-container">
      <h1 className="neon-text">
        <span className="block-line">Prisma Liquid Lockers</span>
      </h1>
      </div>
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

      {data &&
        attributes.map((attribute) => (
          <div key={attribute} className="chart-wrapper">
            <LineAreaChart
              data={transformDataForChart(data, attribute)}
              attribute={attribute}
            />
          </div>
        ))}
    </div>
  );
};

export default App;
