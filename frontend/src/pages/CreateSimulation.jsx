"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Save, Loader } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateSimulation = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState("properties");
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [selectedConfiguration, setSelectedConfiguration] = useState("");
  const [referenceBlendType, setReferenceBlendType] = useState("default");
  const [numberOfCoals, setNumberOfCoals] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [error, setError] = useState(null);
  const [simulationResponse, setSimulationResponse] = useState(null);
  const [coalEntries, setCoalEntries] = useState([
    { name: "Mavis HCC", percentage: 50 },
    { name: "Southfork MV", percentage: 50 },
  ]);

  // Coke Properties state as array of objects with default values
  const [cokeProperties, setCokeProperties] = useState([
    { key: "cri", min: "0.5", max: "1.5" },
    { key: "csr", min: "60", max: "75" },
    { key: "vm", min: "0.5", max: "1.5" },
    { key: "ash", min: "0.5", max: "1.5" },
  ]);

  // Blend Properties state as array of objects with default values
  const [blendProperties, setBlendProperties] = useState([
    { key: "vm", label: "VM", min: "20", max: "30" },
    { key: "fc", label: "FC", min: "50", max: "60" },
    { key: "ash", label: "Ash", min: "8", max: "12" },
    { key: "csn", label: "CSN", min: "0.4", max: "0.8" },
  ]);

  // Temporary state for debouncing
  const [tempCokeValues, setTempCokeValues] = useState({});
  const [tempBlendValues, setTempBlendValues] = useState({});

  const configurations = [
    "Choose the Configuration from the List",
    "Standard Coal Blend Configuration",
    "High Quality Coke Configuration",
    "Low Ash Configuration",
    "Custom Configuration",
  ];

  const navigate = useNavigate();

  const handleBack = () => {
    // Just go back without creating any simulation
    onBack();
  };

  // Handle loader click outside
  const handleLoaderClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowLoader(false);
    }
  };

  // Debounced function for coke properties
  const debouncedCokePropertyChange = useCallback((propertyKey, type, value) => {
    console.log(`Setting coke property: ${propertyKey}, ${type}, ${value}`);
    setCokeProperties((prev) =>
      prev.map((prop) =>
        prop.key === propertyKey
          ? { ...prop, [type]: value === "" ? "" : Number.parseFloat(value) || 0 }
          : prop
      )
    );
  }, []);

  // Debounced function for blend properties
  const debouncedBlendPropertyChange = useCallback((propertyKey, type, value) => {
    console.log(`Setting blend property: ${propertyKey}, ${type}, ${value}`);
    setBlendProperties((prev) =>
      prev.map((prop) =>
        prop.key === propertyKey
          ? { ...prop, [type]: value === "" ? "" : Number.parseFloat(value) || 0 }
          : prop
      )
    );
  }, []);

  // Debouncing effect for coke properties
  useEffect(() => {
    const timeouts = Object.entries(tempCokeValues).map(([key, data]) => {
      return setTimeout(() => {
        debouncedCokePropertyChange(data.propertyKey, data.type, data.value);
        setTempCokeValues((prev) => {
          const newValues = { ...prev };
          delete newValues[key];
          return newValues;
        });
      }, 500); // 500ms delay
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [tempCokeValues, debouncedCokePropertyChange]);

  // Debouncing effect for blend properties
  useEffect(() => {
    const timeouts = Object.entries(tempBlendValues).map(([key, data]) => {
      return setTimeout(() => {
        debouncedBlendPropertyChange(data.propertyKey, data.type, data.value);
        setTempBlendValues((prev) => {
          const newValues = { ...prev };
          delete newValues[key];
          return newValues;
        });
      }, 500); // 500ms delay
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [tempBlendValues, debouncedBlendPropertyChange]);

  const handleCokePropertyChange = (propertyKey, type, value) => {
    const tempKey = `${propertyKey}_${type}`;
    setTempCokeValues((prev) => ({
      ...prev,
      [tempKey]: { propertyKey, type, value },
    }));
  };

  const handleBlendPropertyChange = (propertyKey, type, value) => {
    const tempKey = `${propertyKey}_${type}`;
    setTempBlendValues((prev) => ({
      ...prev,
      [tempKey]: { propertyKey, type, value },
    }));
  };

  const handleCoalEntryChange = (index, field, value) => {
    const updatedEntries = [...coalEntries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    setCoalEntries(updatedEntries);
  };

  const addCoalEntry = () => {
    setCoalEntries([...coalEntries, { name: "", percentage: 0 }]);
    setNumberOfCoals(coalEntries.length + 1);
  };

  const removeCoalEntry = (index) => {
    const updatedEntries = coalEntries.filter((_, i) => i !== index);
    setCoalEntries(updatedEntries);
    setNumberOfCoals(updatedEntries.length);
  };

  const handleNumberOfCoalsChange = (value) => {
    const num = Number.parseInt(value) || 0;
    setNumberOfCoals(num);

    if (num > coalEntries.length) {
      const newEntries = [...coalEntries];
      for (let i = coalEntries.length; i < num; i++) {
        newEntries.push({ name: "", percentage: 0 });
      }
      setCoalEntries(newEntries);
    } else if (num < coalEntries.length) {
      setCoalEntries(coalEntries.slice(0, num));
    }
  };

  const validateForm = () => {
    if (!scenarioName.trim()) {
      setError("Scenario name is required");
      return false;
    }
    if (!scenarioDescription.trim()) {
      setError("Scenario description is required");
      return false;
    }
    if (selectedConfiguration === "") {
      setError("Please select a configuration");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      setError(null);

      // Validate form
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      setIsProcessing(true);

      // Prepare coke properties
      const cokeProps = cokeProperties.map((prop) => ({
        property_type: "coke",
        property_name: prop.key,
        min_value: prop.min || 0,
        max_value: prop.max || 0,
      }));

      // Prepare blend properties
      const blendProps = blendProperties.map((prop) => ({
        property_type: "blend",
        property_name: prop.key,
        min_value: prop.min || 0,
        max_value: prop.max || 0,
      }));

      // Create simulation request
      const simulationData = {
        scenario_name: scenarioName.trim(),
        scenario_description: scenarioDescription.trim(),
        coke_properties: cokeProps,
        blend_properties: blendProps,
      };

      console.log("Sending simulation data:", simulationData); // Debug log

      // Step 1: Create the simulation record
      const createResponse = await axios.post("http://localhost:8000/simulation", simulationData, {
        withCredentials: true,
      });

      console.log("Received create response:", createResponse.data); // Debug log

      if (!createResponse.data || !createResponse.data.id) {
        throw new Error("Invalid response from server");
      }

      // Step 2: Start the optimization process
      const startResponse = await axios.post(
        `http://localhost:8000/simulation/${createResponse.data.id}/start`,
        simulationData,
        {
          withCredentials: true,
        }
      );

      console.log("Received start response:", startResponse.data); // Debug log

      // Create new simulation object with running status
      const newSimulation = {
        ...createResponse.data,
        status: "running",
        generated_date: new Date().toISOString(),
      };

      console.log("Created new simulation:", newSimulation); // Debug log

      setSimulationResponse(newSimulation);
      setActiveTab("output");
      setIsProcessing(false);

      // Pass the running simulation to parent and navigate back
      onBack(newSimulation);
    } catch (error) {
      console.error("Error creating simulation:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to create simulation. Please try again.";
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
      setIsProcessing(false);
    }
  };

  // Remove polling effect and just handle the initial response
  useEffect(() => {
    if (simulationResponse?.status === "completed") {
      setIsProcessing(false);
      onBack();
    } else if (simulationResponse?.status === "failed") {
      setError("Simulation failed to complete");
      setIsProcessing(false);
    }
  }, [simulationResponse?.status, onBack]);

  // Get current value for input (either from temp state or actual state)
  const getCokeValue = (propertyKey, type) => {
    const tempKey = `${propertyKey}_${type}`;
    if (tempCokeValues[tempKey]) {
      return tempCokeValues[tempKey].value;
    }
    const property = cokeProperties.find((prop) => prop.key === propertyKey);
    return property ? property[type] : "";
  };

  const getBlendValue = (propertyKey, type) => {
    const tempKey = `${propertyKey}_${type}`;
    if (tempBlendValues[tempKey]) {
      return tempBlendValues[tempKey].value;
    }
    const property = blendProperties.find((prop) => prop.key === propertyKey);
    return property ? property[type] : "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-2 p-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-800">Create New Simulation</h1>
              <p className="text-xs text-gray-600">
                Configure your coal blend simulation parameters
              </p>
            </div>
          </div>
        </div>

        {/* Processing Overlay */}
        {isProcessing && showLoader && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleLoaderClick}
          >
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <div className="flex flex-col items-center">
                <Loader className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Processing Simulation</h3>
                <p className="text-sm text-gray-600 text-center">
                  Please wait while we process your simulation. This may take a few minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-2">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("properties")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "properties"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📋 Properties
            </button>
            <button
              onClick={() => setActiveTab("output")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "output"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📊 Output
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-3">
            {activeTab === "properties" && (
              <div className="space-y-3">
                {/* Scenario Description */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 shadow-sm">
                  <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Scenario Configuration
                  </h2>
                  <div className="space-y-3">
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2 border border-purple-100 hover:shadow-md hover:shadow-purple-200/30 transition-all duration-200">
                      <label className="block text-xs font-semibold text-gray-800 mb-1 flex items-center gap-1">
                        <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
                        Scenario Name
                      </label>
                      <input
                        type="text"
                        value={scenarioName}
                        onChange={(e) => setScenarioName(e.target.value)}
                        placeholder="Enter a descriptive name for your scenario"
                        className="w-full px-2 py-1 text-sm text-gray-900 font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-300 shadow-sm placeholder-gray-400"
                      />
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2 border border-purple-100 hover:shadow-md hover:shadow-purple-200/30 transition-all duration-200">
                      <label className="block text-xs font-semibold text-gray-800 mb-1 flex items-center gap-1">
                        <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
                        Scenario Description
                      </label>
                      <textarea
                        value={scenarioDescription}
                        onChange={(e) => setScenarioDescription(e.target.value)}
                        placeholder="Provide a detailed description of your coal blending scenario"
                        rows={2}
                        className="w-full px-2 py-1 text-sm text-gray-900 font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-300 shadow-sm placeholder-gray-400 resize-none"
                      />
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2 border border-purple-100 hover:shadow-md hover:shadow-purple-200/30 transition-all duration-200">
                      <label className="block text-xs font-semibold text-gray-800 mb-1 flex items-center gap-1">
                        <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
                        Configuration Template
                      </label>
                      <select
                        value={selectedConfiguration}
                        onChange={(e) => setSelectedConfiguration(e.target.value)}
                        className="w-full px-2 py-1 text-sm text-gray-900 font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-300 shadow-sm cursor-pointer"
                      >
                        {configurations.map((config, index) => (
                          <option
                            key={index}
                            value={config}
                            disabled={index === 0}
                            className="text-sm font-medium"
                          >
                            {config}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Properties in 2 columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Coke Properties */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Coke Properties
                    </h3>
                    <div className="space-y-2">
                      {cokeProperties.map((property) => (
                        <div
                          key={property.key}
                          className="bg-white/70 backdrop-blur-sm rounded-lg p-2 border border-blue-100 hover:shadow-lg hover:shadow-blue-200/50 hover:scale-[1.02] hover:bg-white/90 hover:border-blue-300 transition-all duration-300 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-20 flex-shrink-0">
                              <span className="text-gray-800 font-semibold text-xs uppercase tracking-wide">
                                {property.key.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 text-xs font-medium">Min</span>
                              <input
                                type="number"
                                value={getCokeValue(property.key, "min")}
                                onChange={(e) =>
                                  handleCokePropertyChange(property.key, "min", e.target.value)
                                }
                                className="w-16 px-1 py-1 text-xs text-gray-900 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 shadow-sm"
                              />
                              <span className="text-gray-700 text-xs font-medium">Max</span>
                              <input
                                type="number"
                                value={getCokeValue(property.key, "max")}
                                onChange={(e) =>
                                  handleCokePropertyChange(property.key, "max", e.target.value)
                                }
                                className="w-16 px-1 py-1 text-xs text-gray-900 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blend Properties */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Blend Properties
                    </h3>
                    <div className="space-y-2">
                      {blendProperties.map((property) => (
                        <div
                          key={property.key}
                          className="bg-white/70 backdrop-blur-sm rounded-lg p-2 border border-green-100 hover:shadow-lg hover:shadow-green-200/50 hover:scale-[1.02] hover:bg-white/90 hover:border-green-300 transition-all duration-300 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-20 flex-shrink-0">
                              <span className="text-gray-800 font-semibold text-xs uppercase tracking-wide">
                                {property.key.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 text-xs font-medium">Min</span>
                              <input
                                type="number"
                                value={getBlendValue(property.key, "min")}
                                onChange={(e) =>
                                  handleBlendPropertyChange(property.key, "min", e.target.value)
                                }
                                className="w-16 px-1 py-1 text-xs text-gray-900 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-300 shadow-sm"
                              />
                              <span className="text-gray-700 text-xs font-medium">Max</span>
                              <input
                                type="number"
                                value={getBlendValue(property.key, "max")}
                                onChange={(e) =>
                                  handleBlendPropertyChange(property.key, "max", e.target.value)
                                }
                                className="w-16 px-1 py-1 text-xs text-gray-900 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-300 shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reference Blend */}
              </div>
            )}

            {activeTab === "output" && (
              <div className="space-y-4">
                {!simulationResponse ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Run the simulation to see the results here.</p>
                  </div>
                ) : (
                  <>
                    {/* Simulation Details */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Simulation Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Scenario Name</p>
                          <p className="text-sm text-gray-900">
                            {simulationResponse.scenario_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Status</p>
                          <p className="text-sm text-gray-900">{simulationResponse.status}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Generated Date</p>
                          <p className="text-sm text-gray-900">
                            {new Date(simulationResponse.generated_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Blend Recommendations */}
                    {simulationResponse.recommendations &&
                      simulationResponse.recommendations.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            Blend Recommendations
                          </h3>
                          <div className="space-y-6">
                            {/* Group recommendations by blend */}
                            {Object.entries(
                              simulationResponse.recommendations.reduce((acc, rec) => {
                                const key = `${rec.predicted_ash_final}-${rec.predicted_vm_final}-${rec.predicted_csr}-${rec.predicted_cri}`;
                                if (!acc[key]) {
                                  acc[key] = {
                                    coals: [],
                                    predicted: {
                                      ash_final: rec.predicted_ash_final,
                                      vm_final: rec.predicted_vm_final,
                                      csr: rec.predicted_csr,
                                      cri: rec.predicted_cri,
                                    },
                                  };
                                }
                                acc[key].coals.push({
                                  name: rec.coal_name,
                                  percentage: rec.percentage,
                                });
                                return acc;
                              }, {})
                            ).map(([key, blend], index) => (
                              <div
                                key={key}
                                className="border border-gray-200 rounded-lg overflow-hidden"
                              >
                                {/* Blend Header */}
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-blue-500 rounded-lg">
                                        <span className="text-white font-semibold">
                                          Blend {index + 1}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Total:</span>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200">
                                          {blend.coals.reduce(
                                            (sum, coal) => sum + coal.percentage,
                                            0
                                          )}
                                          %
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-sm text-gray-600">
                                        <span className="font-medium">Coals:</span>{" "}
                                        {blend.coals.length}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Predicted Properties */}
                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Predicted Properties
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                                      <div className="text-xs text-gray-500">Ash</div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {blend.predicted.ash}%
                                      </div>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                                      <div className="text-xs text-gray-500">VM</div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {blend.predicted.vm}%
                                      </div>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                                      <div className="text-xs text-gray-500">CSR</div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {blend.predicted.csr}%
                                      </div>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                                      <div className="text-xs text-gray-500">CRI</div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {blend.predicted.cri}%
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Coal Details */}
                                <div className="px-4 py-3">
                                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                                    Coal Composition
                                  </h4>
                                  <div className="space-y-3">
                                    {blend.coals.map((coal, coalIndex) => (
                                      <div
                                        key={coalIndex}
                                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900">
                                              {coal.name}
                                            </span>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                              {coal.percentage}%
                                            </span>
                                          </div>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                            style={{ width: `${coal.percentage}%` }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Properties Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Coke Properties */}
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Coke Properties
                        </h3>
                        <div className="space-y-2">
                          {simulationResponse.coke_properties?.map((prop, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{prop.property_name}</span>
                              <span className="text-sm text-gray-900">
                                {prop.min_value} - {prop.max_value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Blend Properties */}
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Blend Properties
                        </h3>
                        <div className="space-y-2">
                          {simulationResponse.blend_properties?.map((prop, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{prop.property_name}</span>
                              <span className="text-sm text-gray-900">
                                {prop.min_value} - {prop.max_value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleBack}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-red-500 transition-colors text-xs font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isProcessing}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded hover:from-blue-600 hover:to-blue-700 transition-all text-xs font-medium flex items-center gap-1 shadow-md disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader className="h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : isProcessing ? (
              <>
                <Loader className="h-3 w-3 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                Save and Run
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSimulation;
