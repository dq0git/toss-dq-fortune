import { Routes, Route } from 'react-router-dom';
import './App.css'
import IndexPage from './pages/index';
import TopicSelectionPage from './pages/topic-selection';
import SubTopicSelectionPage from './pages/subtopic-selection';
import CardSelectionPage from './pages/card-selection';
import ResultPage from './pages/result';
import TarotResultPage from './pages/tarot-result';
import DailyCardPage from './pages/daily-card';
import TarotTalismanPage from './pages/tarot-talisman';
import CameraPage from './pages/camera';
import FeaturesPage from './pages/features';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/topic-selection" element={<TopicSelectionPage />} />
        <Route path="/subtopic-selection" element={<SubTopicSelectionPage />} />
        <Route path="/card-selection" element={<CardSelectionPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/tarot-result" element={<TarotResultPage />} />
        <Route path="/daily-card" element={<DailyCardPage />} />
        <Route path="/tarot-talisman" element={<TarotTalismanPage />} />
        <Route path="/camera" element={<CameraPage />} />
        <Route path="/features" element={<FeaturesPage />} />
      </Routes>
    </div>
  )
}

export default App
