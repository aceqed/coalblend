import PageLayout from "../Layout/pageLayout.jsx";
import { useState, useEffect } from "react";
import { Search, Plus, MoreVertical, Eye, Loader } from "lucide-react";
import RecommendationsView from "./RecommendationsView.jsx";
import CreateSimulation from "./CreateSimulation.jsx";
import axios from "axios";
// import { Card, Button, Dropdown } from "react-bootstrap";

// when we click on the create new simulation then we can put Scenarios name and scenarios description , Scenarios date and after that we have 3
// option deafult or custom where we select the cola and we select the coal and coke properties after that my model will predicts the best blend using these coal
// and also cost effective blend using these coal using generative algoritham
const SimulationManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'recommendations'
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollingSimulations, setPollingSimulations] = useState(new Set());

  // Function to handle back from CreateSimulation
  const handleBackFromCreate = (newSimulation) => {
    console.log("Received new simulation:", newSimulation); // Debug log

    if (newSimulation && newSimulation.id) {
      // Add the new running simulation to the list while preserving existing ones
      setSimulations((prev) => {
        console.log("Previous simulations:", prev); // Debug log
        // Filter out any existing simulation with the same ID
        const filteredPrev = prev.filter((sim) => sim.id !== newSimulation.id);
        // Add the new simulation at the top with explicit running status
        const updated = [{ ...newSimulation, status: "running" }, ...filteredPrev];
        console.log("Updated simulations:", updated); // Debug log
        return updated;
      });

      // Add to polling set
      setPollingSimulations((prev) => {
        const updated = new Set([...prev, newSimulation.id]);
        console.log("Updated polling set:", Array.from(updated)); // Debug log
        return updated;
      });
    } else {
      console.error("Invalid simulation data received:", newSimulation);
    }
    setViewMode("list");
  };

  // Function to handle back to list
  const handleBackToList = () => {
    setViewMode("list");
    setSelectedScenario(null);
    // Don't fetch simulations here to preserve the current state
  };

  // Function to fetch simulations
  const fetchSimulations = async () => {
    try {
      const response = await axios.get("http://34.123.69.231:8000/simulations", {
        withCredentials: true,
      });
      const newSimulations = response.data;

      // Update simulations while preserving running status
      setSimulations((prevSimulations) => {
        const updatedSimulations = newSimulations.map((newSim) => {
          const existingSim = prevSimulations.find((sim) => sim.id === newSim.id);
          if (existingSim && existingSim.status === "running") {
            // Keep the running status if the simulation is still running
            return { ...newSim, status: "running" };
          }
          return newSim;
        });

        // Add any new simulations
        const existingIds = new Set(prevSimulations.map((sim) => sim.id));
        const newSims = prevSimulations.filter((sim) => !existingIds.has(sim.id));

        return [...updatedSimulations, ...newSims];
      });

      // Update polling simulations
      const runningSims = newSimulations.filter((sim) => sim.status === "running");
      if (runningSims.length > 0) {
        setPollingSimulations(new Set(runningSims.map((sim) => sim.id)));
      } else {
        setPollingSimulations(new Set());
      }

      setError(null);
    } catch (error) {
      setError("Failed to fetch simulations");
      console.error("Error fetching simulations:", error);
    }
  };

  // Polling effect for running simulations
  useEffect(() => {
    if (pollingSimulations.size === 0) return;

    console.log("Starting polling for simulations:", Array.from(pollingSimulations));

    // Function to fetch multiple simulations in a single request
    const fetchBatchSimulations = async (ids) => {
      try {
        const response = await axios.get(
          `http://34.123.69.231:8000/simulations/batch?simulation_ids=${Array.from(ids).join(",")}`,
          { withCredentials: true }
        );

        const updatedSimulations = response.data;
        console.log("Batch update received:", updatedSimulations);

        // Update simulations with new status and data
        setSimulations((prev) => {
          const updatedMap = new Map(updatedSimulations.map((sim) => [sim.id, sim]));

          return prev.map((sim) => {
            const updatedSim = updatedMap.get(sim.id);
            return updatedSim ? { ...sim, ...updatedSim } : sim;
          });
        });

        // Return the IDs of simulations that are still running
        return new Set(
          updatedSimulations.filter((sim) => sim.status === "running").map((sim) => sim.id)
        );
      } catch (error) {
        console.error("Error in batch fetch:", error);
        return new Set();
      }
    };

    // Initial fetch
    fetchBatchSimulations(pollingSimulations).then((runningSims) => {
      if (runningSims.size === 0) {
        console.log("No running simulations after initial fetch");
        setPollingSimulations(new Set());
        return;
      }
    });

    // Set up polling interval
    const pollInterval = setInterval(async () => {
      if (pollingSimulations.size === 0) {
        clearInterval(pollInterval);
        return;
      }

      const runningSims = await fetchBatchSimulations(pollingSimulations);

      // Update the polling set with only running simulations
      setPollingSimulations((prev) => {
        if (runningSims.size === 0) {
          console.log("No more running simulations, stopping poll");
          clearInterval(pollInterval);
          return new Set();
        }
        return runningSims;
      });
    }, 30000); // Increased to 30 seconds since we're batching

    return () => {
      console.log("Cleaning up polling interval");
      clearInterval(pollInterval);
    };
  }, [pollingSimulations]);

  // Initial fetch
  useEffect(() => {
    const fetchSimulationsWithRetry = async () => {
      try {
        await fetchSimulations();
      } catch (error) {
        console.error("Initial fetch failed, retrying...", error);
        // Simple retry mechanism
        setTimeout(fetchSimulationsWithRetry, 5000);
      }
    };

    fetchSimulationsWithRetry();
  }, []);

  // Sort simulations to show running ones at the top
  const sortedSimulations = [...simulations].sort((a, b) => {
    // First priority: running status
    if (a.status === "running" && b.status !== "running") return -1;
    if (a.status !== "running" && b.status === "running") return 1;

    // Second priority: date (newest first)
    const dateA = new Date(a.generated_date);
    const dateB = new Date(b.generated_date);
    return dateB - dateA;
  });

  console.log("Current simulations state:", sortedSimulations); // Debug log

  // Filter sorted simulations based on search term
  const filteredScenarios = sortedSimulations.filter((scenario) => {
    if (!scenario) return false;

    const searchLower = searchTerm.toLowerCase();
    const name = scenario.scenario_name?.toLowerCase() || "";
    const description = scenario.scenario_description?.toLowerCase() || "";
    const date = scenario.generated_date
      ? new Date(scenario.generated_date).toLocaleString().toLowerCase()
      : "";
    const status = scenario.status?.toLowerCase() || "";

    return (
      name.includes(searchLower) ||
      description.includes(searchLower) ||
      date.includes(searchLower) ||
      status.includes(searchLower)
    );
  });

  // Get status styling
  const getStatusStyle = (status) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";

    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      case "RUNNING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleGenerate = () => {
    console.log("Generate clicked");
    // Add your generate logic here
  };

  const handleCreateNewSimulation = () => {
    setViewMode("create");
  };

  const handleDropdownToggle = (scenarioId) => {
    setOpenDropdown(openDropdown === scenarioId ? null : scenarioId);
  };

  const handleView = async (scenario) => {
    // Only allow viewing if simulation is not running
    if (scenario.status === "running") {
      return;
    }

    console.log("Viewing scenario:", scenario);

    try {
      // Fetch detailed simulation data including recommendations and emission data
      const response = await axios.get(`http://34.123.69.231:8000/simulation/${scenario.id}`, {
        withCredentials: true,
      });

      console.log("Detailed simulation data:", response.data); // Debug log
      setSelectedScenario(response.data); // Use detailed data instead of basic scenario
      setViewMode("recommendations");
      setOpenDropdown(null);
    } catch (error) {
      console.error("Error fetching detailed simulation data:", error);
      // Fallback to basic scenario data if detailed fetch fails
      setSelectedScenario(scenario);
      setViewMode("recommendations");
      setOpenDropdown(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStopSimulation = async (simulationId) => {
    try {
      console.log(`Attempting to stop simulation ${simulationId}`); // Debug log

      const response = await axios.post(
        `http://34.123.69.231:8000/simulation/${simulationId}/stop`,
        {},
        {
          withCredentials: true,
        }
      );

      console.log(`Stop simulation response:`, response.data); // Debug log

      // Update simulation status locally
      setSimulations((prev) =>
        prev.map((sim) =>
          sim.id === simulationId
            ? { ...sim, status: "failed", error_message: "Simulation stopped by user" }
            : sim
        )
      );

      // Remove from polling set
      setPollingSimulations((prev) => {
        const updated = new Set(prev);
        updated.delete(simulationId);
        console.log(`Removed simulation ${simulationId} from polling set`); // Debug log
        return updated;
      });

      // Show success message
      alert("Simulation stopped successfully");
    } catch (error) {
      console.error("Error stopping simulation:", error);
      const errorMessage = error.response?.data?.detail || "Failed to stop simulation";
      alert(`Error: ${errorMessage}`);
    }
  };

  // Update the simulation card to show running status
  const renderSimulationCard = (simulation) => {
    const isRunning = simulation.status === "running";

    return (
      <Card key={simulation.id} className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">{simulation.scenario_name}</h5>
              <p className="text-muted mb-2">{simulation.scenario_description}</p>
              <div className="d-flex align-items-center">
                <span className={`badge ${getStatusStyle(simulation.status)} me-2`}>
                  {simulation.status}
                </span>
                <small className="text-muted">
                  {new Date(simulation.generated_date).toLocaleString()}
                </small>
              </div>
            </div>
            <div>
              <Button
                variant="primary"
                size="sm"
                className="me-2"
                onClick={() => handleView(simulation)}
                disabled={isRunning}
              >
                View
              </Button>
              <Dropdown>
                <Dropdown.Toggle variant="secondary" size="sm" disabled={isRunning}>
                  Actions
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleEdit(simulation)}>Edit</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDelete(simulation)}>Delete</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (viewMode === "recommendations" && selectedScenario) {
    console.log("Rendering RecommendationsView with data:", selectedScenario); // Debug log
    return <RecommendationsView simulation={selectedScenario} onBack={handleBackToList} />;
  }

  if (viewMode === "create") {
    return <CreateSimulation onBack={handleBackFromCreate} />;
  }

  return (
    <PageLayout title="Simulation Manager">
      <div className="w-full">
        {/* Header section */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-gray-800">Scenarios</h2>
          <div className="flex items-center gap-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name, description, or date"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-3 text-sm text-gray-900 font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-grey-500 transition-all duration-200 bg-white hover:border-gray-300 shadow-sm placeholder-gray-400"
              />
            </div>

            {/* Action buttons */}
            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors font-medium"
            >
              Compare
            </button>
            <button
              onClick={handleCreateNewSimulation}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-700 transition-colors font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create new Simulation
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-500 rounded-lg overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scenario Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scenarios Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generate Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredScenarios.map((scenario) => (
                    <tr key={scenario.id} className="hover:bg-blue-100 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {scenario.scenario_name || ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {scenario.scenario_description || ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {scenario.generated_date
                          ? new Date(scenario.generated_date).toLocaleString()
                          : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(
                              scenario.status
                            )}`}
                          >
                            {scenario.status === "running" && (
                              <Loader className="h-3 w-3 animate-spin mr-1" />
                            )}
                            {(scenario.status || "").toUpperCase()}
                          </span>
                          {scenario.status === "running" && (
                            <button
                              onClick={() => handleStopSimulation(scenario.id)}
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Stop simulation"
                            >
                              Stop
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative dropdown-container">
                          <button
                            onClick={() => handleDropdownToggle(scenario.id)}
                            className={`text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors ${
                              scenario.status === "running" ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title={
                              scenario.status === "running"
                                ? "Cannot view while running"
                                : "Click to view"
                            }
                            disabled={scenario.status === "running"}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {openDropdown === scenario.id && scenario.status !== "running" && (
                            <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                              <button
                                onClick={() => handleView(scenario)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredScenarios.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No scenarios found matching your search.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default SimulationManager;
