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
import { Terminal, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { AIScoreData } from '../lib/aiScoreUtils';

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
  aiScores?: Record<number, AIScoreData>;
}

// Get AI Score color based on score
const getAIScoreColor = (score: number) => {
  if (score >= 90) return 'rgba(74, 222, 128, 0.9)'; // green-400
  if (score >= 85) return 'rgba(96, 165, 250, 0.9)'; // blue-400
  if (score >= 80) return 'rgba(45, 212, 191, 0.9)'; // teal-400
  return 'rgba(250, 204, 21, 0.9)'; // yellow-400
};

// Get AI Score border color based on score
const getAIScoreBorderColor = (score: number) => {
  if (score >= 90) return 'rgba(74, 222, 128, 1)'; // green-400
  if (score >= 85) return 'rgba(96, 165, 250, 1)'; // blue-400
  if (score >= 80) return 'rgba(45, 212, 191, 1)'; // teal-400
  return 'rgba(250, 204, 21, 1)'; // yellow-400
};

const VoteChart: React.FC<VoteChartProps> = ({ candidates, voteCounts, aiScores = {} }) => {
  // Log AI scores for debugging
  console.log("Chart AI Scores:", 
    candidates.map(c => ({ id: c.id, name: c.name, score: aiScores[c.id]?.score || 85 })));
  
  const chartData = {
    labels: candidates.map(c => c.name),
    datasets: [
      {
        label: 'Total Votes',
        data: candidates.map(c => voteCounts[c.id] || 0),
        backgroundColor: '#9ACD32',
        borderColor: '#9ACD32',
        borderWidth: 1,
        hoverBackgroundColor: '#FFFFFF',
        hoverBorderColor: '#FFFFFF',
        barPercentage: 0.7,
      },
      {
        label: 'AI Score',
        data: candidates.map(c => {
          const score = aiScores[c.id]?.score || 85;
          const voteCount = voteCounts[c.id] || 0;
          // Return value based on the vote count percentage and AI score
          return score > 0 ? voteCount * (score / 100) : voteCount * 0.85;
        }),
        backgroundColor: candidates.map(c => getAIScoreColor(aiScores[c.id]?.score || 85)),
        borderColor: candidates.map(c => getAIScoreBorderColor(aiScores[c.id]?.score || 85)),
        borderWidth: 2,
        hoverBackgroundColor: candidates.map(c => getAIScoreBorderColor(aiScores[c.id]?.score || 85)),
        hoverBorderColor: 'rgba(255, 255, 255, 1)',
        barPercentage: 0.4,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#9ACD32',
          font: {
            family: 'monospace',
            size: 10
          },
          boxWidth: 12,
          padding: 10
        }
      },
      title: {
        display: true,
        text: 'Vote Distribution & AI Score',
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
        displayColors: true,
        borderColor: '#9ACD32',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const labelIndex = context.datasetIndex;
            const value = context.raw;
            const candidateId = candidates[context.dataIndex].id;
            
            if (labelIndex === 0) {
              return `Total Votes: ${value}`;
            } else if (labelIndex === 1) {
              const aiScore = aiScores[candidateId]?.score || 85;
              return `AI Score: ${aiScore}%`;
            }
            return '';
          }
        }
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
        <div className="flex items-center text-xs text-[#9ACD32]/70 space-x-2">
          <ShieldCheck size={14} className="text-[#9ACD32]" />
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            AI SCORE ANALYSIS
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