'use client';
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // Needed for filling the area under the line
} from 'chart.js';

// Register the necessary components from Chart.js for a Line chart.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * MonthlyRevenueChart component
 * 
 * Renders a line chart showing the revenue trend over the last 6 months.
 * It includes a filled area under the line for better visual impact.
 * 
 * @param {object} chartData - The data for the chart.
 * @param {string[]} chartData.labels - The labels for the x-axis (e.g., month names).
 * @param {number[]} chartData.data - The revenue data for each corresponding month.
 */
const MonthlyRevenueChart = ({ chartData }) => {
  // Configuration for the chart's data.
  const data = {
    labels: chartData?.labels || [],
    datasets: [
      {
        label: 'Revenue',
        data: chartData?.data || [],
        fill: true, // This enables the colored area under the line
        backgroundColor: 'rgba(234, 88, 12, 0.1)', // Light orange for the fill
        borderColor: 'rgba(234, 88, 12, 1)', // Solid orange for the line
        tension: 0.4, // This makes the line smooth/curvy
        pointRadius: 4, // Shows points on the line
        pointBackgroundColor: 'rgba(234, 88, 12, 1)',
      },
    ],
  };

  // Configuration for the chart's appearance and behavior.
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true, // Ensures the y-axis starts at 0
        ticks: {
          // Custom callback to format y-axis labels as currency (e.g., ₹7k).
          callback: function(value) {
            if (value >= 1000) {
                return '₹' + value / 1000 + 'k';
            }
            return '₹' + value;
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Monthly Revenue Progression</h3>
      <p className="text-sm text-gray-500 mb-4">Displays revenue trends over the last 6 months.</p>
      <div className="h-64 sm:h-72 lg:h-80">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default MonthlyRevenueChart; 