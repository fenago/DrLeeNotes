"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react'; 
import { api } from '@/convex/_generated/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ModelOption {
  id: string;
  name: string;
}

export default function SettingsPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(undefined);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const [selectedTranscriptionModel, setSelectedTranscriptionModel] = useState<string | undefined>(undefined);
  
  // Unified state for models in the dropdown
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  
  // State for OpenAI models
  const [openAIModelsData, setOpenAIModelsData] = useState<string[] | null>(null);
  const [isLoadingOpenAIModels, setIsLoadingOpenAIModels] = useState(false);
  const [openAIModelsError, setOpenAIModelsError] = useState<string | null>(null);

  // State for Together AI models
  const [togetherModelsData, setTogetherModelsData] = useState<ModelOption[] | null>(null);
  const [isLoadingTogetherModels, setIsLoadingTogetherModels] = useState(false);
  const [togetherModelsError, setTogetherModelsError] = useState<string | null>(null);

  // State for Gemini models
  const [geminiModelsData, setGeminiModelsData] = useState<ModelOption[] | null>(null);
  const [isLoadingGeminiModels, setIsLoadingGeminiModels] = useState(false);
  const [geminiModelsError, setGeminiModelsError] = useState<string | null>(null);

  // Fetch current user settings
  const currentUserSettings = useQuery(api.notes.getUserSettings);
  
  // Actions
  const listOpenAIModelsAction = useAction(api.openai.listModels);
  const listTogetherModelsAction = useAction(api.together.listTogetherModels);
  const listGeminiModelsAction = useAction(api.gemini.listGeminiModels);

  // Mutation to save settings
  const saveUserSettings = useMutation(api.notes.setUserSettings);

  useEffect(() => {
    if (currentUserSettings) {
      const provider = currentUserSettings.llmProvider || 'together';
      setSelectedProvider(provider);
      if (provider === 'openai') {
        setSelectedModel(currentUserSettings.openaiModel);
      } else if (provider === 'together') {
        setSelectedModel(currentUserSettings.togetherModel);
      } else if (provider === 'gemini') {
        setSelectedModel(currentUserSettings.geminiModel);
      } else {
        setSelectedModel(undefined);
      }
      setSelectedTranscriptionModel(currentUserSettings.transcriptionModelIdentifier || 'default_whisper');
    }
  }, [currentUserSettings]);

  // useEffect to fetch OpenAI models
  useEffect(() => {
    if (selectedProvider === 'openai') {
      setIsLoadingOpenAIModels(true);
      setOpenAIModelsError(null);
      setOpenAIModelsData(null); 
      listOpenAIModelsAction({})
        .then((models) => {
          setOpenAIModelsData(models);
        })
        .catch((error) => {
          console.error("Failed to fetch OpenAI models:", error);
          setOpenAIModelsError(error.message || "Failed to fetch models. Check API key.");
        })
        .finally(() => {
          setIsLoadingOpenAIModels(false);
        });
    } else {
      // Clear OpenAI specific data if provider changes
      setOpenAIModelsData(null);
    }
  }, [selectedProvider, listOpenAIModelsAction]);

  // useEffect to fetch Together AI models
  useEffect(() => {
    if (selectedProvider === 'together') {
      setIsLoadingTogetherModels(true);
      setTogetherModelsError(null);
      setTogetherModelsData(null);
      listTogetherModelsAction({}) 
        .then((models) => {
          setTogetherModelsData(models); 
        })
        .catch((error) => {
          console.error("Failed to fetch Together AI models:", error);
          setTogetherModelsError(error.message || "Failed to fetch models. Check API key.");
        })
        .finally(() => {
          setIsLoadingTogetherModels(false);
        });
    } else {
      // Clear Together AI specific data if provider changes
      setTogetherModelsData(null);
    }
  }, [selectedProvider, listTogetherModelsAction]);

  // useEffect to fetch Gemini models
  useEffect(() => {
    if (selectedProvider === 'gemini') {
      setIsLoadingGeminiModels(true);
      setGeminiModelsError(null);
      setGeminiModelsData(null);
      listGeminiModelsAction({})
        .then((models) => {
          setGeminiModelsData(models as ModelOption[]); 
        })
        .catch((error) => {
          console.error("Failed to fetch Gemini models:", error);
          setGeminiModelsError(error.message || "Failed to fetch models. Check API key.");
        })
        .finally(() => {
          setIsLoadingGeminiModels(false);
        });
    } else {
      // Clear Gemini specific data if provider changes
      setGeminiModelsData(null);
    }
  }, [selectedProvider, listGeminiModelsAction]);

  // useEffect to populate the 'availableModels' dropdown from fetched data
  useEffect(() => {
    if (selectedProvider === 'openai' && openAIModelsData) {
      const models = openAIModelsData.map(modelId => ({ id: modelId, name: modelId }));
      setAvailableModels(models);
      if (!models.find(m => m.id === selectedModel) && models.length > 0) {
        const defaultModel = models.find(m => m.id === 'gpt-4o') ? 'gpt-4o' : models[0].id;
        setSelectedModel(defaultModel);
      } else if (models.length === 0 && selectedModel !== undefined) {
          setSelectedModel(undefined); 
      }
    } else if (selectedProvider === 'together' && togetherModelsData) {
      setAvailableModels(togetherModelsData);
      if (!togetherModelsData.find(m => m.id === selectedModel) && togetherModelsData.length > 0) {
        const preferredDefault = 'mistralai/Mixtral-8x7B-Instruct-v0.1';
        const defaultModel = togetherModelsData.find(m => m.id === preferredDefault) ? preferredDefault : togetherModelsData[0].id;
        setSelectedModel(defaultModel);
      } else if (togetherModelsData.length === 0 && selectedModel !== undefined) {
          setSelectedModel(undefined); 
      }
    } else if (selectedProvider === 'gemini' && geminiModelsData) {
      setAvailableModels(geminiModelsData);
      if (!geminiModelsData.find(m => m.id === selectedModel) && geminiModelsData.length > 0) {
        const preferredDefaults = ['models/gemini-1.5-pro-001', 'models/gemini-1.5-flash-001'];
        let defaultModel = geminiModelsData[0].id;
        for (const pref of preferredDefaults) {
          if (geminiModelsData.find(m => m.id === pref)) {
            defaultModel = pref;
            break;
          }
        }
        setSelectedModel(defaultModel);
      } else if (geminiModelsData.length === 0 && selectedModel !== undefined) {
        setSelectedModel(undefined);
      }
    } else {
      setAvailableModels([]);
      // Don't reset selectedModel here, only when provider changes or no models are available for current provider
    }
  }, [selectedProvider, openAIModelsData, togetherModelsData, geminiModelsData, selectedModel]);

  const handleSave = async () => {
    if (!selectedProvider) {
      toast.error('Please select an LLM provider.');
      return;
    }

    if (!selectedTranscriptionModel) {
      toast.error('Please select a Transcription model.');
      return;
    }

    if ((selectedProvider === 'openai' || selectedProvider === 'together' || selectedProvider === 'gemini') && !selectedModel && availableModels.length > 0) {
      let providerName = '';
      if (selectedProvider === 'openai') providerName = 'OpenAI';
      else if (selectedProvider === 'together') providerName = 'Together AI';
      else if (selectedProvider === 'gemini') providerName = 'Gemini';
      toast.error(`Please select a ${providerName} model.`);
      return;
    }
    
    const settingsToSave: {
      llmProvider: string;
      openaiModel?: string;
      togetherModel?: string;
      geminiModel?: string; 
      transcriptionModelIdentifier?: string;
    } = {
      llmProvider: selectedProvider,
      openaiModel: selectedProvider !== 'openai' ? currentUserSettings?.openaiModel : undefined,
      togetherModel: selectedProvider !== 'together' ? currentUserSettings?.togetherModel : undefined,
      geminiModel: selectedProvider !== 'gemini' ? currentUserSettings?.geminiModel : undefined,
      transcriptionModelIdentifier: selectedTranscriptionModel,
    };

    if (selectedProvider === 'openai') {
      settingsToSave.openaiModel = selectedModel || ''; 
    } else if (selectedProvider === 'together') {
      settingsToSave.togetherModel = selectedModel || ''; 
    } else if (selectedProvider === 'gemini') {
      settingsToSave.geminiModel = selectedModel || ''; 
    }

    try {
      await saveUserSettings(settingsToSave);
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(`Failed to save settings: ${error.message || 'Unknown error'}`);
    }
  };

  const handleProviderChange = (newProvider: string) => {
    setSelectedProvider(newProvider);
    setSelectedModel(undefined); // Reset model when provider changes
    setAvailableModels([]);    // Clear available models immediately
    // Data for the new provider will be fetched by its respective useEffect
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
            onChange={(e) => handleProviderChange(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          >
            <option value="together">Together AI</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>

        {selectedProvider === 'openai' && (
          <div>
            <label htmlFor="openaiModel" className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI Model
            </label>
            {isLoadingOpenAIModels && <p>Loading OpenAI models...</p>}
            {openAIModelsError && <p className="text-red-600">Error: {openAIModelsError}</p>}
            {!isLoadingOpenAIModels && !openAIModelsError && (!openAIModelsData || openAIModelsData.length === 0) && (
              <p>No OpenAI models available. Ensure API key is correct in Convex and models are accessible.</p>
            )}
            {availableModels.length > 0 && (
              <select
                id="openaiModel"
                value={selectedModel || ''}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isLoadingOpenAIModels || availableModels.length === 0}
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

        {selectedProvider === 'together' && (
          <div>
            <label htmlFor="togetherModel" className="block text-sm font-medium text-gray-700 mb-1">
              Together AI Model
            </label>
            {isLoadingTogetherModels && <p>Loading Together AI models...</p>}
            {togetherModelsError && <p className="text-red-600">Error: {togetherModelsError}</p>}
            {!isLoadingTogetherModels && !togetherModelsError && (!togetherModelsData || togetherModelsData.length === 0) && (
              <p>No Together AI models available. Ensure API key is correct in Convex and models are accessible.</p>
            )}
            {availableModels.length > 0 && (
              <select
                id="togetherModel"
                value={selectedModel || ''}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isLoadingTogetherModels || availableModels.length === 0}
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
              Ensure your TOGETHER_API_KEY is set in Convex environment variables.
            </p>
          </div>
        )}

        {selectedProvider === 'gemini' && (
          <div>
            <label htmlFor="geminiModelSelect" className="block text-sm font-medium text-gray-700 mb-1">
              Gemini Model
            </label>
            {isLoadingGeminiModels && <p>Loading Gemini models...</p>}
            {geminiModelsError && <p className="text-red-600">Error: {geminiModelsError}</p>}
            {!isLoadingGeminiModels && !geminiModelsError && (!geminiModelsData || geminiModelsData.length === 0) && (
              <p>No Gemini models available. Ensure API key is correct in Convex and models are accessible.</p>
            )}
            {availableModels.length > 0 && (
              <select
                id="geminiModelSelect"
                value={selectedModel || ''}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                disabled={isLoadingGeminiModels || !!geminiModelsError || !geminiModelsData || geminiModelsData.length === 0}
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.id})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Transcription Settings
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Choose your preferred transcription model. Changes will apply to new recordings.
            </p>
            <RadioGroup
              value={selectedTranscriptionModel}
              onValueChange={setSelectedTranscriptionModel}
              className="space-y-2"
              aria-label="Transcription Model"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default_whisper" id="default_whisper" />
                <Label htmlFor="default_whisper" className="font-normal cursor-pointer">
                  Default Whisper (large-v3 via Replicate) - High accuracy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fast_whisper" id="fast_whisper" />
                <Label htmlFor="fast_whisper" className="font-normal cursor-pointer">
                  Incredibly Fast Whisper (via Replicate) - Faster, good accuracy
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="mt-12 flex justify-end">
          <Button onClick={handleSave} disabled={!selectedProvider || (isLoadingOpenAIModels || isLoadingTogetherModels || isLoadingGeminiModels)}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
