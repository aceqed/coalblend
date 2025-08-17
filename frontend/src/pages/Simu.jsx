import PageLayout from "../Layout/pageLayout.jsx";
import { useState, useEffect } from "react";
import { Search, Plus, MoreVertical, Eye } from "lucide-react";
import RecommendationsView from "./RecommendationsView.jsx";
import CreateSimulation from "./CreateSimulation.jsx";

// when we click on the create new simulation then we can put Scenarios name and scenarios description , Scenarios date and after that we have 3
// option deafult or custom where we select the cola and we select the coal and coke properties after that my model will predicts the best blend using these coal
// and also cost effective blend using these coal using generative algoritham
const SimulationManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'recommendations'
  const [selectedScenario, setSelectedScenario] = useState(null);

  // Sample data based on the screenshot
  // this data we fetch from the database where we store the each test date wise sorted and show the latest data
  const scenarios = [
    {
      id: 1,
      name: "test_21/03/2023",
      description: "test_21/03/2023",
      generateDate: "03.05.2023 04:47 PM",
      status: "COMPLETE",
    },
    {
      id: 2,
      name: "test_21/03/2023",
      description: "test_21/03/2023",
      generateDate: "21.02.2023 11:46 AM",
      status: "COMPLETE",
    },
    {
      id: 3,
      name: "test17",
      description: "test17",
      generateDate: "03.05.2023 04:47 PM",
      status: "COMPLETE",
    },
    {
      id: 4,
      name: "test_24/01/2023",
      description: "test_24/01/2023",
      generateDate: "24.01.2023 08:34 PM",
      status: "COMPLETE",
    },
    {
      id: 5,
      name: "test_25/01/2023",
      description: "test_25/01/2023",
      generateDate: "25.01.2023 11:05 AM",
      status: "COMPLETE",
    },
    {
      id: 6,
      name: "test17",
      description: "test17",
      generateDate: "03.05.2023 04:47 PM",
      status: "FAILED",
    },
    {
      id: 7,
      name: "test16",
      description: "test16",
      generateDate: "24.01.2023 08:04 PM",
      status: "FAILED",
    },
    {
      id: 8,
      name: "test15",
      description: "test15",
      generateDate: "24.01.2023 08:05 PM",
      status: "FAILED",
    },
    {
      id: 9,
      name: "test13",
      description: "test13",
      generateDate: "24.01.2023 08:06 PM",
      status: "COMPLETE",
    },
    {
      id: 10,
      name: "test12",
      description: "test12",
      generateDate: "24.01.2023 08:04 PM",
      status: "COMPLETE",
    },
    {
      id: 11,
      name: "test11",
      description: "test11",
      generateDate: "24.01.2023 08:14 PM",
      status: "COMPLETE",
    },
    {
      id: 12,
      name: "test10",
      description: "test10_saved",
      generateDate: "24.01.2023 08:24 PM",
      status: "COMPLETE",
    },
    {
      id: 13,
      name: "test9",
      description: "test_saved",
      generateDate: "24.01.2023 08:40 PM",
      status: "COMPLETE",
    },
    {
      id: 14,
      name: "test_1_ok_ok",
      description: "test_graphique",
      generateDate: "24.01.2023 02:20 PM",
      status: "COMPLETE",
    },
    {
      id: 15,
      name: "tests_24/01/2023",
      description: "tests_24/01/2023",
      generateDate: "24.01.2023 01:54 PM",
      status: "COMPLETE",
    },
    {
      id: 16,
      name: "tests_24/01/2023",
      description: "tests_24/01/2023",
      generateDate: "24.01.2023 01:23 PM",
      status: "COMPLETE",
    },
    {
      id: 17,
      name: "tests_24/01/2023",
      description: "tests_24/01/2023",
      generateDate: "24.01.2023 01:19 PM",
      status: "RUNNING",
    },
    {
      id: 18,
      name: "tests_24/01/2023",
      description: "tests_24/01/2023",
      generateDate: "24.01.2023 01:19 PM",
      status: "RUNNING",
    },
  ];

  // Filter scenarios based on search term (including date)
  const filteredScenarios = scenarios.filter(
    (scenario) =>
      scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.generateDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status styling
  // when we select all the datapoint  when we create the new simulation then after means when we click on the predict button then this wiil run
  const getStatusStyle = (status) => {
    switch (status) {
      case "COMPLETE":
        return "bg-green-100 text-green-800 border-green-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      case "RUNNING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleGenerate = () => {
    console.log("Generate clicked");
    // Add your generate logic here
  };

  const handleCreateNewSimulation = () => {
    console.log("Create new simulation clicked");
    setViewMode("create");
    // Add your create new simulation logic here
  };

  const handleDropdownToggle = (scenarioId) => {
    setOpenDropdown(openDropdown === scenarioId ? null : scenarioId);
  };

  const handleView = (scenario) => {
    console.log("View scenario:", scenario);
    setSelectedScenario(scenario);
    setViewMode("recommendations");
    setOpenDropdown(null);
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedScenario(null);
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

  if (viewMode === "recommendations" && selectedScenario) {
    return <RecommendationsView scenario={selectedScenario} onBack={handleBackToList} />;
  }
  if (viewMode === "create") {
    return <CreateSimulation onBack={handleBackToList} />;
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
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent w-64"
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
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create new Simulation
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-500 rounded-lg overflow-hidden">
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
                      {scenario.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {scenario.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {scenario.generateDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(
                          scenario.status
                        )}`}
                      >
                        {scenario.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => handleDropdownToggle(scenario.id)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                          title="Click to view"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {openDropdown === scenario.id && (
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
          </div>

          {filteredScenarios.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No scenarios found matching your search.
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default SimulationManager;
