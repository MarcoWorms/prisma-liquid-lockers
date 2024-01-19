import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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
      return "LOCKER PEG";
    case "lock_gain":
      return "LOCKS THIS WEEK";
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

const LineAreaChart = ({ data, attribute }) => (
  <div className="chart-container">
    <h3 className="chart-title">{formatAttributeName(attribute)}</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        {/* <CartesianGrid strokeDasharray="10" /> */}
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          contentStyle={{ backgroundColor: "var(--color-background)" }}
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

const ComparisonTable = ({ data, attributes }) => {
  if (!data || !data.liquid_lockers) return null;

  // Extract the APR data from the root of cvxPrisma and yPRISMA
  const cvxPrismaAPRData = data.liquid_lockers.cvxPrisma;
  const yPRISMAAPRData = data.liquid_lockers.yPRISMA;

  // Extract the last week's data from both cvxPrisma and yPRISMA
  const cvxPrismaLastWeekData = cvxPrismaAPRData.weekly_data.slice(-1)[0] || {};
  const yPRISMALastWeekData = yPRISMAAPRData.weekly_data.slice(-1)[0] || {};

  return (
    <div className="table-container">
      <table>
        <colgroup>
          <col span="1" style={{ width: "33%" }} />
          <col span="1" style={{ width: "33%" }} />
          <col span="1" style={{ width: "33%" }} />
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th>
              <a
                target="_blank"
                style={{
                  color: "var(--color-text)",
                  fontSize: 12,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
                href="https://yprisma.yearn.fi/"
              >
                <img
                  src="https://yprisma.yearn.fi/_next/image?url=https%3A%2F%2Fassets.smold.app%2Fapi%2Ftoken%2F1%2F0xe3668873D944E4A949DA05fc8bDE419eFF543882%2Flogo-128.png&w=64&q=75"
                  width="64px"
                />
                yPRISMA
              </a>
            </th>
            <th>
              <a
                target="_blank"
                style={{
                  color: "var(--color-text)",
                  fontSize: 12,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
                href="https://prisma.convexfinance.com/"
              >
                <img
                  src="https://assets.coingecko.com/coins/images/32961/standard/cvxprisma.png?1700026172"
                  width="64px"
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

const App = () => {
  const [data, setData] = useState(null);
  const [paletteIndex, setPaletteIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://wavey.info/data/prisma_liquid_locker_data.json"
        );
        const newData = await response.json();
        setData(newData); // Set the entire data object
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();

    // Function to handle key press
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

    // Add event listener for key press
    window.addEventListener("keydown", handleKeyPress);

    // Cleanup event listener
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [paletteIndex]);

  const attributes = [
    "peg",
    "lock_gain",
    "current_boost_multiplier",
    "global_weight_ratio",
    // "weight" // This attribute is skipped in the table
  ];

  return (
    <div className="app-container">
      <div className="title-container">
        <h1 className="neon-text">
          <span className="block-line">Prisma Liquid Lockers</span>
        </h1>
      </div>
      {data && <ComparisonTable data={data} attributes={attributes} />}
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
