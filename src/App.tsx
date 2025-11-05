import { useState } from 'react'
import './App.css'
import MainScreen from './components/MainScreen'
import TopicSelection from './components/TopicSelection'
import SubTopicSelection from './components/SubTopicSelection'
import CardSelection from './components/CardSelection'
import ResultScreen from './components/ResultScreen'
import DailyCard from './components/DailyCard'

function App() {
  const [currentScreen, setCurrentScreen] = useState('main')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedSubTopic, setSelectedSubTopic] = useState(null)
  const [selectedCards, setSelectedCards] = useState([])
  const [readingResult, setReadingResult] = useState(null)

  const handleScreenChange = (screen) => {
    setCurrentScreen(screen)
  }

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic)
    if (topic === 'general') {
      setCurrentScreen('card-selection')
    } else {
      setCurrentScreen('subtopic-selection')
    }
  }

  const handleSubTopicSelect = (subTopic) => {
    setSelectedSubTopic(subTopic)
    setCurrentScreen('card-selection')
  }

  const handleCardsSelect = (cards) => {
    setSelectedCards(cards)
    setCurrentScreen('result')
  }

  const handleBackToMain = () => {
    setCurrentScreen('main')
    setSelectedTopic(null)
    setSelectedSubTopic(null)
    setSelectedCards([])
    setReadingResult(null)
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'main':
        return <MainScreen onScreenChange={handleScreenChange} />
      case 'topic-selection':
        return <TopicSelection onTopicSelect={handleTopicSelect} onBack={handleBackToMain} />
      case 'subtopic-selection':
        return (
          <SubTopicSelection 
            topic={selectedTopic} 
            onSubTopicSelect={handleSubTopicSelect} 
            onBack={() => setCurrentScreen('topic-selection')} 
          />
        )
      case 'card-selection':
        return (
          <CardSelection 
            topic={selectedTopic} 
            subTopic={selectedSubTopic} 
            onCardsSelect={handleCardsSelect} 
            onBack={() => {
              if (selectedTopic === 'general') {
                setCurrentScreen('topic-selection')
              } else {
                setCurrentScreen('subtopic-selection')
              }
            }} 
          />
        )
      case 'result':
        return (
          <ResultScreen 
            topic={selectedTopic} 
            subTopic={selectedSubTopic} 
            cards={selectedCards} 
            onBackToMain={handleBackToMain} 
          />
        )
      case 'daily-card':
        return <DailyCard onBack={handleBackToMain} />
      default:
        return <MainScreen onScreenChange={handleScreenChange} />
    }
  }

  return (
    <div className="App">
      {renderScreen()}
    </div>
  )
}

export default App
