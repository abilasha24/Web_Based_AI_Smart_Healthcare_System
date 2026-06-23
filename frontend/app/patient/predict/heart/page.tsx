'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoRecommendations from '@/components/VideoRecommendations';
import { API_URL } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { validateRequiredNumber, firstError } from '@/lib/validations';
import { showSuccess, showError } from '@/lib/alerts';

const normalizeRecommendations = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
};

export default function HeartDiseasePrediction() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    age: '',
    sex: '1',
    chest_pain_type: '1',
    resting_bp: '',
    serum_cholesterol: '',
    fasting_blood_sugar: '0',
    resting_ecg: '0',
    max_heart_rate: '',
    exercise_induced_angina: '0',
    st_depression: '0.0',
    slope: '1',
    num_major_vessels: '0',
    thalassemia: '2',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationErr = firstError(
      validateRequiredNumber(formData.age, 'Age', 1, 120),
      validateRequiredNumber(formData.resting_bp, 'Resting blood pressure', 0, 300),
      validateRequiredNumber(formData.serum_cholesterol, 'Serum cholesterol', 0, 600),
      validateRequiredNumber(formData.max_heart_rate, 'Max heart rate', 0, 250),
      validateRequiredNumber(formData.st_depression, 'ST depression', 0, 10),
    );
    if (validationErr) {
      setError(validationErr);
      await showError('Please fill all required fields', validationErr);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/predictions/heart-disease`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          age: parseInt(formData.age),
          sex: parseInt(formData.sex),
          chest_pain_type: parseInt(formData.chest_pain_type),
          resting_bp: parseFloat(formData.resting_bp),
          serum_cholesterol: parseFloat(formData.serum_cholesterol),
          fasting_blood_sugar: parseInt(formData.fasting_blood_sugar),
          resting_ecg: parseInt(formData.resting_ecg),
          max_heart_rate: parseFloat(formData.max_heart_rate),
          exercise_induced_angina: parseInt(formData.exercise_induced_angina),
          st_depression: parseFloat(formData.st_depression),
          slope: parseInt(formData.slope),
          num_major_vessels: parseInt(formData.num_major_vessels),
          thalassemia: parseInt(formData.thalassemia),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        await showSuccess('Prediction completed', 'Your heart disease risk assessment result is ready.');
      } else {
        const errorData = await response.json();
        const msg = errorData.detail || 'Prediction failed';
        setError(msg);
        await showError('Prediction failed', msg);
      }
    } catch (err) {
      const msg = 'Connection error. Make sure backend is running.';
      setError(msg);
      await showError('Connection error', msg);
    } finally {
      setLoading(false);
    }
  };

  const riskColors: any = {
    Critical: 'from-red-500 to-red-600',
    High: 'from-orange-500 to-orange-600',
    Medium: 'from-yellow-500 to-yellow-600',
    Low: 'from-green-500 to-green-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 py-4">
      <div className="max-w-6xl mx-auto px-4">
        <Link 
          href="/patient/dashboard" 
          className="inline-flex items-center gap-2 text-red-600 hover:text-red-800 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('backToDashboard')}
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                ❤️
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Heart Disease Risk Prediction</h1>
                <p className="text-red-100">Enter your cardiovascular parameters to assess your heart disease risk</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-lg mb-4 animate-shake">
                {error}
              </div>
            )}

            {result ? (
              <div className="space-y-6">
                <div className={`bg-gradient-to-r ${riskColors[result.risk_level] || riskColors.Medium} text-white p-8 rounded-2xl shadow-xl`}>
                  <h2 className="text-3xl font-bold mb-6">{t('predictionResult')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                      <p className="text-white/80 mb-1">{t('riskLevel')}</p>
                      <p className="text-2xl font-bold">{result.risk_level}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                      <p className="text-white/80 mb-1">{t('riskPercentage')}</p>
                      <p className="text-2xl font-bold">{result.risk_percentage}%</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                      <p className="text-white/80 mb-1">{t('prediction')}</p>
                      <p className="text-2xl font-bold">{result.prediction}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                      <p className="text-white/80 mb-1">{t('confidence')}</p>
                      <p className="text-2xl font-bold">{result.confidence}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-bold text-lg mb-4">{t('recommendationsTitle')}</h3>
                  <ul className="list-disc pl-5 text-gray-700 space-y-2">
                    {(normalizeRecommendations(result.recommendation).length
                      ? normalizeRecommendations(result.recommendation)
                      : [t('followHealthyFallback')]
                    ).map((item: string, index: number) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>

                {(result as any).doctor_recommendation?.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                    <h3 className="font-bold text-lg mb-4 text-blue-800">{t('forYourDoctor')}</h3>
                    <p className="text-sm text-blue-700 mb-3">{t('clinicalFollowUp')}</p>
                    <ul className="list-disc pl-5 text-blue-800 space-y-2">
                      {normalizeRecommendations((result as any).doctor_recommendation).map((item: string, index: number) => (
                        <li key={`dr-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <VideoRecommendations videos={result.video_recommendations || []} />

                <button
                  onClick={() => {
                    setResult(null);
                    setFormData({
                      age: '',
                      sex: '1',
                      chest_pain_type: '1',
                      resting_bp: '',
                      serum_cholesterol: '',
                      fasting_blood_sugar: '0',
                      resting_ecg: '0',
                      max_heart_rate: '',
                      exercise_induced_angina: '0',
                      st_depression: '0.0',
                      slope: '1',
                      num_major_vessels: '0',
                      thalassemia: '2',
                    });
                  }}
                  className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-colors font-semibold text-lg"
                >
                  {t('makeAnotherPrediction')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Age <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                      min="0"
                      max="120"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                      placeholder="Enter your age"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.sex}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                    >
                      <option value="1">Male</option>
                      <option value="0">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Chest Pain Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.chest_pain_type}
                      onChange={(e) => setFormData({ ...formData, chest_pain_type: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                    >
                      <option value="0">Typical Angina</option>
                      <option value="1">Atypical Angina</option>
                      <option value="2">Non-anginal Pain</option>
                      <option value="3">Asymptomatic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Resting Blood Pressure (mmHg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.resting_bp}
                      onChange={(e) => setFormData({ ...formData, resting_bp: e.target.value })}
                      required
                      min="0"
                      max="300"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                      placeholder="Normal: 90-120 mmHg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Serum Cholesterol (mg/dl) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.serum_cholesterol}
                      onChange={(e) => setFormData({ ...formData, serum_cholesterol: e.target.value })}
                      required
                      min="0"
                      max="600"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                      placeholder="Normal: <200 mg/dl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Fasting Blood Sugar &gt; 120 mg/dl <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.fasting_blood_sugar}
                      onChange={(e) => setFormData({ ...formData, fasting_blood_sugar: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                    >
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Resting ECG Results <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.resting_ecg}
                      onChange={(e) => setFormData({ ...formData, resting_ecg: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                    >
                      <option value="0">Normal</option>
                      <option value="1">ST-T Wave Abnormality</option>
                      <option value="2">Left Ventricular Hypertrophy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Maximum Heart Rate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.max_heart_rate}
                      onChange={(e) => setFormData({ ...formData, max_heart_rate: e.target.value })}
                      required
                      min="0"
                      max="220"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                      placeholder="Normal: 60-100 bpm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Exercise Induced Angina <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.exercise_induced_angina}
                      onChange={(e) => setFormData({ ...formData, exercise_induced_angina: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                    >
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      ST Depression <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.st_depression}
                      onChange={(e) => setFormData({ ...formData, st_depression: e.target.value })}
                      required
                      min="0"
                      max="10"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                      placeholder="0.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Slope <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.slope}
                      onChange={(e) => setFormData({ ...formData, slope: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                    >
                      <option value="0">Upsloping</option>
                      <option value="1">Flat</option>
                      <option value="2">Downsloping</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Number of Major Vessels <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.num_major_vessels}
                      onChange={(e) => setFormData({ ...formData, num_major_vessels: e.target.value })}
                      required
                      min="0"
                      max="4"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                      placeholder="0-4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Thalassemia <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.thalassemia}
                      onChange={(e) => setFormData({ ...formData, thalassemia: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                    >
                      <option value="0">Null</option>
                      <option value="1">Normal</option>
                      <option value="2">Fixed Defect</option>
                      <option value="3">Reversible Defect</option>
                    </select>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Please provide accurate information from your medical tests for the most reliable prediction.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-xl hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    'Get Heart Disease Risk Prediction'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
