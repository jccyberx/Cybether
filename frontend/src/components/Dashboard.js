import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import {
  Chart,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import api from '../api';

Chart.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [threatLevel, setThreatLevel] = useState(null);
  const [maturityRating, setMaturityRating] = useState(null);
  const [risks, setRisks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendPoints, setTrendPoints] = useState([]);

  // Fetch functions using useCallback
  const fetchThreatLevel = useCallback(async () => {
    try {
      const response = await api.get('/api/threat-level');
      setThreatLevel(response.data);
    } catch (error) {
      console.error('Error fetching threat level:', error);
    }
  }, []);

  const fetchMaturityRating = useCallback(async () => {
    try {
      const response = await api.get('/api/maturity-rating');
      setMaturityRating(response.data);
    } catch (error) {
      console.error('Error fetching maturity rating:', error);
    }
  }, []);

  const fetchRisks = useCallback(async () => {
    try {
      const response = await api.get('/api/risks');
      setRisks(response.data);
    } catch (error) {
      console.error('Error fetching risks:', error);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }, []);

  const fetchCompliance = useCallback(async () => {
    try {
      const response = await api.get('/api/compliance');
      // Filter only supported frameworks
      const supportedFrameworks = ['PCI DSS', 'NIST CSF', 'ISO 27001', 'SOC 2'];
      const filteredCompliance = response.data.filter(
        framework => supportedFrameworks.includes(framework.name)
      );
      setCompliance(filteredCompliance);
    } catch (error) {
      console.error('Error fetching compliance:', error);
    }
  }, []);

  // Combined fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchThreatLevel(),
        fetchMaturityRating(),
        fetchRisks(),
        fetchProjects(),
        fetchCompliance()
      ]);

      // Add the trend points fetch here
      const trendResponse = await api.get('/api/maturity-trend');
      if (trendResponse.data) {
        setTrendPoints(trendResponse.data.sort((a, b) => a.month.localeCompare(b.month)));
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchThreatLevel, fetchMaturityRating, fetchRisks, fetchProjects, fetchCompliance]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const getThreatLevelColor = (level) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'Increasing') return <ArrowUpIcon className="h-5 w-5 text-green-500" />;
    if (trend === 'Decreasing') return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
    return <MinusIcon className="h-5 w-5 text-gray-500" />;
  };

  // Chart data for compliance
  const complianceChartData = {
    labels: compliance.map(f => f.name),
    datasets: [{
      data: compliance.map(f => f.current_score),
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',  // PCI DSS
        'rgba(75, 192, 192, 0.8)',  // NIST CSF
        'rgba(153, 102, 255, 0.8)', // ISO 27001
        'rgba(255, 159, 64, 0.8)'   // SOC 2
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1
    }]
  };

  // Chart data for maturity trend
  const maturityTrendData = {
    labels: trendPoints.map(point => {
      const [year, month] = point.month.split('-');
      return new Date(year, month - 1).toLocaleDateString('default', { month: 'short', year: '2-digit' });
    }),
    datasets: [{
      label: 'Maturity Score',
      data: trendPoints.map(point => point.score),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4,
      fill: true
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Maturity Score Trend'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Cybersecurity Dashboard</h1>
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Threat Level Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-blue-500" />
            <h2 className="ml-3 text-xl font-semibold text-gray-900">Threat Level</h2>
          </div>
          {threatLevel ? (
            <div className="mt-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getThreatLevelColor(threatLevel.level)}`}>
                {threatLevel.level}
              </span>
              <p className="mt-2 text-sm text-gray-600">{threatLevel.description}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-600">No threat level data available</p>
          )}
        </div>

        {/* Maturity Rating Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-500" />
            <h2 className="ml-3 text-xl font-semibold text-gray-900">Maturity Rating</h2>
          </div>
          {maturityRating ? (
            <div className="mt-4">
              <div className="flex items-center">
                <span className="text-3xl font-bold text-gray-900">{maturityRating.score.toFixed(1)}</span>
                <span className="text-lg text-gray-600 ml-1">/5</span>
                <div className="ml-2">{getTrendIcon(maturityRating.trend)}</div>
              </div>
              <p className="mt-2 text-sm text-gray-600">{maturityRating.trend} trend</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-600">No maturity rating data available</p>
          )}
        </div>

        {/* Key Risks Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <h2 className="ml-3 text-xl font-semibold text-gray-900">Key Risks</h2>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-gray-900">{risks.length}</div>
            <div className="mt-2 text-sm text-gray-600">
              {risks.filter(risk => risk.severity === 'Critical').length} Critical
            </div>
          </div>
        </div>

        {/* Active Projects Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-8 w-8 text-purple-500" />
            <h2 className="ml-3 text-xl font-semibold text-gray-900">Active Projects</h2>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-gray-900">
              {projects.filter(p => p.status === 'In Progress').length}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {projects.filter(p => p.status === 'Completed').length} Completed
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Overview</h3>
          <div className="h-64">
            {compliance.length > 0 ? (
              <Doughnut 
                data={complianceChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right'
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No compliance data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Maturity Trend</h3>
          <div className="h-64">
            {maturityRating ? (
              <Line options={chartOptions} data={maturityTrendData} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No maturity trend data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risks Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Risks</h3>
            <div className="overflow-x-auto">
              {risks.length > 0 ? (
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Risk</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Severity</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risks.map((risk) => (
                      <tr key={risk.id} className="border-b">
                        <td className="py-3 px-4 text-sm text-gray-900">{risk.title}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${getThreatLevelColor(risk.severity)}`}>
                            {risk.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{risk.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-center py-4">No risks data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active Projects</h3>
            <div className="overflow-x-auto">
              {projects.length > 0 ? (
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Project</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className="border-b">
                        <td className="py-3 px-4 text-sm text-gray-900">{project.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{project.status}</td>
                        <td className="py-3 px-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${project.completion_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {project.completion_percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-center py-4">No projects data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;