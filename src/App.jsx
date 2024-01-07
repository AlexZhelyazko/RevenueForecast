import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const App = () => {
  const [chartData, setChartData] = useState({
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
      {
        label: "Доходы",
        data: [100, 200, 300, 400, 500, 600, 700],
        fill: false,
        borderColor: "rgba(75,192,192,1)",
        tension: 0.1,
      },
      {
        label: "Расходы",
        data: [50, 100, 150, 200, 250, 300, 350],
        fill: false,
        borderColor: "rgba(255,99,132,1)",
        tension: 0.1,
      },
    ],
  });

  const [forecast, setForecast] = useState([]);
  const [forecastPeriod, setForecastPeriod] = useState(1);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      chartInstance.current = new Chart(ctx, {
        type: "line",
        data: chartData,
        options: {
          scales: {
            x: {
              title: {
                display: true,
                text: "Месяц",
              },
            },
            y: {
              title: {
                display: true,
                text: "Сумма",
              },
            },
          },
        },
      });
    }
  }, [chartData]);

  const polynomialRegression = (x, y, degree) => {
    const coeffs = Array(degree + 1).fill(0);
    const matrix = Array.from({ length: degree + 1 }, () =>
      Array(degree + 2).fill(0)
    );

    for (let i = 0; i < degree + 1; i++) {
      for (let j = 0; j < degree + 1; j++) {
        let sumX = 0;
        for (let k = 0; k < x.length; k++) {
          sumX += Math.pow(x[k], i + j);
        }
        matrix[i][j] = sumX;
      }
      let sumY = 0;
      for (let k = 0; k < y.length; k++) {
        sumY += Math.pow(x[k], i) * y[k];
      }
      matrix[i][degree + 1] = sumY;
    }

    const gauss = (mat, n) => {
      for (let i = 0; i < n; i++) {
        let maxEl = Math.abs(mat[i][i]);
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
          if (Math.abs(mat[k][i]) > maxEl) {
            maxEl = Math.abs(mat[k][i]);
            maxRow = k;
          }
        }
        for (let k = i; k < n + 1; k++) {
          const tmp = mat[maxRow][k];
          mat[maxRow][k] = mat[i][k];
          mat[i][k] = tmp;
        }
        for (let k = i + 1; k < n; k++) {
          const c = -mat[k][i] / mat[i][i];
          for (let j = i; j < n + 1; j++) {
            if (i === j) {
              mat[k][j] = 0;
            } else {
              mat[k][j] += c * mat[i][j];
            }
          }
        }
      }
      const x = Array(n).fill(0);
      for (let i = n - 1; i > -1; i--) {
        x[i] = mat[i][n] / mat[i][i];
        for (let k = i - 1; k > -1; k--) {
          mat[k][n] -= mat[k][i] * x[i];
        }
      }
      return x;
    };

    const result = gauss(matrix, degree + 1);
    for (let i = 0; i < degree + 1; i++) {
      coeffs[i] = result[i];
    }
    return coeffs;
  };

  const calculateForecast = (revenue, expenses, period) => {
    const profit = revenue.map((value, index) => value - expenses[index]);

    if (revenue.length < 2 || expenses.length < 2 || period < 1) {
      return Array(period).fill(NaN);
    }

    const result = polynomialRegression(
      revenue.map((_, index) => index),
      profit,
      2 // Degree of polynomial
    );

    const predictedProfit = [];
    for (let i = 1; i <= period; i++) {
      const predicted =
        result[0] +
        result[1] * (revenue.length + i) +
        result[2] * Math.pow(revenue.length + i, 2);
      predictedProfit.push(isNaN(predicted) ? 0 : predicted);
    }

    return predictedProfit;
  };

  // Rest of your React component remains the same...

  const handleForecastPeriodChange = (event) => {
    const period = parseInt(event.target.value);
    setForecastPeriod(period);
    const revenueData = chartData.datasets[0].data;
    const expensesData = chartData.datasets[1].data;
    const newForecast = calculateForecast(revenueData, expensesData, period);
    setForecast(newForecast);
    updateChartForecast(newForecast, period);
  };

  const handleInputChange = (index, value, datasetIndex) => {
    const updatedData = { ...chartData };
    updatedData.datasets[datasetIndex].data[index] = parseInt(value) || 0;
    setChartData(updatedData);

    if (datasetIndex === 0 && forecastPeriod > 0) {
      const revenueData = updatedData.datasets[0].data;
      const expensesData = updatedData.datasets[1].data;
      const newForecast = calculateForecast(
        revenueData,
        expensesData,
        forecastPeriod
      );
      setForecast(newForecast);
      updateChartForecast(newForecast, forecastPeriod);
    }
  };

  const updateChartForecast = (forecastData, period) => {
    if (chartInstance.current) {
      // Update chart with forecast data (similar to your previous implementation)
    }
  };

  return (
    <div className="App">
      <h1>Revenue Forecasting</h1>
      <div style={{ width: "80%", margin: "20px auto" }}>
        <div>
          <label>Доходы:</label>
          {chartData.datasets[0].data.map((value, index) => (
            <input
              key={index}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(index, e.target.value, 0)}
            />
          ))}
        </div>
        <div>
          <label>Расходы:</label>
          {chartData.datasets[1].data.map((value, index) => (
            <input
              key={index}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(index, e.target.value, 1)}
            />
          ))}
        </div>
        <input
          type="number"
          placeholder="Период прогнозирования"
          onChange={handleForecastPeriodChange}
          value={forecastPeriod}
        />
        <p>Прогноз прибыли/убытка: {forecast.join(", ")}</p>
        <canvas id="myChart" ref={chartRef} width="400" height="400"></canvas>
      </div>
    </div>
  );
};

export default App;
