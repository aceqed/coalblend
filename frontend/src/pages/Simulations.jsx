import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Loader } from "lucide-react";

const Simulations = () => {
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollingSimulations, setPollingSimulations] = useState(new Set());
  const navigate = useNavigate();

  // Function to fetch simulations
  const fetchSimulations = async () => {
    try {
      const response = await axios.get("http://34.123.69.231:8000/simulations", {
        withCredentials: true,
      });
      setSimulations(response.data);

      // Check for running simulations
      const runningSims = response.data.filter((sim) => sim.status === "running");
      if (runningSims.length > 0) {
        setPollingSimulations(new Set(runningSims.map((sim) => sim.id)));
      }
    } catch (error) {
      console.error("Error fetching simulations:", error);
      setError("Failed to load simulations");
    } finally {
      setLoading(false);
    }
  };

  // Poll running simulations
  useEffect(() => {
    if (pollingSimulations.size === 0) return;

    const pollInterval = setInterval(async () => {
      try {
        const updatedSimulations = await Promise.all(
          Array.from(pollingSimulations).map(async (id) => {
            const response = await axios.get(`http://34.123.69.231:8000/simulation/${id}`, {
              withCredentials: true,
            });
            return response.data;
          })
        );

        // Update simulations with new status
        setSimulations((prev) =>
          prev.map((sim) => {
            const updated = updatedSimulations.find((u) => u.id === sim.id);
            return updated || sim;
          })
        );

        // Remove completed simulations from polling
        const stillRunning = new Set(
          Array.from(pollingSimulations).filter((id) => {
            const sim = updatedSimulations.find((u) => u.id === id);
            return sim && sim.status === "running";
          })
        );
        setPollingSimulations(stillRunning);
      } catch (error) {
        console.error("Error polling simulations:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [pollingSimulations]);

  // Initial fetch and setup event listener for new simulations
  useEffect(() => {
    fetchSimulations();

    // Listen for custom event when new simulation is created
    const handleNewSimulation = (event) => {
      const newSimulation = event.detail;
      setSimulations((prev) => [newSimulation, ...prev]);
      if (newSimulation.status === "running") {
        setPollingSimulations((prev) => new Set([...prev, newSimulation.id]));
      }
    };

    window.addEventListener("newSimulationCreated", handleNewSimulation);

    return () => {
      window.removeEventListener("newSimulationCreated", handleNewSimulation);
    };
  }, []);

  // Function to handle new simulation creation
  const handleNewSimulation = () => {
    navigate("/create-simulation");
  };

  // Function to get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "running":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
            <Loader className="h-3 w-3 animate-spin" />
            Running
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Completed
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-2 p-2">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold text-gray-800">Simulations</h1>
            <button
              onClick={handleNewSimulation}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded hover:from-blue-600 hover:to-blue-700 transition-all text-xs font-medium flex items-center gap-1 shadow-md"
            >
              <Plus className="h-3 w-3" />
              New Simulation
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Simulations List */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="h-6 w-6 animate-spin mx-auto text-blue-500" />
              <p className="mt-2 text-sm text-gray-600">Loading simulations...</p>
            </div>
          ) : simulations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No simulations found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {simulations.map((simulation) => (
                <div key={simulation.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {simulation.scenario_name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {simulation.scenario_description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(simulation.status)}
                      <Link
                        to={`/simulation/${simulation.id}`}
                        className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors text-xs font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulations;
