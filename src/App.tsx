import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { QueueManager } from './components/Queue/QueueManager';
import { TranslationQueue } from './components/Queue/TranslationQueue';
import { ContentTypeManager } from './components/ContentTypes/ContentTypeManager';
import { TranslationHistoryView } from './components/History/TranslationHistory';
import { SaleorSettings } from './components/Settings/SaleorSettings';
import { EnhancedTranslationEditor } from './components/Translations/EnhancedTranslationEditor';
import { BulkContentProcessor } from './components/Translations/BulkContentProcessor';
import { DeepLTranslationManager } from './components/Translations/DeepLTranslationManager';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/translations" element={
            <div className="space-y-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-900">Enhanced Translation System</h2>
                <p className="text-gray-500 mt-2">Content-aware translation with structure preservation and DeepL integration</p>
              </div>
              <DeepLTranslationManager />
              <BulkContentProcessor onProcessingComplete={(results) => console.log('Processing complete:', results)} />
            </div>
          } />
          <Route path="/projects" element={<ContentTypeManager />} />
          <Route path="/queue" element={<TranslationQueue />} />
          <Route path="/history" element={<TranslationHistoryView />} />
          <Route path="/analytics" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Analytics</h2><p className="text-gray-500 mt-2">Advanced analytics coming soon...</p></div>} />
          <Route path="/settings" element={<SaleorSettings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;