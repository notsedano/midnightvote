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
import { Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

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
        backgroundColor: '#9ACD32',
        borderColor: '#9ACD32',
        borderWidth: 1,
        hoverBackgroundColor: '#FFFFFF',
        hoverBorderColor: '#FFFFFF',
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
        color: '#9ACD32',
        font: {
          family: 'monospace',
          size: 16,
          weight: 'bold' as const
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#9ACD32',
        bodyColor: '#9ACD32',
        titleFont: {
          family: 'monospace',
          weight: 'bold' as const
        },
        bodyFont: {
          family: 'monospace',
        },
        padding: 10,
        displayColors: false,
        borderColor: '#9ACD32',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(154, 205, 50, 0.2)',
        },
        ticks: {
          color: '#9ACD32',
          font: {
            family: 'monospace',
            size: 10
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(154, 205, 50, 0.2)',
        },
        ticks: {
          color: '#9ACD32',
          font: {
            family: 'monospace',
            size: 10
          },
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="border border-[#9ACD32] bg-black p-3 mb-6">
      <div className="border-b border-[#9ACD32]/50 pb-2 mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal size={16} className="text-[#9ACD32]" />
          <span className="text-[#9ACD32] font-mono text-sm">VOTE DISTRIBUTION</span>
        </div>
        <div className="text-xs text-[#9ACD32]/70">
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ANALYZING
          </motion.span>
        </div>
      </div>
      <div className="w-full h-64 p-2 bg-black font-mono">
        <Bar data={chartData} options={chartOptions} />
      </div>
      <div className="border-t border-[#9ACD32]/30 mt-3 pt-2 text-xs text-[#9ACD32]/70 flex justify-between">
        <span>TOTAL VOTES: {Object.values(voteCounts).reduce((a, b) => a + b, 0)}</span>
        <span>LAST UPDATED: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default VoteChart;