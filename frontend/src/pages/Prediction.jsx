import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import PageLayout from "../Layout/pageLayout.jsx";
import { BarChart, Plus, X } from "lucide-react";
import { logout } from "../Redux/authSlice";
import axios from "axios";

function Prediction() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get user data from Redux store
  const { user, loader } = useSelector((state) => state.auth);

  // State for managing multiple blend panels
  const [panels, setPanels] = useState([
    {
      id: 1,
      numCoals: "",
      coalSelections: [{ id: 1, coalId: "", percentage: "" }],
      totalPercentage: 0,
      results: null,
    },
  ]);

  const [isPanelLoading, setIsPanelLoading] = useState({});

  // Add state for search input and filtered coals
  const [searchInputs, setSearchInputs] = useState({});
  const [filteredCoals, setFilteredCoals] = useState({});

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!loader && !user) {
      navigate("/login");
    }
  }, [loader, user, navigate]);

  // If loading or not authenticated, show loading state
  if (loader || !user) {
    return (
      <PageLayout title="Prediction">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </PageLayout>
    );
  }

  // Sample coal data - hardcoded for testing
  const availableCoals = [
    { id: 1, name: "Riverside" },
    { id: 2, name: "Moranbah North" },
    { id: 3, name: "Illawara (PHCC)" },
    { id: 4, name: "Goonyella" },
    { id: 5, name: "Caval Ridge" },
    { id: 6, name: "PDN" },
    { id: 7, name: "Poitrel" },
    { id: 8, name: "Amonate" },
    { id: 9, name: "Aus.SHCC" },
    { id: 10, name: "Teck Venture" },
    { id: 11, name: "Lake Vermont" },
    { id: 12, name: "Metropolitan" },
    { id: 13, name: "Indonasian" },
    { id: 14, name: "Low Ash SHCC/ SHCC-BHP" },
    { id: 15, name: "Eagle crrek" },
    { id: 16, name: "Dhamra SHCC PDN" },
    { id: 17, name: "Daunia (SHCC)" },
    { id: 18, name: "Leer" },
    { id: 19, name: "Elga" },
    { id: 20, name: "Leer/Russian HFCC" },
    { id: 21, name: "Uvalnaya" },
    { id: 22, name: "Blue creek" },
    { id: 23, name: "Mt. Laurel" },
    { id: 24, name: "R.PCI" },
    { id: 25, name: "Scratch Coal" },
    { id: 26, name: "Indian Coal Dhanbaad" },
  ];

  // Add a new blend panel
  const addPanel = () => {
    const newId = panels.length > 0 ? Math.max(...panels.map((p) => p.id)) + 1 : 1;
    setPanels([
      ...panels,
      {
        id: newId,
        numCoals: "",
        coalSelections: [{ id: 1, coalId: "", percentage: "" }],
        totalPercentage: 0,
        results: null,
      },
    ]);
  };

  // Remove a blend panel
  const removePanel = (panelId) => {
    if (panels.length > 1) {
      setPanels(panels.filter((panel) => panel.id !== panelId));
    }
  };

  // Handle changing the number of coals for a specific panel
  const handleNumCoalsChange = (panelId, e) => {
    const num = Number.parseInt(e.target.value) || "";

    setPanels(
      panels.map((panel) => {
        if (panel.id === panelId) {
          let newCoalSelections = [...panel.coalSelections];

          if (num > panel.coalSelections.length) {
            // Add new empty coal selections
            for (let i = panel.coalSelections.length + 1; i <= num; i++) {
              newCoalSelections.push({ id: i, coalId: "", percentage: "" });
            }
          } else if (num < panel.coalSelections.length) {
            // Remove excess coal selections
            newCoalSelections = panel.coalSelections.slice(0, num);
          }

          // Recalculate total percentage
          const total = newCoalSelections.reduce(
            (sum, coal) => sum + (Number.parseFloat(coal.percentage) || 0),
            0
          );

          return {
            ...panel,
            numCoals: num,
            coalSelections: newCoalSelections,
            totalPercentage: total,
          };
        }
        return panel;
      })
    );
  };

  // Handle coal selection change for a specific panel
  const handleCoalChange = (panelId, coalId, field, value) => {
    setPanels(
      panels.map((panel) => {
        if (panel.id === panelId) {
          const updatedSelections = panel.coalSelections.map((coal) =>
            coal.id === coalId ? { ...coal, [field]: value } : coal
          );

          // Update total percentage if the percentage field was changed
          let totalPercentage = panel.totalPercentage;
          if (field === "percentage") {
            totalPercentage = updatedSelections.reduce(
              (sum, coal) => sum + (Number.parseFloat(coal.percentage) || 0),
              0
            );
          }

          return {
            ...panel,
            coalSelections: updatedSelections,
            totalPercentage,
          };
        }
        return panel;
      })
    );
  };

  // Handle search input change
  const handleSearchChange = (panelId, coalId, value) => {
    setSearchInputs((prev) => ({
      ...prev,
      [`${panelId}-${coalId}`]: value,
    }));

    // Filter coals based on input
    const filtered = availableCoals.filter((coal) =>
      coal.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCoals((prev) => ({
      ...prev,
      [`${panelId}-${coalId}`]: filtered,
    }));
  };

  // Handle coal selection
  const handleCoalSelect = (panelId, coalId, selectedCoal) => {
    handleCoalChange(panelId, coalId, "coalId", selectedCoal.id);
    setSearchInputs((prev) => ({
      ...prev,
      [`${panelId}-${coalId}`]: selectedCoal.name,
    }));
    setFilteredCoals((prev) => ({
      ...prev,
      [`${panelId}-${coalId}`]: [],
    }));
  };

  // Add a function to check if any coal is unselected but has percentage
  const hasUnselectedCoalWithPercentage = (panel) => {
    return panel.coalSelections.some((coal) => coal.percentage && !coal.coalId);
  };

  // Handle run button click for a specific panel
  const handleRun = async (panelId) => {
    const panel = panels.find((p) => p.id === panelId);
    if (!panel || panel.totalPercentage !== 100) {
      alert("Total percentage must equal 100% to run");
      return;
    }

    // Check for unselected coals with percentages
    if (hasUnselectedCoalWithPercentage(panel)) {
      alert("Please select a coal for all percentage entries");
      return;
    }

    setIsPanelLoading((prev) => ({ ...prev, [panelId]: true }));

    try {
      // Prepare the request payload
      const payload = {
        blends: panel.coalSelections.map((coal) => ({
          coal_name: availableCoals.find((c) => c.id === Number(coal.coalId))?.name,
          percentage: Number(coal.percentage),
        })),
      };

      // Make the API call with credentials
      const response = await axios.post("/predict", payload, {
        withCredentials: true,
      });

      // Update the results for the specific panel
      setPanels(
        panels.map((panel) => {
          if (panel.id === panelId) {
            return {
              ...panel,
              results: {
                blendProperties: response.data.blend_properties,
                predictedCoalProperties: response.data.predicted_coal_properties,
                cokeProperties: response.data.predicted_coke_properties,
              },
            };
          }
          return panel;
        })
      );
    } catch (error) {
      console.error("Error getting prediction:", error);
      if (error.response?.status === 401) {
        // Handle unauthorized error by logging out
        dispatch(logout());
        navigate("/login");
      } else {
        alert(error.response?.data?.detail || "Failed to get prediction. Please try again.");
      }
    } finally {
      setIsPanelLoading((prev) => ({ ...prev, [panelId]: false }));
    }
  };

  return (
    <PageLayout title="Prediction">
      {/* Add Blend Button at the top */}
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-medium text-gray-700">Coal Blends</h2>
        <button
          onClick={addPanel}
          className="flex items-center px-4 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
        >
          <Plus size={15} className="mr-2" />
          Add Blend
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {panels.map((panel) => (
          <div key={panel.id} className="flex flex-col">
            {/* Coal Selection Panel */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-6 bg-blue-180">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-medium text-gray-700">Blend {panel.id}</h2>
                {panels.length > 1 && (
                  <button
                    onClick={() => removePanel(panel.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter no. of coals
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={panel.numCoals}
                    onChange={(e) => handleNumCoalsChange(panel.id, e)}
                    className="w-full p-2 text-sm text-gray-900 font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yeloo-500 transition-all duration-200 bg-white hover:border-gray-300 shadow-sm placeholder-gray-400"
                  />
                </div>

                <div className="space-y-3 mb-4">
                  {panel.coalSelections.map((coal) => (
                    <div key={coal.id} className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className={
                            coal.id === 1
                              ? "block text-sm font-medium text-gray-700 mb-1"
                              : "sr-only"
                          }
                        >
                          Coal Name
                        </label>
                        <div className="relative">
                          <div className="flex">
                            <input
                              type="text"
                              value={searchInputs[`${panel.id}-${coal.id}`] || ""}
                              onChange={(e) =>
                                handleSearchChange(panel.id, coal.id, e.target.value)
                              }
                              className="w-full p-2 text-sm text-gray-900 font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yeloo-500 transition-all duration-200 bg-white hover:border-gray-300 shadow-sm placeholder-gray-400"
                              placeholder="Search coal"
                              style={{ fontSize: "12px" }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFilteredCoals((prev) => {
                                  const currentList = prev[`${panel.id}-${coal.id}`];
                                  const isListVisible = currentList && currentList.length > 0;

                                  return {
                                    ...prev,
                                    [`${panel.id}-${coal.id}`]: isListVisible ? [] : availableCoals,
                                  };
                                });
                              }}
                              className="ml-1 px-2 border border-gray-700 rounded-md bg-gray-700 text-white hover:bg-gray-600"
                            >
                              ▼
                            </button>
                          </div>
                          {filteredCoals[`${panel.id}-${coal.id}`]?.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-auto">
                              {filteredCoals[`${panel.id}-${coal.id}`].map((availableCoal) => (
                                <div
                                  key={availableCoal.id}
                                  onClick={() => handleCoalSelect(panel.id, coal.id, availableCoal)}
                                  className="px-2 py-1 text-sm text-white hover:bg-gray-600 cursor-pointer"
                                  style={{ fontSize: "12px" }}
                                >
                                  {availableCoal.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label
                          className={
                            coal.id === 1
                              ? "block text-sm font-medium text-gray-700 mb-1"
                              : "sr-only"
                          }
                        >
                          Percentage
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={coal.percentage}
                          onChange={(e) =>
                            handleCoalChange(
                              panel.id,
                              coal.id,
                              "percentage",
                              Number.parseFloat(e.target.value) || ""
                            )
                          }
                          className="w-full p-2 text-sm text-gray-900 font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yeloo-500 transition-all duration-200 bg-white hover:border-gray-300 shadow-sm placeholder-gray-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm font-medium text-gray-700">
                    Total Percentage:&nbsp;
                    <span
                      className={panel.totalPercentage === 100 ? "text-green-600" : "text-red-600"}
                    >
                      {panel.totalPercentage}%
                    </span>
                  </div>
                  {panel.totalPercentage > 100 && (
                    <div className="text-sm text-red-600">Total cannot exceed 100%</div>
                  )}
                </div>

                <button
                  onClick={() => handleRun(panel.id)}
                  disabled={
                    isPanelLoading[panel.id] ||
                    panel.totalPercentage !== 100 ||
                    hasUnselectedCoalWithPercentage(panel)
                  }
                  className={`w-full py-2 px-4 rounded-md font-medium text-white ${
                    isPanelLoading[panel.id] ||
                    panel.totalPercentage !== 100 ||
                    hasUnselectedCoalWithPercentage(panel)
                      ? "bg-yellow-300 cursor-not-allowed"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                >
                  {isPanelLoading[panel.id] ? "Running..." : "Run"}
                </button>
              </div>
            </div>

            {/* Results for this panel */}
            {panel.results && (
              <div className="space-y-4">
                {/* Blend Properties */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="font-medium text-gray-700">Coal Properties</h2>
                    <BarChart size={16} className="text-gray-500" />
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {panel.results.predictedCoalProperties &&
                        Object.entries(panel.results.predictedCoalProperties).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between py-1 border-b border-gray-200 last:border-0"
                            >
                              <span className="text-sm text-gray-600">{key}</span>
                              <span className="text-sm font-medium  text-gray-600">
                                {value.toFixed(2)}
                              </span>
                            </div>
                          )
                        )}
                    </div>
                  </div>
                </div>

                {/* Coke Properties */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="font-medium text-gray-700">Coke Properties</h2>
                    <BarChart size={16} className="text-gray-500" />
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {panel.results.cokeProperties &&
                        Object.entries(panel.results.cokeProperties).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between py-1 border-b border-gray-200 last:border-0"
                          >
                            <span className="text-sm text-gray-600">{key}</span>
                            <span className="text-sm font-medium  text-gray-600 ">
                              {value.toFixed(2)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </PageLayout>
  );
}

export default Prediction;
