import { Routes, Route } from 'react-router-dom';
import './App.css'
import IndexPage from './pages/index';
import TopicSelectionPage from './pages/topic-selection';
import SubTopicSelectionPage from './pages/subtopic-selection';
import CardSelectionPage from './pages/card-selection';
import ResultPage from './pages/result';
import DailyCardPage from './pages/daily-card';
import TarotTalismanPage from './pages/tarot-talisman';
import CameraPage from './pages/camera';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/topic-selection" element={<TopicSelectionPage />} />
        <Route path="/subtopic-selection" element={<SubTopicSelectionPage />} />
        <Route path="/card-selection" element={<CardSelectionPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/daily-card" element={<DailyCardPage />} />
        <Route path="/tarot-talisman" element={<TarotTalismanPage />} />
        <Route path="/camera" element={<CameraPage />} />
      </Routes>
    </div>
  )
}

export default App
