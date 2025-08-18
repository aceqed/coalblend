import React, { useState } from 'react';
import { 
  Play, 
  Eye, 
  Target, 
  Upload, 
  Edit, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Settings,
  Database,
  Plus,
  Search,
  Save,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Percent
} from 'lucide-react';
import PageLayout from '../Layout/pageLayout';

const Help = () => {
  const [expandedSection, setExpandedSection] = useState('simulation');
  const [expandedSubsection, setExpandedSubsection] = useState('');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? '' : section);
    setExpandedSubsection('');
  };

  const toggleSubsection = (subsection) => {
    setExpandedSubsection(expandedSubsection === subsection ? '' : subsection);
  };

  const sections = [
    {
      id: 'simulation',
      title: 'Simulation Manager',
      icon: <Play className="w-5 h-5" />,
      subsections: [
        {
          id: 'create',
          title: 'Create a New Simulation',
          icon: <Plus className="w-4 h-4" />,
          steps: [
            { text: 'Click on Create New Simulation', icon: <Plus className="w-4 h-4" /> },
            { text: 'Enter the scenario name and description', icon: <Edit className="w-4 h-4" /> },
            { text: 'Select the configuration template', icon: <Settings className="w-4 h-4" /> },
            { text: 'Enter the coke properties and blend properties', icon: <Database className="w-4 h-4" /> },
            { text: 'Click Save and Run to start the simulation', icon: <Play className="w-4 h-4" /> }
          ]
        },
        {
          id: 'view',
          title: 'View Simulation Results',
          icon: <Eye className="w-4 h-4" />,
          steps: [
            { text: 'Go to the Actions menu', icon: <MoreHorizontal className="w-4 h-4" /> },
            { text: 'Click on the three-dot icon next to your simulation', icon: <MoreHorizontal className="w-4 h-4" /> },
            { text: 'Select View', icon: <Eye className="w-4 h-4" /> },
            { text: 'Your simulation results will be displayed', icon: <CheckCircle className="w-4 h-4" /> }
          ]
        }
      ]
    },
    {
      id: 'prediction',
      title: 'Prediction',
      icon: <Target className="w-5 h-5" />,
      subsections: [
        {
          id: 'coal-blend',
          title: 'Coal Blend Prediction',
          icon: <Target className="w-4 h-4" />,
          steps: [
            { text: 'Click on Prediction', icon: <Target className="w-4 h-4" /> },
            { text: 'In the Coal Blend section: Enter the number of coals', icon: <Database className="w-4 h-4" /> },
            { text: 'Search for each coal name', icon: <Search className="w-4 h-4" /> },
            { text: 'Enter the percentage for each coal', icon: <Percent className="w-4 h-4" /> },
            { text: 'Ensure that the total percentage equals 100% across all coals', icon: <AlertCircle className="w-4 h-4" /> },
            { text: 'To run multiple coal blend predictions, click on Add Blend', icon: <Plus className="w-4 h-4" /> }
          ]
        }
      ]
    },
    {
      id: 'vendor',
      title: 'Vendor Data Upload',
      icon: <Upload className="w-5 h-5" />,
      subsections: [
        {
          id: 'pdf-upload',
          title: 'Upload PDF',
          icon: <FileText className="w-4 h-4" />,
          steps: [
            { text: 'You can upload any PDF file that contains coal values', icon: <FileText className="w-4 h-4" /> },
            { text: 'The system will automatically extract the values and store them in our database', icon: <Database className="w-4 h-4" /> }
          ]
        },
        {
          id: 'manual-entry',
          title: 'Manual Entry',
          icon: <Edit className="w-4 h-4" />,
          steps: [
            { text: 'You can manually enter the coal properties', icon: <Edit className="w-4 h-4" /> },
            { text: 'After entering the details, click Save to store the coal properties', icon: <Save className="w-4 h-4" /> }
          ]
        }
      ]
    }
  ];

  return (
    <PageLayout title="Help Page">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Help & Documentation</h1>
          <p className="text-gray-600">Learn how to use the Simulation Manager, make predictions, and upload vendor data effectively.</p>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">{section.icon}</div>
                  <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                </div>
                {expandedSection === section.id ? 
                  <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                }
              </button>

              {/* Section Content */}
              {expandedSection === section.id && (
                <div className="border-t border-gray-100">
                  {section.subsections.map((subsection) => (
                    <div key={subsection.id} className="border-b border-gray-50 last:border-b-0">
                      {/* Subsection Header */}
                      <button
                        onClick={() => toggleSubsection(subsection.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-25 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-indigo-600">{subsection.icon}</div>
                          <h3 className="text-md font-medium text-gray-800">{subsection.title}</h3>
                        </div>
                        {expandedSubsection === subsection.id ? 
                          <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        }
                      </button>

                      {/* Steps */}
                      {expandedSubsection === subsection.id && (
                        <div className="px-4 pb-4">
                          <div className="ml-8 space-y-3">
                            {subsection.steps.map((step, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                                    {index + 1}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 flex-1">
                                  <div className="text-gray-500">{step.icon}</div>
                                  <p className="text-gray-700 text-sm leading-relaxed">{step.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 mb-1">Pro Tips</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Always ensure coal blend percentages total 100% before running predictions</li>
                <li>• PDF uploads automatically extract values - no manual data entry required</li>
                <li>• Use descriptive scenario names to easily identify simulations later</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Help;