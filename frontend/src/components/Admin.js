import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Updated to include NCSC CAF and Cyber Essentials
const SUPPORTED_FRAMEWORKS = ['PCI DSS', 'NIST CSF', 'ISO 27001', 'SOC 2', 'NCSC CAF', 'Cyber Essentials'];

const Admin = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('threat');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trendPoints, setTrendPoints] = useState([]);
  const [newTrendPoint, setNewTrendPoint] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    score: 0
  });

  // State for Threat Level
  const [threatLevel, setThreatLevel] = useState({
    level: 'Low',
    description: ''
  });

  // State for Maturity Rating
  const [maturityRating, setMaturityRating] = useState({
    score: 0,
    trend: 'Stable'
  });

  // State for Risks
  const [risks, setRisks] = useState([]);
  const [newRisk, setNewRisk] = useState({
    title: '',
    description: '',
    severity: 'Low',
    status: 'Open'
  });

  // State for Projects
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'Not Started',
    completion_percentage: 0,
    due_date: new Date().toISOString().split('T')[0]
  });

  // State for Compliance
  const [compliance, setCompliance] = useState([]);
  const [newCompliance, setNewCompliance] = useState({
    name: SUPPORTED_FRAMEWORKS[0],
    current_score: 0,
    target_score: 100,
    last_assessment_date: new Date().toISOString().split('T')[0]
  });

  // Check admin access and load all data
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const token = localStorage.getItem('token');
    
    if (!isAdmin || !token) {
      navigate('/login');
      return;
    }

    const loadAllData = async () => {
      try {
        setError('');
        const [
          threatResponse, 
          maturityResponse, 
          risksResponse, 
          projectsResponse, 
          complianceResponse,
          trendResponse
        ] = await Promise.all([
          api.get('/api/threat-level'),
          api.get('/api/maturity-rating'),
          api.get('/api/risks'),
          api.get('/api/projects'),
          api.get('/api/compliance'),
          api.get('/api/maturity-trend')
        ]);

        if (threatResponse.data) setThreatLevel(threatResponse.data);
        if (maturityResponse.data) setMaturityRating(maturityResponse.data);
        if (risksResponse.data) setRisks(risksResponse.data);
        if (projectsResponse.data) setProjects(projectsResponse.data);
        if (trendResponse.data) setTrendPoints(trendResponse.data);
        if (complianceResponse.data) {
          // Filter only supported frameworks
          const filteredCompliance = complianceResponse.data.filter(
            framework => SUPPORTED_FRAMEWORKS.includes(framework.name)
          );
          setCompliance(filteredCompliance);
        }

      } catch (err) {
        console.error('Error loading data:', err);
        if (err.response?.status === 401 || err.response?.status === 422) {
          navigate('/login');
        } else {
          setError('Error loading data. Please try refreshing the page.');
        }
      }
    };

    loadAllData();
  }, [navigate]);

  // Common error handler
  const handleError = (err) => {
    console.error('Error:', err);
    if (err.response?.status === 401 || err.response?.status === 422) {
      navigate('/login');
    } else {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  // Helper function to show success message
  const showSuccessMessage = (message) => {
    setMessage(message);
    setTimeout(() => setMessage(''), 3000);
  };

  // Helper function to refresh all data
  const refreshData = async () => {
    try {
      const [
        threatResponse, 
        maturityResponse, 
        risksResponse, 
        projectsResponse, 
        complianceResponse
      ] = await Promise.all([
        api.get('/api/threat-level'),
        api.get('/api/maturity-rating'),
        api.get('/api/risks'),
        api.get('/api/projects'),
        api.get('/api/compliance')
      ]);

      if (threatResponse.data) setThreatLevel(threatResponse.data);
      if (maturityResponse.data) setMaturityRating(maturityResponse.data);
      if (risksResponse.data) setRisks(risksResponse.data);
      if (projectsResponse.data) setProjects(projectsResponse.data);
      if (complianceResponse.data) {
        const filteredCompliance = complianceResponse.data.filter(
          framework => SUPPORTED_FRAMEWORKS.includes(framework.name)
        );
        setCompliance(filteredCompliance);
      }
    } catch (err) {
      handleError(err);
    }
  };

// Handler for threat level updates
const handleThreatSubmit = async (e) => {
  e.preventDefault();
  setMessage('');
  setError('');
  setIsSubmitting(true);
  
  try {
    await api.post('/api/threat-level', threatLevel);
    await refreshData();
    showSuccessMessage('Threat level updated successfully');
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
};

// Handler for maturity rating updates
const handleMaturitySubmit = async (e) => {
  e.preventDefault();
  setMessage('');
  setError('');
  setIsSubmitting(true);
  
  try {
    await api.post('/api/maturity-rating', maturityRating);
    await refreshData();
    showSuccessMessage('Maturity rating updated successfully');
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
};

// Handlers for Risks
const handleRiskSubmit = async (e) => {
  e.preventDefault();
  setMessage('');
  setError('');
  setIsSubmitting(true);
  
  try {
    await api.post('/api/risks', newRisk);
    await refreshData();
    
    // Reset form
    setNewRisk({
      title: '',
      description: '',
      severity: 'Low',
      status: 'Open'
    });
    
    showSuccessMessage('Risk added successfully');
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
};

const handleRiskUpdate = async (riskId, updatedRisk) => {
  setMessage('');
  setError('');
  setIsSubmitting(true);
  
  try {
    await api.put(`/api/risks/${riskId}`, updatedRisk);
    await refreshData();
    showSuccessMessage('Risk updated successfully');
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
};

const handleRiskDelete = async (riskId) => {
  if (!window.confirm('Are you sure you want to delete this risk?')) return;
  
  setMessage('');
  setError('');
  setIsSubmitting(true);
  
  try {
    await api.delete(`/api/risks/${riskId}`);
    await refreshData();
    showSuccessMessage('Risk deleted successfully');
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
};

// Handlers for Projects
const handleProjectSubmit = async (e) => {
  e.preventDefault();
  setMessage('');
  setError('');
  setIsSubmitting(true);
  
  try {
    await api.post('/api/projects', newProject);
    await refreshData();
    
    // Reset form
    setNewProject({
      name: '',
      description: '',
      status: 'Not Started',
      completion_percentage: 0,
      due_date: new Date().toISOString().split('T')[0]
    });
    
    showSuccessMessage('Project added successfully');
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
};

const handleProjectUpdate = async (projectId, updatedProject) => {
  setMessage('');
  setError('');
  setIsSubmitting(true);
  
  try {
    await api.put(`/api/projects/${projectId}`, updatedProject);
    await refreshData();
    showSuccessMessage('Project updated successfully');
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
};

const handleProjectDelete = async (projectId) => {
  if (!window.confirm('Are you sure you want to delete this project?')) return;
  
  setMessage('');
  setError('');
  setIsSubmitting(true);
  
  try {
    await api.delete(`/api/projects/${projectId}`);
    await refreshData();
    showSuccessMessage('Project deleted successfully');
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
};

// Handlers for Compliance
const handleComplianceSubmit = async (e) => {
  e.preventDefault();
  setMessage('');
  setError('');
  setIsSubmitting(true);
  
  try {
    // Simple validation first
    if (!newCompliance.name || !SUPPORTED_FRAMEWORKS.includes(newCompliance.name)) {
      setError('Please select a valid framework');
      setIsSubmitting(false);
      return;
    }

    // Check if the selected framework already exists
    const existingFramework = compliance.find(f => f.name === newCompliance.name);
    if (existingFramework) {
      setError(`Framework "${newCompliance.name}" already exists`);
      setIsSubmitting(false);
      return;
    }

    // Proceed with the submission
    await api.post('/api/compliance', newCompliance);
    
    // Refresh data
    const complianceResponse = await api.get('/api/compliance');
    if (complianceResponse.data) {
      const filteredCompliance = complianceResponse.data.filter(
        framework => SUPPORTED_FRAMEWORKS.includes(framework.name)
      );
      setCompliance(filteredCompliance);
    }

    // Find next available framework
    const availableFrameworks = SUPPORTED_FRAMEWORKS.filter(
      framework => !compliance.some(f => f.name === framework)
    );

    // Reset form with next available framework
    setNewCompliance({
      name: availableFrameworks[0] || SUPPORTED_FRAMEWORKS[0],
      current_score: 0,
      target_score: 100,
      last_assessment_date: new Date().toISOString().split('T')[0]
    });
    
    showSuccessMessage('Compliance framework added successfully');
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
};

const handleComplianceUpdate = async (frameworkId, updatedCompliance) => {
  setMessage('');
  setError('');
  setIsSubmitting(true);
  
  try {
    await api.put(`/api/compliance/${frameworkId}`, updatedCompliance);
    await refreshData();
    showSuccessMessage('Compliance framework updated successfully');
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
};

const handleComplianceDelete = async (frameworkId) => {
  if (!window.confirm('Are you sure you want to delete this compliance framework?')) return;
  
  setMessage('');
  setError('');
  setIsSubmitting(true);
  
  try {
    await api.delete(`/api/compliance/${frameworkId}`);
    await refreshData();
    showSuccessMessage('Compliance framework deleted successfully');
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
};

const handleTrendPointSubmit = async (e) => {
  e.preventDefault();
  setMessage('');
  setError('');
  setIsSubmitting(true);
  
  try {
    await api.post('/api/maturity-trend', newTrendPoint);
    
    // Fetch updated trend points immediately
    const trendResponse = await api.get('/api/maturity-trend');
    if (trendResponse.data) {
      setTrendPoints(trendResponse.data.sort((a, b) => a.month.localeCompare(b.month)));
    }
    
    showSuccessMessage('Maturity trend point added successfully');
    
    // Reset form but keep the current month
    setNewTrendPoint({
      month: new Date().toISOString().slice(0, 7),
      score: 0
    });
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
};

const handleTrendPointDelete = async (month) => {
  if (!window.confirm('Are you sure you want to delete this trend point?')) return;
  
  setMessage('');
  setError('');
  setIsSubmitting(true);
  
  try {
    await api.delete(`/api/maturity-trend/${month}`);
    
    // Fetch updated trend points immediately
    const trendResponse = await api.get('/api/maturity-trend');
    if (trendResponse.data) {
      setTrendPoints(trendResponse.data.sort((a, b) => a.month.localeCompare(b.month)));
    }
    
    showSuccessMessage('Trend point deleted successfully');
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
};

// Helper function for formatting dates
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

return (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

    {message && (
      <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
        {message}
      </div>
    )}

    {error && (
      <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    )}

    <div className="border-b border-gray-200 mb-8">
      <nav className="-mb-px flex space-x-8">
        {['threat', 'maturity', 'risks', 'projects', 'compliance'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`${
              selectedTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap pb-4 px-1 border-b-2 font-medium capitalize`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>
    </div>

    {/* Threat Level Tab */}
    {selectedTab === 'threat' && (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Update Threat Level</h2>
        <form onSubmit={handleThreatSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Threat Level
            </label>
            <select
              value={threatLevel.level}
              onChange={(e) => setThreatLevel({ ...threatLevel, level: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={threatLevel.description}
              onChange={(e) => setThreatLevel({ ...threatLevel, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isSubmitting ? 'Updating...' : 'Update Threat Level'}
          </button>
        </form>
      </div>
    )}

    {/* Maturity Rating Tab */}
    {selectedTab === 'maturity' && (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Update Maturity Rating</h2>
        <form onSubmit={handleMaturitySubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Maturity Score (0-5)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={maturityRating.score}
              onChange={(e) => setMaturityRating({ ...maturityRating, score: parseFloat(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Trend
            </label>
            <select
              value={maturityRating.trend}
              onChange={(e) => setMaturityRating({ ...maturityRating, trend: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            >
              <option value="Increasing">Increasing</option>
              <option value="Stable">Stable</option>
              <option value="Decreasing">Decreasing</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isSubmitting ? 'Updating...' : 'Update Maturity Rating'}
          </button>
        </form>
        {/* Add this inside the maturity rating form section */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Maturity Trend Points</h3>
          <form onSubmit={handleTrendPointSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Month</label>
                <input
                  type="month"
                  value={newTrendPoint.month}
                  onChange={(e) => setNewTrendPoint({ ...newTrendPoint, month: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Score (0-5)</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={newTrendPoint.score}
                  onChange={(e) => setNewTrendPoint({ ...newTrendPoint, score: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Trend Point
            </button>
          </form>

          {/* Trend Points Table */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Current Trend Points</h4>
            {trendPoints.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trendPoints.map((point) => (
                      <tr key={point.month}>
                        <td className="px-6 py-4 whitespace-nowrap">{point.month}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{point.score.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleTrendPointDelete(point.month)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No trend points added yet</p>
            )}
          </div>
        </div>
      </div>
    )}

{/* Risks Management Tab */}
{selectedTab === 'risks' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Risks</h2>
          
          {/* Add New Risk Form */}
          <form onSubmit={handleRiskSubmit} className="space-y-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900">Add New Risk</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newRisk.title}
                  onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Severity</label>
                <select
                  value={newRisk.severity}
                  onChange={(e) => setNewRisk({ ...newRisk, severity: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={newRisk.status}
                  onChange={(e) => setNewRisk({ ...newRisk, status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newRisk.description}
                  onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? 'Adding...' : 'Add Risk'}
            </button>
          </form>

          {/* Existing Risks Table */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Risks</h3>
            {risks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {risks.map((risk) => (
                    <tr key={risk.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="text"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={risk.title}
                            onChange={(e) => {
                              const updatedRisk = { ...risk, title: e.target.value };
                              handleRiskUpdate(risk.id, updatedRisk);
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={risk.severity}
                          onChange={(e) => {
                            const updatedRisk = { ...risk, severity: e.target.value };
                            handleRiskUpdate(risk.id, updatedRisk);
                          }}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={risk.status}
                          onChange={(e) => {
                            const updatedRisk = { ...risk, status: e.target.value };
                            handleRiskUpdate(risk.id, updatedRisk);
                          }}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRiskDelete(risk.id)}
                          disabled={isSubmitting}
                          className="text-red-600 hover:text-red-900 ml-4 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No risks available</p>
            )}
          </div>
        </div>
      )}

      {/* Projects Management Tab */}
      {selectedTab === 'projects' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Projects</h2>
          
          {/* Add New Project Form */}
          <form onSubmit={handleProjectSubmit} className="space-y-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900">Add New Project</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Completion Percentage</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newProject.completion_percentage}
                  onChange={(e) => setNewProject({ ...newProject, completion_percentage: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={newProject.due_date}
                  onChange={(e) => setNewProject({ ...newProject, due_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? 'Adding...' : 'Add Project'}
            </button>
          </form>

          {/* Existing Projects Table */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Projects</h3>
            {projects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={project.name}
                          onChange={(e) => {
                            const updatedProject = { ...project, name: e.target.value };
                            handleProjectUpdate(project.id, updatedProject);
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={project.status}
                          onChange={(e) => {
                            const updatedProject = { ...project, status: e.target.value };
                            handleProjectUpdate(project.id, updatedProject);
                          }}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={project.completion_percentage}
                          onChange={(e) => {
                            const updatedProject = {
                              ...project,
                              completion_percentage: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                            };
                            handleProjectUpdate(project.id, updatedProject);
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="date"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={formatDate(project.due_date)}
                          onChange={(e) => {
                            const updatedProject = { ...project, due_date: e.target.value };
                            handleProjectUpdate(project.id, updatedProject);
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleProjectDelete(project.id)}
                          disabled={isSubmitting}
                          className="text-red-600 hover:text-red-900 ml-4 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No projects available</p>
            )}
          </div>
        </div>
      )}

{/* Compliance Management Tab */}
{selectedTab === 'compliance' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Compliance Frameworks</h2>
          
          {/* Add New Compliance Framework Form */}
          <form onSubmit={handleComplianceSubmit} className="space-y-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900">Add New Compliance Framework</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Framework Name</label>
                <select
                  value={newCompliance.name}
                  onChange={(e) => setNewCompliance({ ...newCompliance, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {SUPPORTED_FRAMEWORKS
                    .filter(framework => !compliance.some(f => f.name === framework))
                    .map(framework => (
                      <option key={framework} value={framework}>
                        {framework}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newCompliance.current_score}
                  onChange={(e) => setNewCompliance({ 
                    ...newCompliance, 
                    current_score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newCompliance.target_score}
                  onChange={(e) => setNewCompliance({ 
                    ...newCompliance, 
                    target_score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Assessment Date</label>
                <input
                  type="date"
                  value={newCompliance.last_assessment_date}
                  onChange={(e) => setNewCompliance({ ...newCompliance, last_assessment_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || SUPPORTED_FRAMEWORKS.every(framework => 
                compliance.find(f => f.name === framework)
              )}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                isSubmitting || SUPPORTED_FRAMEWORKS.every(framework => 
                  compliance.find(f => f.name === framework)
                )
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isSubmitting ? 'Adding...' : 'Add Framework'}
            </button>
            {SUPPORTED_FRAMEWORKS.every(framework => 
              compliance.find(f => f.name === framework)
            ) && (
              <p className="text-sm text-gray-500 mt-2">
                All supported compliance frameworks have been added
              </p>
            )}
          </form>

          {/* Existing Compliance Frameworks Table */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Compliance Frameworks</h3>
            {compliance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Framework</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Assessment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Assessment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {compliance.map((framework) => (
                      <tr key={framework.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{framework.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${framework.current_score >= 90 ? 'bg-green-100 text-green-800' :
                              framework.current_score >= 70 ? 'bg-blue-100 text-blue-800' :
                              framework.current_score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'}`}>
                            {framework.current_score}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{framework.target_score}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(framework.last_assessment_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(framework.next_assessment_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              const updatedScore = window.prompt(
                                `Enter new score for ${framework.name} (0-100):`,
                                framework.current_score
                              );
                              if (updatedScore !== null) {
                                const score = parseInt(updatedScore);
                                if (!isNaN(score) && score >= 0 && score <= 100) {
                                  handleComplianceUpdate(framework.id, {
                                    ...framework,
                                    current_score: score,
                                    last_assessment_date: new Date().toISOString().split('T')[0]
                                  });
                                } else {
                                  alert('Please enter a valid score between 0 and 100');
                                }
                              }
                            }}
                            disabled={isSubmitting}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            Update Score
                          </button>
                          <button
                            onClick={() => handleComplianceDelete(framework.id)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-900 ml-4 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No compliance frameworks available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;