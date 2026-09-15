'use client';
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the necessary components from Chart.js for a Doughnut chart.
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

/**
 * CategorySalesChart component
 * 
 * Renders a doughnut chart showing the distribution of sales across different product categories.
 * If no data is available, it displays a fallback message.
 * 
 * @param {object} chartData - The data for the chart.
 * @param {string[]} chartData.labels - The names of the categories.
 * @param {number[]} chartData.data - The sales data for each corresponding category.
 */
const CategorySalesChart = ({ chartData }) => {
  // Check if there is any data to display in the chart.
  const hasData = chartData && chartData.data && chartData.data.length > 0;

  // Configuration for the chart's data, including colors for the segments.
  const data = {
    labels: chartData?.labels || [],
    datasets: [
      {
        label: 'Sales',
        data: chartData?.data || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Configuration for the chart's appearance and behavior.
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top', // Position the legend at the top
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Category Sales Distribution</h3>
      <p className="text-sm text-gray-500 mb-4">Percentage of sales across different product categories.</p>
      {/* Conditionally render the chart or a fallback message */}
      <div className="flex-grow flex items-center justify-center h-64 sm:h-72 lg:h-80">
        {hasData ? (
          <Doughnut data={data} options={options} />
        ) : (
          <p className="text-sm text-gray-400">No category sales data yet.</p>
        )}
      </div>
    </div>
  );
};

export default CategorySalesChart; 