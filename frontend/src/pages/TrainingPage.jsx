import React, { useState, useEffect} from 'react';
import { AlertCircle, CheckCircle, Upload, Play, Download, RotateCcw } from 'lucide-react';
import NavBar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const TrainingPage = () => {
const navigate = useNavigate();

const [isDarkMode, setIsDarkMode] = useState(false);
  
// Check system preference on initial load
useEffect(() => {
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setIsDarkMode(prefersDarkMode);
  
}, [navigate]);

// Update dark mode class on body
useEffect(() => {
  if (isDarkMode) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}, [isDarkMode]);

const toggleDarkMode = () => {
  setIsDarkMode(!isDarkMode);
};

  const [dataset, setDataset] = useState(null);
  const [model, setModel] = useState('linear-regression');
  const [hyperparameters, setHyperparameters] = useState({
    learningRate: 0.01,
    epochs: 100,
    batchSize: 32,
    optimizer: 'adam',
  });
  const [trainingStatus, setTrainingStatus] = useState('idle'); // idle, training, complete, error
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingResults, setTrainingResults] = useState(null);

  // Model options
  const modelOptions = [
    { value: 'workout-classification', label: 'Workout Classification' },
    { value: 'muscle-activation', label: 'Muscle Group Activation' },
    { value: 'displacement-values', label: 'Displacement Estimation Values' },
  ];

  // Optimizer options
  const optimizerOptions = [
    { value: 'adam', label: 'Adam' },
    { value: 'sgd', label: 'Stochastic Gradient Descent' },
    { value: 'rmsprop', label: 'RMSProp' },
    { value: 'adagrad', label: 'AdaGrad' },
  ];

  // Handle dataset upload
  const handleDatasetUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // In a real application, you would process the file here
      setDataset({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: file.type,
      });
    }
  };

  // Handle hyperparameter changes
  const handleHyperparameterChange = (param, value) => {
    setHyperparameters({
      ...hyperparameters,
      [param]: param === 'optimizer' ? value : parseFloat(value),
    });
  };

  // Start training
  const startTraining = () => {
    if (!dataset) {
      alert('Please choose a dataset first');
      return;
    }
    
    setTrainingStatus('training');
    setTrainingProgress(0);

    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        const newProgress = prev + Math.random() * 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTrainingStatus('complete');
          setTrainingResults({
            accuracy: (80 + Math.random() * 15).toFixed(2) + '%',
            loss: (0.1 + Math.random() * 0.2).toFixed(4),
            trainTime: (10 + Math.random() * 50).toFixed(1) + ' seconds',
          });
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };

  // Reset training
  const resetTraining = () => {
    setTrainingStatus('idle');
    setTrainingProgress(0);
    setTrainingResults(null);
  };

  return (
    <section className={`overflow-scroll fixed inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-indigo-500':'bg-gradient-to-br from-gray-100 to-indigo-500'}`}>
    <NavBar isDarkMode={isDarkMode} />
    <main>
      <div className="max-w-4xl mx-auto mt-2 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-indigo-600 p-6">
          <h1 className="text-2xl font-bold text-white">Model Training</h1>
          <p className="text-blue-100 mt-2"></p>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Choose Dataset</h2>
            <div className="flex flex-col">
                <input placeholder="Enter URL to dataset" value={dataset} className="border border-gray-300 rounded p-2 w-full"></input>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Model</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modelOptions.map((modelOption) => (
                <div
                  key={modelOption.value}
                  className={`border rounded-lg p-4 cursor-pointer ${
                    model === modelOption.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setModel(modelOption.value)}
                >
                  <h3 className="font-medium">{modelOption.label}</h3>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Configure Hyperparameters</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Learning Rate</label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded p-2 w-full"
                    value={hyperparameters.learningRate}
                    min="0.0001"
                    max="1"
                    step="0.001"
                    onChange={(e) => handleHyperparameterChange('learningRate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Epochs</label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded p-2 w-full"
                    value={hyperparameters.epochs}
                    min="1"
                    max="1000"
                    onChange={(e) => handleHyperparameterChange('epochs', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
                  <input
                    type="number"
                    className="border border-gray-300 rounded p-2 w-full"
                    value={hyperparameters.batchSize}
                    min="1"
                    max="256"
                    onChange={(e) => handleHyperparameterChange('batchSize', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Training Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Train Your Model</h2>
            {trainingStatus === 'idle' ? (
              <button
                className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg flex items-center"
                onClick={startTraining}
                disabled={!dataset}
              >
                <Play size={20} className="mr-2" />
                Start Training
              </button>
            ) : (
              <div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{trainingStatus === 'complete' ? 'Training complete!' : 'Training in progress...'}</span>
                    <span>{Math.round(trainingProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${trainingStatus === 'error' ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${trainingProgress}%` }}
                    ></div>
                  </div>
                </div>

                {trainingStatus === 'complete' && trainingResults && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-green-800 mb-2">Training Results</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Accuracy</p>
                        <p className="font-bold text-lg">{trainingResults.accuracy}</p>
                      </div>
                      <div className="bg-white rounded p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Loss</p>
                        <p className="font-bold text-lg">{trainingResults.loss}</p>
                      </div>
                      <div className="bg-white rounded p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Training Time</p>
                        <p className="font-bold text-lg">{trainingResults.trainTime}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center">
                        <Download size={16} className="mr-1" />
                        Download Model
                      </button>
                      <button
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded flex items-center"
                        onClick={resetTraining}
                      >
                        <RotateCcw size={16} className="mr-1" />
                        Train Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
    </section>
  );
};

export default TrainingPage;