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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface VoteChartProps {
  candidates: any[];
  voteCounts: Record<number, number>;
}

const VoteChart: React.FC<VoteChartProps> = ({ candidates, voteCounts }) => {
  const chartData = {
    labels: candidates.map(c => c.name),
    datasets: [
      {
        label: 'Votes',
        data: candidates.map(c => voteCounts[c.id] || 0),
        backgroundColor: 'rgba(173, 235, 0, 0.8)',
        borderColor: 'rgba(173, 235, 0, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Vote Distribution',
        color: 'rgba(173, 235, 0, 1)',
        font: {
          family: '"Share Tech Mono", monospace',
          size: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(173, 235, 0, 1)',
        bodyColor: '#ffffff',
        titleFont: {
          family: '"Share Tech Mono", monospace',
        },
        bodyFont: {
          family: '"Rajdhani", sans-serif',
        },
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
          font: {
            family: '"Share Tech Mono", monospace',
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
          font: {
            family: '"Share Tech Mono", monospace',
          },
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="w-full h-64">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default VoteChart;