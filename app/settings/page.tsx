"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react'; 
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// Assuming you have a Button component, otherwise use <button>
// import { Button } from '@/components/ui/button'; 
// Assuming you have a Select component, otherwise use <select>
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Assuming you have a Label component
// import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(undefined);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  
  // State for OpenAI models fetched by the action
  const [openAIModelsData, setOpenAIModelsData] = useState<string[] | null>(null);
  const [isLoadingOpenAIModels, setIsLoadingOpenAIModels] = useState(false);
  const [openAIModelsError, setOpenAIModelsError] = useState<string | null>(null);

  // Fetch current user settings
  const currentUserSettings = useQuery(api.notes.getUserSettings);
  
  // Get the action function for listing OpenAI models
  const listOpenAIModelsAction = useAction(api.openai.listModels);

  // Mutation to save settings
  const saveUserSettings = useMutation(api.notes.setUserSettings);

  useEffect(() => {
    if (currentUserSettings) {
      setSelectedProvider(currentUserSettings.llmProvider || 'together'); // Default to 'together'
      // Set selectedModel based on the provider
      if (currentUserSettings.llmProvider === 'openai') {
        setSelectedModel(currentUserSettings.openaiModel);
      } else if (currentUserSettings.llmProvider === 'together') {
        setSelectedModel(currentUserSettings.togetherModel);
      } else {
        setSelectedModel(undefined); // Default or for other providers
      }
    }
  }, [currentUserSettings]);

  // useEffect to fetch OpenAI models when provider is 'openai'
  useEffect(() => {
    if (selectedProvider === 'openai') {
      setIsLoadingOpenAIModels(true);
      setOpenAIModelsError(null);
      setOpenAIModelsData(null); // Clear previous models
      listOpenAIModelsAction({}) // Pass empty object if action expects no args, or required args
        .then((models) => {
          setOpenAIModelsData(models);
        })
        .catch((error) => {
          console.error("Failed to fetch OpenAI models:", error);
          setOpenAIModelsError(error.message || "Failed to fetch models. Check API key and Convex logs.");
        })
        .finally(() => {
          setIsLoadingOpenAIModels(false);
        });
    } else {
      setOpenAIModelsData(null); // Clear models if provider is not OpenAI
      setAvailableModels([]); // Clear available models for the dropdown
    }
  }, [selectedProvider, listOpenAIModelsAction]);

  // useEffect to populate the dropdown's 'availableModels' from fetched 'openAIModelsData'
  useEffect(() => {
    if (selectedProvider === 'openai' && openAIModelsData) {
      const models = openAIModelsData.map(modelId => ({ id: modelId, name: modelId }));
      setAvailableModels(models);
      // If current model isn't in the new list or provider changed, try to set a default
      if (!models.find(m => m.id === selectedModel) && models.length > 0) {
        // Prioritize gpt-4o, then the first in the list
        const defaultModel = models.find(m => m.id === 'gpt-4o') ? 'gpt-4o' : models[0].id;
        setSelectedModel(defaultModel);
      }
    } else if (selectedProvider !== 'openai') {
      setAvailableModels([]); // Clear if not OpenAI
    }
  }, [selectedProvider, openAIModelsData, selectedModel]); // Added selectedModel dependency

  const handleSave = async () => {
    if (!selectedProvider) {
      alert('Please select an LLM provider.');
      return;
    }

    // Prepare settings object for mutation
    const settingsToSave: {
      llmProvider: string;
      openaiModel?: string;
      togetherModel?: string;
      // geminiModel?: string; // If Gemini was an option
    } = { llmProvider: selectedProvider };

    if (selectedProvider === 'openai') {
      if (!selectedModel && availableModels.length > 0) {
        alert('Please select an OpenAI model.');
        return;
      }
      settingsToSave.openaiModel = selectedModel || undefined; // Pass undefined if not set, or a default like 'gpt-4o'
    } else if (selectedProvider === 'together') {
      // For Together AI, specific model selection might not be on client-side, 
      // or you might set a default. Assuming selectedModel holds the value if applicable.
      settingsToSave.togetherModel = selectedModel || undefined; // Or a default like 'mistralai/Mixtral-8x7B-Instruct-v0.1'
    }

    try {
      await saveUserSettings(settingsToSave);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. See console for details.');
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">LLM Settings</h1>

      <div className="space-y-6 max-w-lg">
        <div>
          <label htmlFor="llmProvider" className="block text-sm font-medium text-gray-700 mb-1">
            LLM Provider
          </label>
          <select
            id="llmProvider"
            value={selectedProvider || ''}
            onChange={(e) => {
              setSelectedProvider(e.target.value);
              // Reset model when provider changes, to ensure consistent state
              setSelectedModel(undefined); 
              if (e.target.value !== 'openai') {
                setOpenAIModelsData(null); // Clear fetched models if not OpenAI
                setAvailableModels([]);
              }
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          >
            <option value="together">Together AI</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>

        {selectedProvider === 'openai' && (
          <div>
            <label htmlFor="openaiModel" className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI Model
            </label>
            {isLoadingOpenAIModels && <p>Loading OpenAI models...</p>}
            {openAIModelsError && <p className="text-red-600">Error: {openAIModelsError}</p>}
            {!isLoadingOpenAIModels && !openAIModelsError && (!openAIModelsData || openAIModelsData.length === 0) && selectedProvider === 'openai' && (
              <p>No OpenAI models available. Ensure API key is correct in Convex and models are accessible.</p>
            )}
            {availableModels.length > 0 && (
              <select
                id="openaiModel"
                value={selectedModel || ''}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={availableModels.length === 0} // Should be !availableModels.length > 0 which is availableModels.length === 0
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Ensure your OPENAI_API_KEY is set in Convex environment variables.
            </p>
          </div>
        )}

        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
