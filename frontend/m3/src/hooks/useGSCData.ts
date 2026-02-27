import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listSites,
  getSearchAnalytics,
  getGSCQueryPageData,
} from '../services/googleSearchConsole';
import { runAnalysisInWorker } from '../utils/workerClient';
import { useToast } from '../components/ui/ToastContext';

export const useGSCData = (accessToken: string | null, startDate?: string, endDate?: string) => {
  const { error: showError } = useToast();
  const queryClient = useQueryClient();
  const [selectedSite, setSelectedSite] = useState<string>(
    () => localStorage.getItem('mediaflow_gsc_selected_site') || '',
  );

  // Persist selected site
  useEffect(() => {
    if (selectedSite) {
      localStorage.setItem('mediaflow_gsc_selected_site', selectedSite);
    }
  }, [selectedSite]);

  // 1. Query for Sites
  const {
    data: gscSites = [],
    isLoading: isLoadingSites,
    error: sitesError,
  } = useQuery({
    queryKey: ['gscSites', accessToken],
    queryFn: () => listSites(accessToken!),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Handle Sites Error
  useEffect(() => {
    if (sitesError) {
      console.error(sitesError);
      showError('Error obteniendo la lista de sitios.');
    }
  }, [sitesError, showError]);

  // Effect to select first site when loaded or validate persisted site
  useEffect(() => {
    if (gscSites.length > 0) {
      if (!selectedSite) {
        setSelectedSite(gscSites[0].siteUrl);
      } else {
        // Validate if persisted site still exists
        const exists = gscSites.find((s) => s.siteUrl === selectedSite);
        if (!exists) {
          setSelectedSite(gscSites[0].siteUrl);
        }
      }
    }
  }, [gscSites, selectedSite]);

  // 2. Query for Data & Insights
  const {
    data: siteData,
    isLoading: isLoadingData,
    error: dataError,
  } = useQuery({
    queryKey: ['gscData', accessToken, selectedSite, startDate, endDate],
    queryFn: async () => {
      const finalEndDate = endDate || new Date().toISOString().split('T')[0];
      const finalStartDate =
        startDate || new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Parallel Fetch: Date Data for Chart, Query+Page Data for Insights
      const [dateData, queryPageData] = await Promise.all([
        getSearchAnalytics(accessToken!, selectedSite, finalStartDate, finalEndDate),
        getGSCQueryPageData(accessToken!, selectedSite, finalStartDate, finalEndDate),
      ]);

      // Offload heavy processing to Web Worker
      const insights = await runAnalysisInWorker(queryPageData);

      return {
        gscData: dateData,
        insights,
      };
    },
    enabled: !!accessToken && !!selectedSite,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle Data Error
  useEffect(() => {
    if (dataError) {
      console.error(dataError);
      showError('Error obteniendo datos de analítica.');
    }
  }, [dataError, showError]);

  const clearData = () => {
    setSelectedSite('');
    localStorage.removeItem('mediaflow_gsc_selected_site');
    // Invalidating queries might be better, but 'clearing' usually means UI reset.
    // Since state is derived from queries, clearing selectedSite disables the data query.
    queryClient.removeQueries({ queryKey: ['gscData'] });
  };

  return {
    gscSites,
    selectedSite,
    setSelectedSite,
    gscData: siteData?.gscData || [],
    isLoadingGsc: isLoadingSites || isLoadingData,
    insights: siteData?.insights || {
      quickWins: null,
      strikingDistance: null,
      lowCtr: null,
      topQueries: null,
      cannibalization: null,
      zeroClicks: null,
      featuredSnippets: null,
      stagnantTraffic: null,
      seasonality: null,
      stableUrls: null,
      internalRedirects: null,
    },
    fetchSites: () => queryClient.invalidateQueries({ queryKey: ['gscSites'] }), // Manual refresh
    clearData,
  };
};
