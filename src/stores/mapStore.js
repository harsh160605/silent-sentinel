import { create } from 'zustand';

export const useMapStore = create((set) => ({
  map: null,
  center: { lat: 37.7749, lng: -122.4194 }, // Default: San Francisco
  zoom: 14,
  userLocation: null,
  selectedLayers: {
    perception: true,
    crime: true,
    patterns: true,
  },
  reports: [],
  patterns: [],
  selectedReport: null, // Track selected report for highlighting

  setMap: (map) => set({ map }),
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setUserLocation: (location) => set({ userLocation: location }),

  toggleLayer: (layer) =>
    set((state) => ({
      selectedLayers: {
        ...state.selectedLayers,
        [layer]: !state.selectedLayers[layer],
      },
    })),

  setReports: (reports) => set({ reports }),
  setPatterns: (patterns) => set({ patterns }),
  setSelectedReport: (report) => set({ selectedReport: report }),

  // Navigate to a report and select it
  navigateToReport: (report) => set({
    center: { lat: report.location.lat, lng: report.location.lng },
    zoom: 17,
    selectedReport: report,
  }),
}));

