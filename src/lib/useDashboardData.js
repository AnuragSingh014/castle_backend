// src/lib/useDashboardData.js
import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/dashboard';

export const useDashboardData = (userId) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [completionStatus, setCompletionStatus] = useState({
    overallCompletion: 0,
    sectionCompletion: {}
  });

  // ✅ Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Dashboard data loaded:', result);
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Load error:', err);
      setError('Failed to load: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ✅ Get component data helper
  const getComponentData = useCallback((componentName) => {
    if (!dashboardData) return null;
    return dashboardData[componentName] || null;
  }, [dashboardData]);

  // ✅ isSectionApproved function - THE KEY MISSING PIECE!
  const isSectionApproved = useCallback((sectionName) => {
    console.log('Checking approval for section:', sectionName);
    console.log('Dashboard data approvals:', dashboardData?.approvals);
    
    if (!dashboardData || !dashboardData.approvals) {
      console.log('No dashboard data or approvals, defaulting to false');
      return false;
    }
    
    const approvalStatus = dashboardData.approvals[sectionName];
    console.log(`Approval status for ${sectionName}:`, approvalStatus);
    return approvalStatus === 'approved';
  }, [dashboardData]);

  // ✅ Save functions
  const saveInformation = async (data) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/${userId}/information`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        await loadDashboardData();
        return { success: true };
      }
      throw new Error(result.error || 'Save failed');
    } catch (err) {
      console.error('Save information error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveOverview = async (data) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/${userId}/overview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        await loadDashboardData();
        return { success: true };
      }
      throw new Error(result.error || 'Save failed');
    } catch (err) {
      console.error('Save overview error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveInformationSheet = async (data) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/${userId}/informationSheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        await loadDashboardData();
        return { success: true };
      }
      throw new Error(result.error || 'Save failed');
    } catch (err) {
      console.error('Save information sheet error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveCompanyReferences = async (data) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/${userId}/company-references`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        await loadDashboardData();
        return { success: true };
      }
      throw new Error(result.error || 'Save failed');
    } catch (err) {
      console.error('Save company references error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveBeneficialOwner = async (data) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/${userId}/beneficial-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        await loadDashboardData();
        return { success: true };
      }
      throw new Error(result.error || 'Save failed');
    } catch (err) {
      console.error('Save beneficial owner error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveDDForm = async (data) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/${userId}/ddform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        await loadDashboardData();
        return { success: true };
      }
      throw new Error(result.error || 'Save failed');
    } catch (err) {
      console.error('Save DD form error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADD the missing saveLoanDetails function
  const saveLoanDetails = async (data) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/${userId}/loan-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        await loadDashboardData();
        return { success: true };
      }
      throw new Error(result.error || 'Save failed');
    } catch (err) {
      console.error('Save loan details error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ CRITICAL: Make sure ALL functions are returned!
  return {
    // Data
    dashboardData,
    loading,
    error,
    completionStatus,
    
    // Functions - ALL OF THESE MUST BE HERE!
    getComponentData,
    isSectionApproved,      // ← This was missing!
    loadDashboardData,
    
    // Save functions
    saveInformation,
    saveOverview,
    saveInformationSheet,
    saveCompanyReferences,
    saveBeneficialOwner,
    saveDDForm,
    saveLoanDetails         // ← This was missing too!
  };
};
