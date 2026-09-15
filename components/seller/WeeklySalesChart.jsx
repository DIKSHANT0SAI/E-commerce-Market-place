'use client';
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the necessary components from Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * WeeklySalesChart component
 * 
 * Renders a bar chart showing sales revenue for the last 7 days.
 * It uses the react-chartjs-2 library to create the chart.
 * 
 * @param {object} chartData - The data for the chart.
 * @param {string[]} chartData.labels - The labels for the x-axis (e.g., days of the week).
 * @param {number[]} chartData.data - The sales data for each corresponding label.
 */
const WeeklySalesChart = ({ chartData }) => {
  // Configuration for the chart's data.
  const data = {
    labels: chartData?.labels || [],
    datasets: [
      {
        label: 'Sales',
        data: chartData?.data || [],
        backgroundColor: 'rgba(234, 88, 12, 0.6)',
        borderColor: 'rgba(234, 88, 12, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Configuration for the chart's appearance and behavior.
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hides the legend
      },
      title: {
        display: false, // Hides the title
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // Custom callback to format y-axis labels as currency.
          callback: function(value) {
            return '₹' + value;
          }
        }
      },
      x: {
        grid: {
          display: false, // Hides the vertical grid lines
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Weekly Sales</h3>
      <p className="text-sm text-gray-500 mb-4">Revenue breakdown for the last 7 days.</p>
      <div className="h-64 sm:h-72 lg:h-80">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default WeeklySalesChart; 