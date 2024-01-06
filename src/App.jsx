import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
const regression = require("regression");

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

  const calculateForecast = (revenue, expenses, period) => {
    const profit = revenue.map((value, index) => value - expenses[index]);
    const lastRevenueIndex = revenue.length - 1;

    const result = regression.linear(
      revenue.map((_, index) => [index]),
      profit.map((value) => [value])
    );

    const predictedProfit = [];
    for (let i = 1; i <= period; i++) {
      const predicted = result.predict(lastRevenueIndex + i)[1];
      predictedProfit.push(predicted > 0 ? predicted : 0);
    }

    return predictedProfit;
  };

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
      if (chartInstance.current.data.datasets.length > 2) {
        chartInstance.current.data.datasets.pop();
      }

      const lastLabel =
        chartInstance.current.data.labels[
          chartInstance.current.data.labels.length - 1
        ];
      const nextLabels = Array.from(
        { length: period },
        (_, i) => `Forecast ${i + 1 + parseInt(lastLabel)}`
      );
      chartInstance.current.data.labels =
        chartInstance.current.data.labels.slice(0, chartData.labels.length);
      chartInstance.current.data.labels.push(...nextLabels);

      const forecastDataSet = {
        label: "Прогноз прибыли/убытка",
        data: [
          ...chartInstance.current.data.datasets[0].data.slice(-1),
          ...forecastData.slice(0, period),
        ],
        fill: false,
        borderColor: "rgba(0,0,255,1)",
        tension: 0.1,
      };

      chartInstance.current.data.datasets.push(forecastDataSet);
      chartInstance.current.update();
    }
  };

  return (
    <div className="App">
      <h1>Прогнозирование прибыли</h1>
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
